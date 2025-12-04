export const openServo = async (
  sendCommand: (command: string) => Promise<void>,
  startFeedingSession?: () => Promise<void>
) => {
  try {
    if (startFeedingSession) {
      await startFeedingSession();
    }
    await sendCommand("RUN");
    console.log("Servo opened");
  } catch (error) {
    console.error("Failed to open servo:", error);
    throw error;
  }
};

export const closeServo = async (
  sendCommand: (command: string) => Promise<void>,
  endFeedingSession?: () => Promise<void>
) => {
  try {
    await sendCommand("STOP");
    console.log("Servo closed command sent");

    // Add a small delay to allow weight sensor to stabilize
    await new Promise(resolve => setTimeout(resolve, 500));

    if (endFeedingSession) {
      await endFeedingSession();
    }
    console.log("Servo closed and feeding session ended");
  } catch (error) {
    console.error("Failed to close servo:", error);
    throw error;
  }
};

export const toggleServo = async (
  isServoClosed: boolean,
  sendCommand: (command: string) => Promise<void>,
  startFeedingSession?: () => Promise<void>,
  endFeedingSession?: () => Promise<void>
) => {
  if (isServoClosed) {
    await openServo(sendCommand, startFeedingSession);
  } else {
    await closeServo(sendCommand, endFeedingSession);
  }
};