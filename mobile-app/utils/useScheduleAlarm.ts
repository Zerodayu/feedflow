import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { ScheduleFeedType } from '../database/db-schema';

interface UseScheduleAlarmProps {
  schedules: ScheduleFeedType[];
  currentWeight: number;
  sendCommand: (command: string) => Promise<void>;
  connectedDevice: any;
  startFeedingSession?: () => Promise<void>;
  endFeedingSession?: () => Promise<void>;
  onScheduleComplete?: (scheduleId: number) => Promise<void>;
}

/**
 * Hook to monitor scheduled feeds and trigger servo automatically
 * when the scheduled time is reached. Deletes schedule after completion.
 */
export function useScheduleAlarm({
  schedules,
  currentWeight,
  sendCommand,
  connectedDevice,
  startFeedingSession,
  endFeedingSession,
  onScheduleComplete,
}: UseScheduleAlarmProps) {
  const [isFeeding, setIsFeeding] = useState(false);
  const executedSchedulesRef = useRef<Set<string>>(new Set());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate servo run duration based on kg amount compared to current weight
  const calculateRunDuration = (kgAmount: number, currentWeightKg: number): number => {
    // Check if there's enough feed
    if (currentWeightKg < kgAmount) {
      console.warn(`Not enough feed! Current: ${currentWeightKg}kg, Needed: ${kgAmount}kg`);
      return 0;
    }

    // Calculate duration in seconds based on weight to dispense
    // The servo runs until the specified kg amount is dispensed
    // Adjust this multiplier based on your servo's actual dispensing rate
    const SECONDS_PER_KG = 10; // If servo dispenses 1kg in 10 seconds
    const duration = kgAmount * SECONDS_PER_KG;
    
    // Cap at reasonable maximum (60 seconds)
    return Math.min(duration, 60);
  };

  // Execute scheduled feed
  const executeScheduledFeed = async (schedule: ScheduleFeedType) => {
    if (!connectedDevice) {
      console.warn('Cannot execute scheduled feed: Device not connected');
      Alert.alert(
        'Feed Schedule',
        `Scheduled feed (${schedule.kg}kg) cannot run: Device not connected`,
        [{ text: 'OK' }]
      );
      return false;
    }

    if (isFeeding) {
      console.warn('Already feeding, skipping scheduled feed');
      return false;
    }

    const duration = calculateRunDuration(schedule.kg, currentWeight);

    if (duration === 0) {
      Alert.alert(
        'Feed Schedule',
        `Not enough feed in container!\nScheduled: ${schedule.kg}kg\nCurrent: ${currentWeight.toFixed(2)}kg\nPlease refill.`,
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      setIsFeeding(true);

      // Notify user
      Alert.alert(
        'Scheduled Feed Started',
        `Dispensing ${schedule.kg}kg of feed\nDuration: ${duration.toFixed(0)} seconds\nCurrent weight: ${currentWeight.toFixed(2)}kg`,
        [{ text: 'OK' }]
      );

      console.log(`Starting scheduled feed: ${schedule.kg}kg for ${duration}s (Current weight: ${currentWeight}kg)`);

      // Start feeding session
      if (startFeedingSession) {
        await startFeedingSession();
      }

      // Run servo
      await sendCommand('RUN');

      // Wait for calculated duration
      await new Promise(resolve => setTimeout(resolve, duration * 1000));

      // Stop servo
      await sendCommand('STOP');

      // Small delay for weight sensor stabilization
      await new Promise(resolve => setTimeout(resolve, 500));

      // End feeding session
      if (endFeedingSession) {
        await endFeedingSession();
      }

      console.log('Scheduled feed completed successfully');
      
      // Delete the schedule after successful completion
      if (onScheduleComplete) {
        console.log(`Deleting completed schedule (ID: ${schedule.id})`);
        await onScheduleComplete(schedule.id);
        
        Alert.alert(
          'Schedule Complete',
          `Feed schedule completed and removed.\nDispensed: ${schedule.kg}kg`,
          [{ text: 'OK' }]
        );
      }

      return true;

    } catch (error) {
      console.error('Error executing scheduled feed:', error);
      Alert.alert('Error', 'Failed to complete scheduled feed');
      
      // Try to stop servo in case of error
      try {
        await sendCommand('STOP');
      } catch (stopError) {
        console.error('Failed to stop servo after error:', stopError);
      }
      
      return false;
    } finally {
      setIsFeeding(false);
    }
  };

  // Check if any schedule should be triggered
  const checkSchedules = () => {
    if (!schedules || schedules.length === 0) {
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

    schedules.forEach(schedule => {
      // Parse schedule time (24-hour format)
      const [scheduleHour, scheduleMinute] = schedule.time.split(':').map(Number);

      // Check if current time matches schedule time
      const isTimeMatch = currentHour === scheduleHour && currentMinute === scheduleMinute;

      // Create unique key for this execution (date + schedule id)
      const executionKey = `${currentDateKey}-${schedule.id}`;

      if (isTimeMatch && !executedSchedulesRef.current.has(executionKey)) {
        console.log(`Schedule triggered: ${schedule.time} - ${schedule.kg}kg (ID: ${schedule.id})`);
        
        // Mark as executed to prevent duplicate execution
        executedSchedulesRef.current.add(executionKey);
        
        // Execute the feed (will be deleted after successful completion)
        executeScheduledFeed(schedule);

        // Clean up old execution records (keep only today's)
        setTimeout(() => {
          const currentDate = new Date().toISOString().split('T')[0];
          executedSchedulesRef.current.forEach(key => {
            if (!key.startsWith(currentDate)) {
              executedSchedulesRef.current.delete(key);
            }
          });
        }, 1000);
      }
    });
  };

  // Set up interval to check schedules every minute
  useEffect(() => {
    if (!connectedDevice) {
      // Clear interval if device disconnects
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Check immediately
    checkSchedules();

    // Then check every 30 seconds (to ensure we don't miss the minute)
    checkIntervalRef.current = setInterval(() => {
      checkSchedules();
    }, 30000); // 30 seconds

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [schedules, connectedDevice, currentWeight, isFeeding]);

  // Reset executed schedules at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimer = setTimeout(() => {
      console.log('Resetting executed schedules at midnight');
      executedSchedulesRef.current.clear();
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  return {
    isFeeding,
    executeScheduledFeed, // Expose for manual trigger if needed
  };
}