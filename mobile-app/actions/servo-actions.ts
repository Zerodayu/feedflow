export const openServo = async (sendCommand: (command: string) => Promise<void>) => {
  try {
    await sendCommand("RUN");
    console.log("Servo opened");
  } catch (error) {
    console.error("Failed to open servo:", error);
    throw error;
  }
};

export const closeServo = async (sendCommand: (command: string) => Promise<void>) => {
  try {
    await sendCommand("STOP");
    console.log("Servo closed");
  } catch (error) {
    console.error("Failed to close servo:", error);
    throw error;
  }
};

export const toggleServo = async (
  isServoClosed: boolean,
  sendCommand: (command: string) => Promise<void>
) => {
  if (isServoClosed) {
    await openServo(sendCommand);
  } else {
    await closeServo(sendCommand);
  }
};