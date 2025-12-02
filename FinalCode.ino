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

// Helper to write a 0..360 "angle" to the servo by mapping to microsecond pulses.
// This lets you address the servo as if it had a 360° range.
void writeServo360(int angle)
{
  angle = constrain(angle, 0, 360);
  // Map 0..360 to pulse range used in attach(servoPin, 500, 2400)
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
    pServer->startAdvertising(); // restart advertising
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
          pCharData->setValue("FEEDING_STARTED");
          pCharData->notify();
        }
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

  // ---------- SERVO ----------
  myservo.attach(servoPin, 500, 2400);
  servoAngle = feedCloseAngle;
  writeServo360(servoAngle);
  lastServoStep = millis();
  lastFeedServoTime = millis();
  lastTempTime = millis();

  // ---------- BLE ----------
  BLEDevice::init("FeedFlow");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Data characteristic (for sending sensor data)
  pCharData = pService->createCharacteristic(
      CHAR_UUID_DATA,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  pCharData->addDescriptor(new BLE2902());

  // Command characteristic (for receiving commands)
  pCharCommand = pService->createCharacteristic(
      CHAR_UUID_COMMAND,
      BLECharacteristic::PROPERTY_WRITE);
  pCharCommand->setCallbacks(new CommandCallbacks());

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.println("BLE started. Device name: FeedFlow");
}

void loop()
{
  unsigned long now = millis();

  // ----- TEMPERATURE SAFETY -----
  if (lastTemp >= TEMP_SAFE_LIMIT)
  {
    feedRequestActive = false;
    servoAngle = feedCloseAngle;
    writeServo360(servoAngle);
    SerialBT.println("TEMP_TOO_HIGH");
    Serial.println("TEMP TOO HIGH — SERVO STOPPED!");
    return;
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
    if (isnan(tempC))
      tempC = 0.0f;
    lastTemp = tempC;

    float outKg = (filteredKg >= DETECT_THRESHOLD_KG) ? filteredKg : 0.0f;

    String btData = String(tempC, 2) + "," + String(outKg, 3) + "," +
                    String(servoAngle) + "," + String(feedRequestActive ? 1 : 0);

    pCharData->setValue(btData.c_str());
    pCharData->notify();

    lastTempTime = now;
  }

  // ----- CHECK FOR BLUETOOTH COMMANDS -----
  if (SerialBT.available())
  {
    String cmd = SerialBT.readStringUntil('\n');
    cmd.trim();
    Serial.print("BT RX: ");
    Serial.println(cmd);

    if (cmd.startsWith("FEED_NOW:"))
    {
      float req = cmd.substring(9).toFloat();
      if (req > 0.0f && req <= FEED_MAX_KG)
      {
        targetKg = req;
        startWeight = filteredKg;
        feedRequestActive = true;
        feedStartTime = now;
        lastFeedServoTime = now;
        servoAngle = feedCloseAngle;
        writeServo360(servoAngle);
        SerialBT.println("FEEDING_STARTED");
      }
      else
      {
        SerialBT.println("INVALID_AMOUNT");
      }
    }
    else if (cmd == "PING")
    {
      SerialBT.println("PONG");
    }
    else
    {
      SerialBT.println("UNKNOWN_CMD");
    }
  }

  // ----- FEEDING LOGIC -----
  if (feedRequestActive)
  {
    // safety timeout
    if (now - feedStartTime > FEED_MAX_DURATION_MS)
    {
      feedRequestActive = false;
      SerialBT.println("FEED_TIMEOUT");
      servoAngle = feedCloseAngle;
      writeServo360(servoAngle);
    }
    else
    {
      float dispensed = filteredKg - startWeight;
      if (dispensed < 0)
        dispensed = 0;

      if (dispensed >= targetKg)
      {
        feedRequestActive = false;
        SerialBT.println("FEEDING_DONE");
        servoAngle = feedCloseAngle;
        writeServo360(servoAngle);
      }
      else if (now - lastFeedServoTime >= feedServoInterval)
      {
        // dispense feed
        servoAngle += feedServoDir * feedServoStep;
        if (servoAngle >= feedOpenAngle)
          feedServoDir = -1;
        if (servoAngle <= feedCloseAngle)
          feedServoDir = 1;
        writeServo360(servoAngle);
        lastFeedServoTime = now;
      }
    }
  }
  else
  {
    // ----- REST POSITION -----
    servoAngle = feedCloseAngle;
    writeServo360(servoAngle);
  }
}
