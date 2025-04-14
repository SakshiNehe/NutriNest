import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Chip, TextInput, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Auth } from 'firebase/auth';
import { getUserPreferences, updateUserPreferences, createUserDocument, getUserProfile } from '../services/userProfileService';
import { auth, db, isFirebaseInitialized, reinitializeFirebase } from '../config/firebaseConfig';

// Define types for our arrays
type DietaryPreference = string;
type Allergy = string;
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type FitnessGoal = 'lose' | 'maintain' | 'gain';

interface UserPreferences {
  dietaryPreferences: DietaryPreference[];
  allergies: Allergy[];
  fitnessGoal: FitnessGoal;
  targetCalories: number;
  mealTypes: MealType[];
}

const ProfileSetupScreen = () => {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // User Details
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  
  // Dietary Preferences
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreference[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  
  // Meal Planning
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([]);
  const [targetCalories, setTargetCalories] = useState<string>('2000');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('maintain');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Ensure Firebase is initialized
        if (!isFirebaseInitialized()) {
          console.log("Firebase not initialized, attempting to reinitialize...");
          reinitializeFirebase();
        }
        
        if (!auth) {
          console.error("Auth is still not initialized after reinitialization");
          setError("Authentication system is not available. Please restart the app.");
          setInitialLoading(false);
          return;
        }

        const user = auth.currentUser;
        if (user) {
          console.log("User is authenticated:", user.uid);
          
          // First try to load the complete user profile
          try {
            const userProfile = await getUserProfile(user.uid);
            console.log("User profile loaded:", userProfile);
            
            if (userProfile) {
              // Set user details
              if (userProfile.displayName) setName(userProfile.displayName);
              if (userProfile.age) setAge(String(userProfile.age));
              if (userProfile.height) setHeight(String(userProfile.height));
              if (userProfile.weight) setWeight(String(userProfile.weight));
              
              // Check if preferences exist in the user profile
              if (userProfile.preferences) {
                const prefs = userProfile.preferences;
                if (prefs.dietaryPreferences) setDietaryPreferences(prefs.dietaryPreferences);
                if (prefs.allergies) setAllergies(prefs.allergies);
                if (prefs.fitnessGoal) setFitnessGoal(prefs.fitnessGoal as FitnessGoal);
                if (prefs.targetCalories) setTargetCalories(String(prefs.targetCalories));
                if (prefs.mealTypes) setSelectedMealTypes(prefs.mealTypes as MealType[]);
              }
              
              console.log("User data loaded successfully");
            }
          } catch (error) {
            console.error("Error loading user profile:", error);
            setError("Failed to load your profile data. Please try again.");
          }
        } else {
          console.log("No user found, redirecting to login");
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        setError("There was a problem checking your login status.");
      } finally {
        setInitialLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const toggleMealType = (mealType: MealType) => {
    setSelectedMealTypes((prev) => 
      prev.includes(mealType) 
        ? prev.filter(type => type !== mealType) 
        : [...prev, mealType]
    );
  };

  const toggleDietaryPreference = (preference: DietaryPreference) => {
    setDietaryPreferences((prev) => 
      prev.includes(preference) 
        ? prev.filter(item => item !== preference) 
        : [...prev, preference]
    );
  };

  const toggleAllergy = (allergy: Allergy) => {
    setAllergies((prev) => 
      prev.includes(allergy) 
        ? prev.filter(item => item !== allergy) 
        : [...prev, allergy]
    );
  };

  const validateInputs = () => {
    // At minimum we need the name
    if (!name.trim()) {
      setError("Please enter your name");
      return false;
    }
    
    // Validate numeric inputs if provided
    if (age && (isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 120)) {
      setError("Please enter a valid age between 1 and 120");
      return false;
    }
    
    if (height && (isNaN(Number(height)) || Number(height) <= 0 || Number(height) > 300)) {
      setError("Please enter a valid height in cm (between 1 and 300)");
      return false;
    }
    
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0 || Number(weight) > 500)) {
      setError("Please enter a valid weight in kg (between 1 and 500)");
      return false;
    }
    
    return true;
  };

  const handleSaveProfile = async () => {
    try {
      // Validate inputs first
      if (!validateInputs()) {
        return;
      }
      
      setLoading(true);
      setError('');
      
      // Verify Firebase auth is available
      if (!isFirebaseInitialized()) {
        reinitializeFirebase();
      }
      
      if (!auth || !auth.currentUser) {
        console.error("User not authenticated");
        setError("You must be logged in to save your profile.");
        return;
      }
      
      const userId = auth.currentUser.uid;
      console.log("Saving profile for user:", userId);
      
      // First ensure the user document exists with personal details
      const userData = {
        displayName: name,
        email: auth.currentUser.email,
        age: parseInt(age, 10) || 0,
        height: parseInt(height, 10) || 0,
        weight: parseInt(weight, 10) || 0,
        updatedAt: new Date().toISOString()
      };
      
      const created = await createUserDocument(userId, userData);
      console.log("User document created or already exists:", created);
      
      // Then update the preferences
      const userPreferences: UserPreferences = {
        dietaryPreferences,
        allergies,
        fitnessGoal,
        targetCalories: parseInt(targetCalories, 10) || 2000,
        mealTypes: selectedMealTypes.length > 0 ? selectedMealTypes : ['breakfast', 'lunch', 'dinner'],
      };
      
      await updateUserPreferences(userId, userPreferences);
      console.log("User preferences saved successfully");
      
      setSuccessMessage("Profile saved successfully!");
      
      // Navigate to the home screen after successful save
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.container}>
            <Text style={styles.title}>Set Up Your Profile</Text>
            <Text style={styles.subtitle}>
              Help us create a personalized nutrition plan for you
            </Text>

            {/* Personal Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              
              <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
              />
              
              <View style={styles.rowContainer}>
                <TextInput
                  label="Age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                />
                
                <TextInput
                  label="Height (cm)"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                />
              </View>
              
              <TextInput
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
            </View>

            {/* Dietary Preferences Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dietary Preferences</Text>
              <Text style={styles.sectionSubtitle}>Select all that apply</Text>
              
              <View style={styles.chipContainer}>
                {['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Low-Carb', 'Gluten-Free'].map((preference) => (
                  <Chip
                    key={preference}
                    selected={dietaryPreferences.includes(preference)}
                    onPress={() => toggleDietaryPreference(preference)}
                    style={styles.chip}
                    selectedColor="#E53935"
                  >
                    {preference}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Allergies Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Allergies & Restrictions</Text>
              <Text style={styles.sectionSubtitle}>Select all that apply</Text>
              
              <View style={styles.chipContainer}>
                {['Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish', 'Wheat', 'Fish'].map((allergy) => (
                  <Chip
                    key={allergy}
                    selected={allergies.includes(allergy)}
                    onPress={() => toggleAllergy(allergy)}
                    style={styles.chip}
                    selectedColor="#E53935"
                  >
                    {allergy}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Fitness Goal Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fitness Goal</Text>
              
              <View style={styles.chipContainer}>
                <Chip
                  selected={fitnessGoal === 'lose'}
                  onPress={() => setFitnessGoal('lose')}
                  style={styles.chip}
                  selectedColor="#E53935"
                >
                  Lose Weight
                </Chip>
                
                <Chip
                  selected={fitnessGoal === 'maintain'}
                  onPress={() => setFitnessGoal('maintain')}
                  style={styles.chip}
                  selectedColor="#E53935"
                >
                  Maintain Weight
                </Chip>
                
                <Chip
                  selected={fitnessGoal === 'gain'}
                  onPress={() => setFitnessGoal('gain')}
                  style={styles.chip}
                  selectedColor="#E53935"
                >
                  Gain Weight
                </Chip>
              </View>
              
              <TextInput
                label="Target Daily Calories"
                value={targetCalories}
                onChangeText={setTargetCalories}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
            </View>

            {/* Meal Types Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meal Types</Text>
              <Text style={styles.sectionSubtitle}>Which meals do you want plans for?</Text>
              
              <View style={styles.chipContainer}>
                <Chip
                  selected={selectedMealTypes.includes('breakfast')}
                  onPress={() => toggleMealType('breakfast')}
                  style={styles.chip}
                  selectedColor="#E53935"
                >
                  Breakfast
                </Chip>
                
                <Chip
                  selected={selectedMealTypes.includes('lunch')}
                  onPress={() => toggleMealType('lunch')}
                  style={styles.chip}
                  selectedColor="#E53935"
                >
                  Lunch
                </Chip>
                
                <Chip
                  selected={selectedMealTypes.includes('dinner')}
                  onPress={() => toggleMealType('dinner')}
                  style={styles.chip}
                  selectedColor="#E53935"
                >
                  Dinner
                </Chip>
                
                <Chip
                  selected={selectedMealTypes.includes('snack')}
                  onPress={() => toggleMealType('snack')}
                  style={styles.chip}
                  selectedColor="#E53935"
                >
                  Snacks
                </Chip>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleSaveProfile}
              style={styles.saveButton}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={5000}
        action={{
          label: 'OK',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage('')}
        duration={3000}
        style={{ backgroundColor: '#4CAF50' }}
        action={{
          label: 'OK',
          onPress: () => setSuccessMessage(''),
        }}
      >
        {successMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    width: '48%',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  chip: {
    margin: 4,
  },
  saveButton: {
    marginVertical: 24,
    backgroundColor: '#E53935',
    paddingVertical: 6,
  },
});

export default ProfileSetupScreen; 