import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, Dimensions, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button, Card, Avatar, Chip, TouchableRipple, Text, IconButton, useTheme, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth } from '../../config/firebaseConfig';
import { getUserPreferences, getUserProfile } from '../../services/userProfileService';
import { geminiService, type MealItem, type MealPlanResponse } from '../../services/geminiService';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

// Updated UserPreferences interface to match the actual data structure
interface UserPreferences {
  mealTypes: string[];
  allergies: string[];
  fitnessGoal: string;
  targetCalories: number;
  dietaryPreferences: string[];
  likes?: string[];
  dislikes?: string[];
  cuisinePreferences?: string[];
  mealPrepTime?: 'quick' | 'medium' | 'any';
}

export default function MealPlannerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);
  const [mealDetailsModalVisible, setMealDetailsModalVisible] = useState(false);

  // Fetch user preferences and meal plan on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (user) {
          console.log("User is authenticated:", user.uid);
          
          // First try to load the complete user profile
          const userProfile = await getUserProfile(user.uid);
          console.log("User profile loaded:", userProfile);
        
          // Get user preferences
          const preferences = await userProfile?.preferences;
          console.log("User preferences loaded:", preferences);
          setUserPreferences(preferences as UserPreferences);
          
          // Try to load saved meal plan for the date
          const savedPlan = await AsyncStorage.getItem(`mealPlan_${selectedDate.toISOString().split('T')[0]}`);
          if (savedPlan) {
            setMealPlan(JSON.parse(savedPlan));
          }
        } else {
          console.log("No authenticated user found");
          setError("Please sign in to view your meal plans");
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your meal plan. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    console.log('userPreferences', userPreferences);
  }, [selectedDate]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleMealSelect = (meal: MealItem) => {
    setSelectedMeal(meal);
    setMealDetailsModalVisible(true);
  };

  const handleGenerateMealPlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      if (!userPreferences) {
        setError('User preferences not found. Please update your profile.');
        return;
      }

      const generatedPlan = await geminiService.generateMealPlan({
        dietaryRestrictions: userPreferences.dietaryPreferences || [],
        calorieGoal: userPreferences.targetCalories || 2000,
        allergies: userPreferences.allergies || [],
        fitnessGoal: userPreferences.fitnessGoal || 'maintain',
        likes: userPreferences.likes || [],
        dislikes: userPreferences.dislikes || [],
        cuisinePreferences: userPreferences.cuisinePreferences || [],
        mealPrepTime: userPreferences.mealPrepTime || 'any'
      });

      // Add the selected date to the plan
      const planWithDate = {
        ...generatedPlan,
        date: selectedDate.toISOString().split('T')[0]
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        `mealPlan_${selectedDate.toISOString().split('T')[0]}`,
        JSON.stringify(planWithDate)
      );

      setMealPlan(planWithDate);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setError('Failed to generate meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const renderMealSection = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', title: string) => {
    let mealData: MealItem | MealItem[] | null = null;
    
    if (mealPlan) {
      switch (mealType) {
        case 'breakfast':
          mealData = mealPlan.breakfast;
          break;
        case 'lunch':
          mealData = mealPlan.lunch;
          break;
        case 'dinner':
          mealData = mealPlan.dinner;
          break;
        case 'snacks':
          mealData = mealPlan.snacks;
          break;
      }
    }
    
    const renderMealItem = (meal: MealItem) => (
      <TouchableRipple onPress={() => handleMealSelect(meal)}>
        <View style={styles.mealItem}>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>{meal.meal}</Text>
            <Text style={styles.mealDescription}>{meal.description}</Text>
            <Text style={styles.mealMacros}>
              {meal.calories} cal • {meal.protein}g protein • {meal.carbs}g carbs • {meal.fat}g fat
            </Text>
            <Text style={styles.prepTime}>
              <Ionicons name="time-outline" size={14} /> {meal.preparationTime} mins
            </Text>
          </View>
          <IconButton icon="chevron-right" size={24} />
        </View>
      </TouchableRipple>
    );
    
    return (
      <Card style={styles.mealCard}>
        <Card.Title 
          title={title}
          left={(props) => <Ionicons name={
            mealType === 'breakfast' ? 'sunny-outline' :
            mealType === 'lunch' ? 'restaurant-outline' :
            mealType === 'dinner' ? 'moon-outline' :
            'cafe-outline'
          } size={24} color={theme.colors.primary} />}
        />
        <Card.Content>
          {mealData ? (
            Array.isArray(mealData) ? 
              mealData.map((meal, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.divider} />}
                  {renderMealItem(meal)}
                </View>
              )) :
              renderMealItem(mealData)
          ) : (
            <Text style={styles.emptyMealText}>No meal planned</Text>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centeredContent]}>
        <ActivityIndicator size="large" color="#E53935" />
        <ThemedText style={{ marginTop: 20 }}>Loading your meal plan...</ThemedText>
      </ThemedView>
    );
  }
  
  if (!userPreferences) {
    return (
      <ThemedView style={[styles.container, styles.centeredContent]}>
        <ThemedText style={{ marginBottom: 20 }}>Please set up your profile preferences first.</ThemedText>
        <Button 
          mode="contained" 
          onPress={() => router.push('/profile-setup')}
          style={{ backgroundColor: '#E53935' }}
        >
          Set Up Profile
        </Button>
      </ThemedView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <ThemedView style={styles.container}>
          <StatusBar style="dark" />
          
          {/* Date Navigation */}
          <View style={styles.dateNav}>
            <IconButton icon="chevron-left" onPress={() => handleDateChange(-1)} />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <IconButton icon="chevron-right" onPress={() => handleDateChange(1)} />
          </View>

          {/* Generate Button */}
          <Button
            mode="contained"
            onPress={handleGenerateMealPlan}
            loading={generating}
            style={styles.generateButton}
            disabled={generating}
          >
            {generating ? 'Generating Plan...' : 'Generate Meal Plan'}
          </Button>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Meal Sections */}
          {renderMealSection('breakfast', 'Breakfast')}
          {renderMealSection('lunch', 'Lunch')}
          {renderMealSection('dinner', 'Dinner')}
          {renderMealSection('snacks', 'Snacks')}

          {/* Total Nutrition */}
          {mealPlan?.totalNutrition && (
            <Card style={styles.totalCard}>
              <Card.Title 
                title="Daily Totals"
                left={(props) => <Ionicons name="nutrition-outline" size={24} color={theme.colors.primary} />}
              />
              <Card.Content>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{mealPlan.totalNutrition.calories}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{mealPlan.totalNutrition.protein}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{mealPlan.totalNutrition.carbs}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{mealPlan.totalNutrition.fat}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Meal Details Modal */}
          <Modal
            visible={mealDetailsModalVisible}
            onDismiss={() => setMealDetailsModalVisible(false)}
            animationType="slide"
          >
            <View style={styles.modalContent}>
              <IconButton
                icon="close"
                style={styles.closeButton}
                onPress={() => setMealDetailsModalVisible(false)}
              />
              {selectedMeal && (
                <ScrollView>
                  <Text style={styles.modalTitle}>{selectedMeal.meal}</Text>
                  <Text style={styles.modalDescription}>{selectedMeal.description}</Text>
                  
                  <View style={styles.modalNutrition}>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{selectedMeal.calories}</Text>
                        <Text style={styles.nutritionLabel}>Calories</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{selectedMeal.protein}g</Text>
                        <Text style={styles.nutritionLabel}>Protein</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{selectedMeal.carbs}g</Text>
                        <Text style={styles.nutritionLabel}>Carbs</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{selectedMeal.fat}g</Text>
                        <Text style={styles.nutritionLabel}>Fat</Text>
                      </View>
                    </View>
                  </View>

                  <List.Section>
                    <List.Subheader>Ingredients</List.Subheader>
                    {selectedMeal.ingredients.map((ingredient, index) => (
                      <List.Item
                        key={index}
                        title={ingredient}
                        left={props => <List.Icon {...props} icon="circle-small" />}
                      />
                    ))}
                  </List.Section>

                  <List.Section>
                    <List.Subheader>Instructions</List.Subheader>
                    {selectedMeal.instructions.map((instruction, index) => (
                      <List.Item
                        key={index}
                        title={instruction}
                        left={props => <Text style={styles.stepNumber}>{index + 1}.</Text>}
                      />
                    ))}
                  </List.Section>
                </ScrollView>
              )}
            </View>
          </Modal>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '500',
  },
  generateButton: {
    marginBottom: 16,
    backgroundColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    marginBottom: 16,
    textAlign: 'center',
  },
  mealCard: {
    marginBottom: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  mealInfo: {
    flex: 1,
    marginRight: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  mealMacros: {
    fontSize: 14,
    color: '#666',
  },
  prepTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyMealText: {
    fontStyle: 'italic',
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  totalCard: {
    marginTop: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  nutritionItem: {
    alignItems: 'center',
    width: '25%',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E53935',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modalNutrition: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
}); 