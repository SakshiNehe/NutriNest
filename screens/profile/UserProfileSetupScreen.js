import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Text, Snackbar, Switch, Chip, Card, Avatar, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemePrimaryButton from '../../components/ui/ThemePrimaryButton';
import { updateUserPreferences } from '../../services/userProfileService';
import { getCurrentUser } from '../../services/authService';
import { calculateBMR, calculateDailyCalories } from '../../services/userProfileService';

const UserProfileSetupScreen = ({ navigation }) => {
  // Personal details
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('female');

  // Dietary preferences
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [fitnessGoal, setFitnessGoal] = useState('maintain');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [mealTypes, setMealTypes] = useState(['breakfast', 'lunch', 'dinner']);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [calorieTarget, setCalorieTarget] = useState(0);
  
  // Dietary options
  const dietaryOptions = [
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Gluten Free', value: 'gluten-free' },
    { label: 'Ketogenic', value: 'ketogenic' },
    { label: 'Paleo', value: 'paleo' },
    { label: 'Pescetarian', value: 'pescetarian' },
    { label: 'Low FODMAP', value: 'fodmap' },
  ];
  
  // Allergy options
  const allergyOptions = [
    { label: 'Dairy', value: 'dairy' },
    { label: 'Egg', value: 'egg' },
    { label: 'Gluten', value: 'gluten' },
    { label: 'Grain', value: 'grain' },
    { label: 'Peanut', value: 'peanut' },
    { label: 'Seafood', value: 'seafood' },
    { label: 'Sesame', value: 'sesame' },
    { label: 'Shellfish', value: 'shellfish' },
    { label: 'Soy', value: 'soy' },
    { label: 'Sulfite', value: 'sulfite' },
    { label: 'Tree Nut', value: 'tree-nut' },
    { label: 'Wheat', value: 'wheat' },
  ];

  // Toggle meal type selection
  const toggleMealType = (mealType) => {
    if (mealTypes.includes(mealType)) {
      setMealTypes(mealTypes.filter(type => type !== mealType));
    } else {
      setMealTypes([...mealTypes, mealType]);
    }
  };

  // Toggle dietary preference
  const toggleDietaryPreference = (preference) => {
    if (dietaryPreferences.includes(preference)) {
      setDietaryPreferences(dietaryPreferences.filter(pref => pref !== preference));
    } else {
      setDietaryPreferences([...dietaryPreferences, preference]);
    }
  };

  // Toggle allergy
  const toggleAllergy = (allergy) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(item => item !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  // Calculate daily calorie target based on user inputs
  const calculateCalorieTarget = () => {
    if (!age || !weight || !height) {
      setError('Please enter all required information');
      return false;
    }

    const ageNum = parseInt(age, 10);
    const weightNum = parseInt(weight, 10);
    const heightNum = parseInt(height, 10);

    if (isNaN(ageNum) || isNaN(weightNum) || isNaN(heightNum)) {
      setError('Please enter valid numbers');
      return false;
    }

    if (ageNum < 15 || ageNum > 100) {
      setError('Please enter a valid age between 15 and 100');
      return false;
    }

    if (weightNum < 30 || weightNum > 300) {
      setError('Please enter a valid weight between 30kg and 300kg');
      return false;
    }

    if (heightNum < 100 || heightNum > 250) {
      setError('Please enter a valid height between 100cm and 250cm');
      return false;
    }

    const bmr = calculateBMR(weightNum, heightNum, ageNum, gender);
    const dailyCalories = calculateDailyCalories(bmr, activityLevel, fitnessGoal);
    
    setCalorieTarget(dailyCalories);
    return true;
  };

  // Validate current step and proceed to next
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (calculateCalorieTarget()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      handleSaveProfile();
    }
  };

  // Go back to previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Save profile to Firestore
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const user = getCurrentUser();
      
      if (!user) {
        setError('User not found. Please log in again.');
        return;
      }

      const userPreferences = {
        personalDetails: {
          age: parseInt(age, 10),
          weight: parseInt(weight, 10),
          height: parseInt(height, 10),
          gender
        },
        preferences: {
          dietaryPreferences,
          allergies,
          fitnessGoal,
          activityLevel,
          mealTypes,
          targetCalories: calorieTarget
        }
      };

      await updateUserPreferences(user.uid, userPreferences);
      navigation.replace('Main'); // Navigate to main app
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              {currentStep === 1 ? 'Personal Details' : 'Dietary Preferences'}
            </Text>
            <Text style={styles.subtitle}>
              {currentStep === 1 
                ? 'Help us personalize your meal plans' 
                : 'Tell us about your food preferences'}
            </Text>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, currentStep === 1 && styles.activeStepDot]} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, currentStep === 2 && styles.activeStepDot]} />
            </View>
          </View>

          {currentStep === 1 ? (
            <View style={styles.formContainer}>
              <View style={styles.genderContainer}>
                <Text style={styles.sectionTitle}>Gender</Text>
                <RadioButton.Group onValueChange={value => setGender(value)} value={gender}>
                  <View style={styles.radioRow}>
                    <RadioButton.Item label="Female" value="female" position="leading" />
                    <RadioButton.Item label="Male" value="male" position="leading" />
                  </View>
                </RadioButton.Group>
              </View>

              <TextInput
                label="Age"
                value={age}
                onChangeText={setAge}
                mode="outlined"
                keyboardType="number-pad"
                style={styles.input}
                left={<TextInput.Icon icon="calendar" />}
              />

              <TextInput
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                mode="outlined"
                keyboardType="number-pad"
                style={styles.input}
                left={<TextInput.Icon icon="weight-kilogram" />}
              />

              <TextInput
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                mode="outlined"
                keyboardType="number-pad"
                style={styles.input}
                left={<TextInput.Icon icon="human-male-height" />}
              />

              <Text style={styles.sectionTitle}>Activity Level</Text>
              <View style={styles.activityContainer}>
                <Card 
                  style={[styles.activityCard, activityLevel === 'sedentary' && styles.selectedCard]} 
                  onPress={() => setActivityLevel('sedentary')}
                >
                  <Card.Content>
                    <Text style={styles.activityTitle}>Sedentary</Text>
                    <Text style={styles.activityDesc}>Little or no exercise</Text>
                  </Card.Content>
                </Card>
                
                <Card 
                  style={[styles.activityCard, activityLevel === 'light' && styles.selectedCard]} 
                  onPress={() => setActivityLevel('light')}
                >
                  <Card.Content>
                    <Text style={styles.activityTitle}>Light</Text>
                    <Text style={styles.activityDesc}>Exercise 1-3 days/week</Text>
                  </Card.Content>
                </Card>
                
                <Card 
                  style={[styles.activityCard, activityLevel === 'moderate' && styles.selectedCard]} 
                  onPress={() => setActivityLevel('moderate')}
                >
                  <Card.Content>
                    <Text style={styles.activityTitle}>Moderate</Text>
                    <Text style={styles.activityDesc}>Exercise 3-5 days/week</Text>
                  </Card.Content>
                </Card>
                
                <Card 
                  style={[styles.activityCard, activityLevel === 'active' && styles.selectedCard]} 
                  onPress={() => setActivityLevel('active')}
                >
                  <Card.Content>
                    <Text style={styles.activityTitle}>Active</Text>
                    <Text style={styles.activityDesc}>Exercise 6-7 days/week</Text>
                  </Card.Content>
                </Card>
                
                <Card 
                  style={[styles.activityCard, activityLevel === 'veryActive' && styles.selectedCard]} 
                  onPress={() => setActivityLevel('veryActive')}
                >
                  <Card.Content>
                    <Text style={styles.activityTitle}>Very Active</Text>
                    <Text style={styles.activityDesc}>Hard daily exercise or physical job</Text>
                  </Card.Content>
                </Card>
              </View>

              <Text style={styles.sectionTitle}>Fitness Goal</Text>
              <View style={styles.goalContainer}>
                <Card 
                  style={[styles.goalCard, fitnessGoal === 'lose' && styles.selectedCard]} 
                  onPress={() => setFitnessGoal('lose')}
                >
                  <Card.Content style={styles.goalContent}>
                    <Avatar.Icon size={40} icon="arrow-down-bold" style={styles.loseIcon} />
                    <Text style={styles.goalText}>Lose Weight</Text>
                  </Card.Content>
                </Card>
                
                <Card 
                  style={[styles.goalCard, fitnessGoal === 'maintain' && styles.selectedCard]} 
                  onPress={() => setFitnessGoal('maintain')}
                >
                  <Card.Content style={styles.goalContent}>
                    <Avatar.Icon size={40} icon="equal" style={styles.maintainIcon} />
                    <Text style={styles.goalText}>Maintain</Text>
                  </Card.Content>
                </Card>
                
                <Card 
                  style={[styles.goalCard, fitnessGoal === 'gain' && styles.selectedCard]} 
                  onPress={() => setFitnessGoal('gain')}
                >
                  <Card.Content style={styles.goalContent}>
                    <Avatar.Icon size={40} icon="arrow-up-bold" style={styles.gainIcon} />
                    <Text style={styles.goalText}>Gain Muscle</Text>
                  </Card.Content>
                </Card>
              </View>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Dietary Preferences</Text>
              <View style={styles.chipContainer}>
                {dietaryOptions.map((option) => (
                  <Chip
                    key={option.value}
                    selected={dietaryPreferences.includes(option.value)}
                    onPress={() => toggleDietaryPreference(option.value)}
                    style={styles.chip}
                    selectedColor="#E53935"
                    avatar={dietaryPreferences.includes(option.value) ? 
                      <Avatar.Icon size={24} icon="check" style={styles.chipAvatar} /> : undefined}
                  >
                    {option.label}
                  </Chip>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Allergies</Text>
              <View style={styles.chipContainer}>
                {allergyOptions.map((option) => (
                  <Chip
                    key={option.value}
                    selected={allergies.includes(option.value)}
                    onPress={() => toggleAllergy(option.value)}
                    style={styles.chip}
                    selectedColor="#E53935"
                    avatar={allergies.includes(option.value) ? 
                      <Avatar.Icon size={24} icon="check" style={styles.chipAvatar} /> : undefined}
                  >
                    {option.label}
                  </Chip>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Meal Types</Text>
              <View style={styles.mealTypeContainer}>
                <Card 
                  style={[styles.mealCard, mealTypes.includes('breakfast') && styles.selectedCard]} 
                  onPress={() => toggleMealType('breakfast')}
                >
                  <Card.Content style={styles.mealCardContent}>
                    <Avatar.Icon size={40} icon="food-croissant" style={styles.mealIcon} />
                    <Text style={styles.mealTypeText}>Breakfast</Text>
                  </Card.Content>
                </Card>
                
                <Card 
                  style={[styles.mealCard, mealTypes.includes('lunch') && styles.selectedCard]} 
                  onPress={() => toggleMealType('lunch')}
                >
                  <Card.Content style={styles.mealCardContent}>
                    <Avatar.Icon size={40} icon="food" style={styles.mealIcon} />
                    <Text style={styles.mealTypeText}>Lunch</Text>
                  </Card.Content>
                </Card>
                
                <Card 
                  style={[styles.mealCard, mealTypes.includes('dinner') && styles.selectedCard]} 
                  onPress={() => toggleMealType('dinner')}
                >
                  <Card.Content style={styles.mealCardContent}>
                    <Avatar.Icon size={40} icon="food-steak" style={styles.mealIcon} />
                    <Text style={styles.mealTypeText}>Dinner</Text>
                  </Card.Content>
                </Card>
                
                <Card 
                  style={[styles.mealCard, mealTypes.includes('snack') && styles.selectedCard]} 
                  onPress={() => toggleMealType('snack')}
                >
                  <Card.Content style={styles.mealCardContent}>
                    <Avatar.Icon size={40} icon="food-apple" style={styles.mealIcon} />
                    <Text style={styles.mealTypeText}>Snacks</Text>
                  </Card.Content>
                </Card>
              </View>

              <Card style={styles.calorieCard}>
                <Card.Content>
                  <Text style={styles.calorieTitle}>Your Daily Calorie Target</Text>
                  <Text style={styles.calorieValue}>{calorieTarget} calories</Text>
                  <Text style={styles.calorieInfo}>
                    Based on your age, weight, height, gender, activity level, and fitness goal
                  </Text>
                </Card.Content>
              </Card>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <ThemePrimaryButton
                mode="outlined"
                onPress={handlePrevStep}
                style={styles.backButton}
              >
                Back
              </ThemePrimaryButton>
            )}
            
            <ThemePrimaryButton
              onPress={handleNextStep}
              loading={loading}
              disabled={loading}
              style={styles.nextButton}
            >
              {currentStep === 2 ? 'Complete Setup' : 'Next'}
            </ThemePrimaryButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  activeStepDot: {
    backgroundColor: '#E53935',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  input: {
    marginBottom: 16,
  },
  genderContainer: {
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityContainer: {
    marginBottom: 16,
  },
  activityCard: {
    marginBottom: 10,
    borderRadius: 10,
  },
  selectedCard: {
    borderColor: '#E53935',
    borderWidth: 2,
    backgroundColor: 'rgba(229, 57, 53, 0.05)'
  },
  activityTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  activityDesc: {
    fontSize: 14,
    color: '#666',
  },
  goalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  goalContent: {
    alignItems: 'center',
    padding: 5,
  },
  loseIcon: {
    backgroundColor: '#FF9800',
  },
  maintainIcon: {
    backgroundColor: '#4CAF50',
  },
  gainIcon: {
    backgroundColor: '#2196F3',
  },
  goalText: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  chipAvatar: {
    backgroundColor: 'transparent',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealCard: {
    width: '48%',
    marginBottom: 10,
    borderRadius: 10,
  },
  mealCardContent: {
    alignItems: 'center',
    padding: 10,
  },
  mealIcon: {
    backgroundColor: '#E53935',
  },
  mealTypeText: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  calorieCard: {
    marginVertical: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
  },
  calorieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  calorieValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  calorieInfo: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    marginRight: 10,
  },
  nextButton: {
    flex: 2,
  },
});

export default UserProfileSetupScreen; 