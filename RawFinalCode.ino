#include <HX711_ADC.h>
#include <EEPROM.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>
#include "BluetoothSerial.h"




// ------------------- BLUETOOTH --------------------
BluetoothSerial SerialBT;




// ------------------- LOAD CELL --------------------
const int HX711_dout = 4;
const int HX711_sck  = 5;
HX711_ADC LoadCell(HX711_dout, HX711_sck);
const int calVal_eepromAdress = 0;




// ------------------- TEMPERATURE SENSOR --------------------
#define ONE_WIRE_BUS 15
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);




// ------------------- SERVO --------------------
Servo myservo;
int servoPin = 23;




// Helper to write a 0..360 "angle" to the servo by mapping to microsecond pulses.
// This lets you address the servo as if it had a 360° range.
void writeServo360(int angle) {
  angle = constrain(angle, 0, 360);
  // Map 0..360 to pulse range used in attach(servoPin, 500, 2400)
  int pulse = map(angle, 0, 360, 500, 2400);
  myservo.writeMicroseconds(pulse);
}




// ------------------- TIMING / FILTER -------------------
const float FAST_ALPHA = 0.90f;
const float SLOW_ALPHA = 0.40f;
const float JUMP_THRESHOLD_KG = 0.02f;
const float DETECT_THRESHOLD_KG = 0.02f;
const float TEMP_SAFE_LIMIT = 33.0f;
const unsigned long TEMP_INTERVAL_MS = 2000UL;




// ------------------- SERVO TIMING -----------------
int servoAngle = 0;        // current servo angle (0..360 now)
int servoDir = 1;          // direction for idle sweep
unsigned long lastServoStep = 0;
unsigned long servoStepInterval = 20; // ms between servo steps
int idleServoStep = 5;               // degrees per idle step




// ------------------- FEEDING PARAMETERS -----------------
bool feedRequestActive = false;
float targetKg = 0.0f;         // kg requested from Android
float startWeight = 0.0f;      // weight at start of feeding
unsigned long feedStartTime = 0;
const unsigned long FEED_MAX_DURATION_MS = 30000UL; // 30s safety timeout
const float FEED_MAX_KG = 5.0f; // max allowed feed request




// feeding servo motion while dispensing
int feedOpenAngle = 130;     // angle considered "open" to release feed
int feedCloseAngle = 30;     // angle closed (resting)
int feedServoDir = 1;
int feedServoStep = 8;       // degrees per feed step
unsigned long feedServoInterval = 60; // ms between feed steps
unsigned long lastFeedServoTime = 0;




// ------------------- VARIABLES --------------------
float filteredKg = 0.0f;
float rawBuf = 0.0f;
unsigned long lastTempTime = 0;
float lastTemp = 0.0f;




void setup() {
  Serial.begin(115200);
  delay(10);




  // ---------- EEPROM ----------
  EEPROM.begin(512);




  // ---------- LOAD CELL ----------
  LoadCell.begin();
  float calibrationValue = 20188.57;
  EEPROM.get(calVal_eepromAdress, calibrationValue);
  if (!(calibrationValue > 0.0 && calibrationValue < 1e9)) {
    calibrationValue = 20188.57;
    EEPROM.put(calVal_eepromAdress, calibrationValue);
    EEPROM.commit();
  }
  LoadCell.setCalFactor(calibrationValue);
  LoadCell.start(2000, true);




  // ---------- TEMPERATURE ----------
  sensors.begin();




  // ---------- SERVO ----------
  myservo.attach(servoPin, 500, 2400);
  servoAngle = feedCloseAngle;
  writeServo360(servoAngle);
  lastServoStep = millis();
  lastFeedServoTime = millis();
  lastTempTime = millis();




  // ---------- BLUETOOTH ----------
  SerialBT.begin("FeedFlow");
  Serial.println("Bluetooth started. Pair with 'FeedFlow'");
  SerialBT.println("READY");
}




void loop() {
  unsigned long now = millis();




  // ----- TEMPERATURE SAFETY -----
  if (lastTemp >= TEMP_SAFE_LIMIT) {
    feedRequestActive = false;
    servoAngle = feedCloseAngle;
    writeServo360(servoAngle);
    SerialBT.println("TEMP_TOO_HIGH");
    Serial.println("TEMP TOO HIGH — SERVO STOPPED!");
    return;
  }




  // ----- UPDATE LOAD CELL -----
  if (LoadCell.update()) {
    rawBuf = LoadCell.getData();
    float diff = fabs(rawBuf - filteredKg);
    float alpha = (diff > JUMP_THRESHOLD_KG) ? FAST_ALPHA : SLOW_ALPHA;
    filteredKg = alpha * rawBuf + (1.0f - alpha) * filteredKg;
  }




  // ----- READ TEMPERATURE + SEND VIA BLUETOOTH -----
  if (now - lastTempTime >= TEMP_INTERVAL_MS) {
    sensors.requestTemperatures();
    float tempC = sensors.getTempCByIndex(0);
    if (isnan(tempC)) tempC = 0.0f;
    lastTemp = tempC;




    float outKg = (filteredKg >= DETECT_THRESHOLD_KG) ? filteredKg : 0.0f;




    Serial.print("TEMP: "); Serial.print(tempC, 2);
    Serial.print(" C, WEIGHT: "); Serial.print(outKg, 3);
    Serial.print(" kg, SERVO: "); Serial.println(servoAngle);




    String btData = String(tempC, 2) + "," + String(outKg, 3) + "," +
                    String(servoAngle) + "," + String(feedRequestActive ? 1 : 0);
    SerialBT.println(btData);




    lastTempTime = now;
  }




  // ----- CHECK FOR BLUETOOTH COMMANDS -----
  if (SerialBT.available()) {
    String cmd = SerialBT.readStringUntil('\n');
    cmd.trim();
    Serial.print("BT RX: "); Serial.println(cmd);




    if (cmd.startsWith("FEED_NOW:")) {
      float req = cmd.substring(9).toFloat();
      if (req > 0.0f && req <= FEED_MAX_KG) {
        targetKg = req;
        startWeight = filteredKg;
        feedRequestActive = true;
        feedStartTime = now;
        lastFeedServoTime = now;
        servoAngle = feedCloseAngle;
        writeServo360(servoAngle);
        SerialBT.println("FEEDING_STARTED");
      } else {
        SerialBT.println("INVALID_AMOUNT");
      }
    } else if (cmd == "PING") {
      SerialBT.println("PONG");
    } else {
      SerialBT.println("UNKNOWN_CMD");
    }
  }




  // ----- FEEDING LOGIC -----
  if (feedRequestActive) {
    // safety timeout
    if (now - feedStartTime > FEED_MAX_DURATION_MS) {
      feedRequestActive = false;
      SerialBT.println("FEED_TIMEOUT");
      servoAngle = feedCloseAngle;
      writeServo360(servoAngle);
    } else {
      float dispensed = filteredKg - startWeight;
      if (dispensed < 0) dispensed = 0;




      if (dispensed >= targetKg) {
        feedRequestActive = false;
        SerialBT.println("FEEDING_DONE");
        servoAngle = feedCloseAngle;
        writeServo360(servoAngle);
      } else if (now - lastFeedServoTime >= feedServoInterval) {
        // dispense feed
        servoAngle += feedServoDir * feedServoStep;
        if (servoAngle >= feedOpenAngle) feedServoDir = -1;
        if (servoAngle <= feedCloseAngle) feedServoDir = 1;
        writeServo360(servoAngle);
        lastFeedServoTime = now;
      }
    }
  } else {
    // ----- REST POSITION -----
    servoAngle = feedCloseAngle;
    writeServo360(servoAngle);
  }
}











