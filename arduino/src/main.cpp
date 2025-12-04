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
int servoAngle = 0;
int servoDirection = 1;  // 1 = forward, -1 = backward
const int SERVO_MIN = 0;
const int SERVO_MAX = 180;
const int SERVO_STEP = 2;  // degrees per step
const unsigned long SERVO_UPDATE_MS = 20UL;  // 15ms = faster movement
bool servoRunning = false;  // Servo state: true = running, false = stopped

// ------------------- TIMING / FILTER -------------------
const float FAST_ALPHA = 0.90f;
const float SLOW_ALPHA = 0.40f;
const float JUMP_THRESHOLD_KG = 0.02f;
const float DETECT_THRESHOLD_KG = 0.02f;
const unsigned long TEMP_INTERVAL_MS = 2000UL;

// ------------------- VARIABLES --------------------
float filteredKg = 0.0f;
float rawBuf = 0.0f;
unsigned long lastTempTime = 0;
unsigned long lastServoUpdate = 0;
float lastTemp = 0.0f;

// Function to handle commands
void handleCommand(String cmd)
{
  cmd.trim();
  cmd.toUpperCase();
  
  Serial.print("Command received: ");
  Serial.println(cmd);
  
  if (cmd == "RUN" || cmd == "START")
  {
    servoRunning = true;
    Serial.println("SERVO RUNNING");
    if (deviceConnected)
    {
      pCharData->setValue("SERVO_RUNNING");
      pCharData->notify();
    }
  }
  else if (cmd == "STOP" || cmd == "HALT")
  {
    servoRunning = false;
    Serial.println("SERVO STOPPED");
    if (deviceConnected)
    {
      pCharData->setValue("SERVO_STOPPED");
      pCharData->notify();
    }
  }
  else if (cmd == "STATUS")
  {
    String status = servoRunning ? "RUNNING" : "STOPPED";
    Serial.print("Servo status: ");
    Serial.println(status);
    if (deviceConnected)
    {
      pCharData->setValue(("STATUS:" + status).c_str());
      pCharData->notify();
    }
  }
  else
  {
    Serial.println("Unknown command. Use: RUN, STOP, or STATUS");
  }
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
      handleCommand(cmd);
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
  myservo.attach(servoPin, 1000, 2000);  // Standard servo pulse range
  servoAngle = 0;  // Start at 0 degrees
  myservo.write(servoAngle);
  lastTempTime = millis();
  lastServoUpdate = millis();

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
  Serial.println("\nCommands: RUN, STOP, STATUS");
  Serial.println("Type a command in Serial Monitor and press Enter\n");
}

void loop()
{
  unsigned long now = millis();

  // ----- CHECK SERIAL MONITOR FOR COMMANDS -----
  if (Serial.available())
  {
    String cmd = Serial.readStringUntil('\n');
    handleCommand(cmd);
  }

  // ----- CONTINUOUS SERVO SWEEPING (only if running) -----
  if (servoRunning && (now - lastServoUpdate >= SERVO_UPDATE_MS))
  {
    servoAngle += (servoDirection * SERVO_STEP);
    
    // Reverse direction at limits
    if (servoAngle >= SERVO_MAX)
    {
      servoAngle = SERVO_MAX;
      servoDirection = -1;
    }
    else if (servoAngle <= SERVO_MIN)
    {
      servoAngle = SERVO_MIN;
      servoDirection = 1;
    }
    
    myservo.write(servoAngle);
    lastServoUpdate = now;
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
    Serial.print(filteredKg, 3);
    Serial.print(" | Servo: ");
    Serial.print(servoRunning ? "RUNNING" : "STOPPED");
    Serial.print(" @ ");
    Serial.print(servoAngle);
    Serial.println("°");

    float outKg = (filteredKg >= DETECT_THRESHOLD_KG) ? filteredKg : 0.0f;

    String btData = String(tempC, 2) + "," + String(outKg, 3) + "," + 
                    String(servoRunning ? "1" : "0");

    pCharData->setValue(btData.c_str());
    pCharData->notify();

    lastTempTime = now;
  }
}
