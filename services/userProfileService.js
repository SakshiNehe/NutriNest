import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseInitialized, reinitializeFirebase } from '../config/firebaseConfig';

// Create user document if it doesn't exist
export const createUserDocument = async (userId, userData) => {
  try {
    // Ensure Firebase is initialized
    if (!isFirebaseInitialized()) {
      console.log("Firebase not initialized in userProfileService, reinitializing...");
      reinitializeFirebase();
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`Creating new user document for user: ${userId}`);
      // Create user document with default values
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        preferences: userData.preferences || {
          dietaryPreferences: [],
          allergies: [],
          fitnessGoal: 'maintain',
          targetCalories: 2000,
          mealTypes: ['breakfast', 'lunch', 'dinner']
        }
      });
      return true;
    }
    
    return false;  // Document already exists
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    // Ensure Firebase is initialized
    if (!isFirebaseInitialized()) {
      reinitializeFirebase();
    }
    
    // First check if the document exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create the document if it doesn't exist
      await setDoc(userRef, {
        ...profileData,
        createdAt: new Date().toISOString()
      });
    } else {
      // Update the existing document
      await updateDoc(userRef, profileData);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Update user preferences
export const updateUserPreferences = async (userId, preferences) => {
  try {
    // Ensure Firebase is initialized
    if (!isFirebaseInitialized()) {
      reinitializeFirebase();
    }
    
    // First check if the document exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create the document if it doesn't exist
      await setDoc(userRef, {
        createdAt: new Date().toISOString(),
        preferences: preferences
      });
      console.log("Created new user document with preferences");
    } else {
      // Update the existing document
      await updateDoc(userRef, { preferences });
      console.log("Updated existing user preferences");
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

// Get user preferences
export const getUserPreferences = async (userId) => {
  try {
    // Ensure Firebase is initialized
    if (!isFirebaseInitialized()) {
      reinitializeFirebase();
    }
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.preferences || {};
    } else {
      console.log("User document doesn't exist yet");
      return {};
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

// Get complete user profile
export const getUserProfile = async (userId) => {
  try {
    if (!isFirebaseInitialized()) {
      reinitializeFirebase();
    }
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log("User profile not found");
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Calculate BMI (Body Mass Index)
export const calculateBMI = (weight, height) => {
  // Ensure weight is in kg and height is in meters
  const heightInMeters = height / 100; // Convert cm to meters
  
  // BMI formula: weight (kg) / height² (m²)
  const bmi = weight / (heightInMeters * heightInMeters);
  
  // Round to 1 decimal place
  return Math.round(bmi * 10) / 10;
};

// Get BMI category
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  if (bmi < 35) return 'Obesity Class I';
  if (bmi < 40) return 'Obesity Class II';
  return 'Obesity Class III';
};

// Calculate basal metabolic rate (BMR) based on user data
export const calculateBMR = (weight, height, age, gender) => {
  // Using Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

// Calculate daily caloric needs based on activity level and goal
export const calculateDailyCalories = (bmr, activityLevel, goal) => {
  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Light exercise 1-3 days/week
    moderate: 1.55, // Moderate exercise 3-5 days/week
    active: 1.725, // Hard exercise 6-7 days/week
    veryActive: 1.9 // Very hard exercise & physical job or 2x training
  };
  
  // Calculate TDEE (Total Daily Energy Expenditure)
  const tdee = bmr * activityMultipliers[activityLevel];
  
  // Adjust based on goal
  switch (goal) {
    case 'lose':
      return Math.round(tdee - 500); // 500 calorie deficit for weight loss
    case 'gain':
      return Math.round(tdee + 500); // 500 calorie surplus for weight gain
    default:
      return Math.round(tdee); // Maintain weight
  }
};

// Calculate protein requirements based on weight and fitness goal
export const calculateProteinRequirement = (weight, fitnessGoal) => {
  // Protein requirements in grams per kg of body weight
  switch (fitnessGoal) {
    case 'lose':
      return Math.round(weight * 1.6); // Higher protein for weight loss (preserve muscle)
    case 'gain':
      return Math.round(weight * 1.8); // Higher protein for muscle gain
    default:
      return Math.round(weight * 1.2); // Maintenance
  }
};

export default {
  createUserDocument,
  updateUserProfile,
  updateUserPreferences,
  getUserPreferences,
  getUserProfile,
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateDailyCalories,
  calculateProteinRequirement
}; 