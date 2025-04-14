import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import Constants from 'expo-constants';

// Check if we're running in Expo Go (where notifications have limitations)
const isExpoGo = Constants.appOwnership === 'expo';

// Request notification permissions
export const requestNotificationPermissions = async () => {
  if (isExpoGo) {
    console.warn('Notification permissions are limited in Expo Go. Consider using a development build for full notification support.');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted!');
    return false;
  }
  
  // Configure notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  
  return true;
};

// Schedule a meal reminder notification
export const scheduleMealReminder = async (mealName, time, recurrence = 'daily') => {
  try {
    if (isExpoGo) {
      console.log(`[Simulated] Scheduled meal reminder for ${mealName} at ${time}`);
      return 'simulated-notification';
    }

    // Parse the time (assuming format like "08:00")
    const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
    
    const trigger = {
      hour: hours,
      minute: minutes,
      repeats: recurrence === 'daily',
    };
    
    const notificationContent = {
      title: `Time for ${mealName}!`,
      body: `Don't forget to have your ${mealName.toLowerCase()} according to your meal plan.`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

// Schedule a grocery shopping reminder
export const scheduleGroceryReminder = async (dayOfWeek, time) => {
  try {
    if (isExpoGo) {
      console.log(`[Simulated] Scheduled grocery reminder for ${dayOfWeek} at ${time}`);
      return 'simulated-grocery-notification';
    }

    // Parse the time
    const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
    
    // Map day of week to number (0 = Sunday, 1 = Monday, etc.)
    const daysOfWeek = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    
    const weekday = daysOfWeek[dayOfWeek.toLowerCase()] || 0;
    
    const trigger = {
      weekday,
      hour: hours,
      minute: minutes,
      repeats: true,
    };
    
    const notificationContent = {
      title: 'Grocery Shopping Reminder',
      body: 'Time to get groceries for your weekly meal plan!',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger,
    });
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling grocery reminder:', error);
    throw error;
  }
};

// Cancel notification by ID
export const cancelNotification = async (notificationId) => {
  try {
    if (isExpoGo) {
      console.log(`[Simulated] Cancelled notification: ${notificationId}`);
      return true;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error('Error cancelling notification:', error);
    throw error;
  }
};

// Get all scheduled notifications
export const getAllScheduledNotifications = async () => {
  try {
    if (isExpoGo) {
      console.log("[Simulated] Getting scheduled notifications (not fully supported in Expo Go)");
      return [];
    }

    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    throw error;
  }
};

// Save reminder to Firestore
export const saveReminder = async (userId, reminderData) => {
  try {
    const docRef = await addDoc(collection(db, 'reminders'), {
      userId,
      ...reminderData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving reminder:', error);
    throw error;
  }
};

// Get user's reminders
export const getUserReminders = async (userId) => {
  try {
    const remindersRef = collection(db, 'reminders');
    const q = query(remindersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const reminders = [];
    querySnapshot.forEach((doc) => {
      reminders.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return reminders;
  } catch (error) {
    console.error('Error fetching user reminders:', error);
    throw error;
  }
};

// Delete a reminder
export const deleteReminder = async (reminderId, notificationId) => {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, 'reminders', reminderId));
    
    // Cancel the notification if notificationId is provided
    if (notificationId) {
      await cancelNotification(notificationId);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
};

export default {
  requestNotificationPermissions,
  scheduleMealReminder,
  scheduleGroceryReminder,
  cancelNotification,
  getAllScheduledNotifications,
  saveReminder,
  getUserReminders,
  deleteReminder,
}; 