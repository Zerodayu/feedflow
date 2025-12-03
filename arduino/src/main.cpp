#include <HX711_ADC.h>
#include <EEPROM.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP32Servo.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// BLE UUIDs
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID_DATA "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHAR_UUID_COMMAND "beb5483e-36e1-4688-b7f5-ea07361b26a9"

BLEServer *pServer = NULL;
BLECharacteristic *pCharData = NULL;
BLECharacteristic *pCharCommand = NULL;
bool deviceConnected = false;

// ------------------- LOAD CELL --------------------
const int HX711_dout = 4;
const int HX711_sck = 5;
HX711_ADC LoadCell(HX711_dout, HX711_sck);
const int calVal_eepromAdress = 0;

// ------------------- TEMPERATURE SENSOR --------------------
#define ONE_WIRE_BUS 15
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// ------------------- SERVO --------------------
Servo myservo;
int servoPin = 23;

// ------------------- TIMING / FILTER -------------------
const float FAST_ALPHA = 0.90f;
const float SLOW_ALPHA = 0.40f;
const float JUMP_THRESHOLD_KG = 0.02f;
const float DETECT_THRESHOLD_KG = 0.02f;
const unsigned long TEMP_INTERVAL_MS = 2000UL;

// ------------------- SERVO POSITIONS -----------------
int feedOpenAngle = 130;   // Servo runs (dispenses)
int feedCloseAngle = 30;   // Servo stops
int servoAngle = 30;

// ------------------- FEEDING PARAMETERS -----------------
bool feedRequestActive = false;
bool manualServoControl = false;  // Add this line
float targetKg = 0.0f;
float startWeight = 0.0f;
unsigned long feedStartTime = 0;
const unsigned long FEED_MAX_DURATION_MS = 30000UL;
const float FEED_MAX_KG = 5.0f;

// ------------------- VARIABLES --------------------
float filteredKg = 0.0f;
float rawBuf = 0.0f;
unsigned long lastTempTime = 0;
float lastTemp = 0.0f;

// Helper to write a 0..360 "angle" to the servo
void writeServo360(int angle)
{
  angle = constrain(angle, 0, 360);
  int pulse = map(angle, 0, 360, 500, 2400);
  myservo.writeMicroseconds(pulse);
}

// BLE Callbacks
class MyServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer *pServer)
  {
    deviceConnected = true;
    Serial.println("BLE Client Connected");
  };

  void onDisconnect(BLEServer *pServer)
  {
    deviceConnected = false;
    Serial.println("BLE Client Disconnected");
    pServer->startAdvertising();
  }
};

class CommandCallbacks : public BLECharacteristicCallbacks
{
  void onWrite(BLECharacteristic *pCharacteristic)
  {
    std::string value = pCharacteristic->getValue();
    if (value.length() > 0)
    {
      String cmd = String(value.c_str());
      cmd.trim();
      Serial.print("BLE RX: ");
      Serial.println(cmd);

      if (cmd.startsWith("FEED_NOW:"))
      {
        float req = cmd.substring(9).toFloat();
        if (req > 0.0f && req <= FEED_MAX_KG)
        {
          targetKg = req;
          startWeight = filteredKg;
          feedRequestActive = true;
          feedStartTime = millis();
          servoAngle = feedOpenAngle;  // Open servo to start dispensing
          writeServo360(servoAngle);
          pCharData->setValue("FEEDING_STARTED");
          pCharData->notify();
          Serial.println("Servo OPEN - Dispensing...");
        }
      }
      else if (cmd == "SERVO_OPEN")
      {
        servoAngle = feedOpenAngle;
        writeServo360(servoAngle);
        Serial.println("Manual: Servo OPEN");
      }
      else if (cmd == "SERVO_CLOSE")
      {
        servoAngle = feedCloseAngle;
        writeServo360(servoAngle);
        Serial.println("Manual: Servo CLOSE");
      }
    }
  }
};

void setup()
{
  Serial.begin(115200);
  delay(10);

  // ---------- EEPROM ----------
  EEPROM.begin(512);

  // ---------- LOAD CELL ----------
  LoadCell.begin();
  float calibrationValue = 20188.57;
  EEPROM.get(calVal_eepromAdress, calibrationValue);
  if (!(calibrationValue > 0.0 && calibrationValue < 1e9))
  {
    calibrationValue = 20188.57;
    EEPROM.put(calVal_eepromAdress, calibrationValue);
    EEPROM.commit();
  }
  LoadCell.setCalFactor(calibrationValue);
  LoadCell.start(2000, true);

  // ---------- TEMPERATURE ----------
  sensors.begin();
  Serial.print("Found ");
  Serial.print(sensors.getDeviceCount());
  Serial.println(" DS18B20 devices");

  // ---------- SERVO ----------
  myservo.attach(servoPin, 500, 2400);
  servoAngle = feedCloseAngle;  // Start in closed position
  writeServo360(servoAngle);
  lastTempTime = millis();

  // ---------- BLE ----------
  BLEDevice::init("FeedFlow");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharData = pService->createCharacteristic(
      CHAR_UUID_DATA,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  pCharData->addDescriptor(new BLE2902());

  pCharCommand = pService->createCharacteristic(
      CHAR_UUID_COMMAND,
      BLECharacteristic::PROPERTY_WRITE);
  pCharCommand->setCallbacks(new CommandCallbacks());

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.println("BLE started. Device name: FeedFlow");
  Serial.println("Ready. Servo in CLOSED position.");
}

void loop()
{
  unsigned long now = millis();

  // ----- CHECK SERIAL COMMANDS -----
  if (Serial.available() > 0)
  {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    Serial.print("Serial RX: ");
    Serial.println(cmd);

    if (cmd.startsWith("FEED_NOW:"))
    {
      float req = cmd.substring(9).toFloat();
      if (req > 0.0f && req <= FEED_MAX_KG)
      {
        manualServoControl = false;  // Exit manual mode
        targetKg = req;
        startWeight = filteredKg;
        feedRequestActive = true;
        feedStartTime = millis();
        servoAngle = feedOpenAngle;
        writeServo360(servoAngle);
        Serial.println("FEEDING_STARTED - Servo OPEN");
      }
      else
      {
        Serial.println("Invalid feed amount. Use 0.1 to 5.0 kg");
      }
    }
    else if (cmd == "SERVO_OPEN")
    {
      manualServoControl = true;  // Enter manual mode
      feedRequestActive = false;  // Stop auto feeding
      servoAngle = feedOpenAngle;
      writeServo360(servoAngle);
      Serial.println("Manual: Servo OPEN");
    }
    else if (cmd == "SERVO_CLOSE")
    {
      manualServoControl = false;  // Exit manual mode
      feedRequestActive = false;   // Stop auto feeding
      servoAngle = feedCloseAngle;
      writeServo360(servoAngle);
      Serial.println("Manual: Servo CLOSE");
    }
    else if (cmd == "STATUS")
    {
      Serial.println("=== STATUS ===");
      Serial.print("Weight: ");
      Serial.print(filteredKg, 3);
      Serial.println(" kg");
      Serial.print("Temperature: ");
      Serial.print(lastTemp, 2);
      Serial.println(" C");
      Serial.print("Servo Angle: ");
      Serial.println(servoAngle);
      Serial.print("Manual Control: ");
      Serial.println(manualServoControl ? "YES" : "NO");
      Serial.print("Feeding Active: ");
      Serial.println(feedRequestActive ? "YES" : "NO");
      if (feedRequestActive)
      {
        Serial.print("Target: ");
        Serial.print(targetKg, 3);
        Serial.print(" kg | Dispensed: ");
        Serial.println((filteredKg - startWeight), 3);
      }
      Serial.println("==============");
    }
    else
    {
      Serial.println("Unknown command. Available commands:");
      Serial.println("  SERVO_OPEN - Open servo");
      Serial.println("  SERVO_CLOSE - Close servo");
      Serial.println("  FEED_NOW:X - Dispense X kg (e.g., FEED_NOW:0.5)");
      Serial.println("  STATUS - Show current status");
    }
  }

  // ----- UPDATE LOAD CELL -----
  if (LoadCell.update())
  {
    rawBuf = LoadCell.getData();
    float diff = fabs(rawBuf - filteredKg);
    float alpha = (diff > JUMP_THRESHOLD_KG) ? FAST_ALPHA : SLOW_ALPHA;
    filteredKg = alpha * rawBuf + (1.0f - alpha) * filteredKg;
  }

  // ----- READ TEMPERATURE + SEND VIA BLUETOOTH -----
  if (deviceConnected && (now - lastTempTime >= TEMP_INTERVAL_MS))
  {
    sensors.requestTemperatures();
    float tempC = sensors.getTempCByIndex(0);
    
    if (tempC == -127.0f || isnan(tempC))
    {
      Serial.println("ERROR: Temperature sensor not responding!");
      tempC = 0.0f;
    }
    
    lastTemp = tempC;
    Serial.print("Temp C: ");
    Serial.print(tempC);
    Serial.print(" | Weight kg: ");
    Serial.println(filteredKg, 3);

    float outKg = (filteredKg >= DETECT_THRESHOLD_KG) ? filteredKg : 0.0f;

    String btData = String(tempC, 2) + "," + String(outKg, 3) + "," +
                    String(servoAngle) + "," + String(feedRequestActive ? 1 : 0);

    pCharData->setValue(btData.c_str());
    pCharData->notify();

    lastTempTime = now;
  }

  // ----- FEEDING LOGIC -----
  if (feedRequestActive)
  {
    // Safety timeout
    if (now - feedStartTime > FEED_MAX_DURATION_MS)
    {
      feedRequestActive = false;
      servoAngle = feedCloseAngle;
      writeServo360(servoAngle);
      if (deviceConnected) {
        pCharData->setValue("FEED_TIMEOUT");
        pCharData->notify();
      }
      Serial.println("Feed timeout - Servo CLOSED");
    }
    else
    {
      float dispensed = filteredKg - startWeight;
      if (dispensed < 0) dispensed = 0;

      if (dispensed >= targetKg)
      {
        feedRequestActive = false;
        servoAngle = feedCloseAngle;
        writeServo360(servoAngle);
        if (deviceConnected) {
          pCharData->setValue("FEEDING_DONE");
          pCharData->notify();
        }
        Serial.print("Target reached (");
        Serial.print(dispensed, 3);
        Serial.println(" kg) - Servo CLOSED");
      }
      // Servo stays OPEN while feeding
    }
  }
  
  // ----- MANUAL SERVO MODE -----
  // Keep servo in position if in manual mode and not feeding
  if (manualServoControl && !feedRequestActive)
  {
    writeServo360(servoAngle);  // Maintain servo position
  }
}
