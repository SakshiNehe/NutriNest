import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const initializeNotifications = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with your Expo project ID
    });

    // Store the token for later use
    await AsyncStorage.setItem('pushToken', token.data);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return null;
  }
};

export const scheduleLocalNotification = async (title: string, body: string, trigger: any) => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });
    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

export const scheduleMealReminder = async (mealType: string, time: Date) => {
  const trigger = {
    hour: time.getHours(),
    minute: time.getMinutes(),
    repeats: true,
  };

  return scheduleLocalNotification(
    'Meal Reminder',
    `Time for ${mealType}! Don't forget to log your meal.`,
    trigger
  );
};

export const scheduleWaterReminder = async () => {
  // Schedule water reminders every 2 hours between 8 AM and 8 PM
  const reminders = [];
  for (let hour = 8; hour <= 20; hour += 2) {
    const trigger = {
      hour,
      minute: 0,
      repeats: true,
    };

    const id = await scheduleLocalNotification(
      'Water Reminder',
      'Remember to stay hydrated! Take a water break.',
      trigger
    );
    reminders.push(id);
  }
  return reminders;
};

export const cancelNotification = async (notificationId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

export const addNotificationListener = (callback: (notification: Notifications.Notification) => void) => {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return subscription;
};

export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return subscription;
}; 