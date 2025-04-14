import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, Dimensions, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button, Card, Avatar, Chip, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth } from '../../config/firebaseConfig';
import { getUserPreferences } from '../../services/userProfileService';
import { generateMealPlan, saveMealPlan, getUserMealPlans, getMealPlan } from '../../services/mealPlannerService';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function MealPlannerScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userDataModalVisible, setUserDataModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [mealDetailsModalVisible, setMealDetailsModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // Calculate total calories in the meal plan
  const totalCaloriesPlanned = mealPlan?.meals?.reduce((sum, meal) => {
    return sum + (meal.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0);
  }, 0) || 0;
  
  // Fetch user preferences and meal plan on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        
        // Get user preferences
        const preferences = await getUserPreferences(user.uid);
        setUserPreferences(preferences);
        
        // Get meal plans for the selected date
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const userMealPlans = await getUserMealPlans(user.uid);
        
        // Find meal plan for the selected date
        const planForDate = userMealPlans.find(plan => plan.date === formattedDate);
        
        if (planForDate) {
          const detailedPlan = await getMealPlan(planForDate.id);
          setMealPlan(detailedPlan);
        } else {
          setMealPlan(null);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your meal plan. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [selectedDate]);
  
  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };
  
  const handleMealSelect = (meal, mealType) => {
    setSelectedMeal(meal);
    setSelectedMealType(mealType);
    setMealDetailsModalVisible(true);
  };

  const handleGenerateMealPlan = async () => {
    try {
      setGenerating(true);
      setError(''); // Clear any previous errors
      
      const user = auth.currentUser;
      if (!user || !userPreferences) {
        setError('User preferences not found. Please update your profile.');
        return;
      }

      console.log('Starting meal plan generation with preferences:', userPreferences);
      
      // Generate new meal plan using user preferences
      const newMealPlan = await generateMealPlan(userPreferences);
      
      // Add date to meal plan
      newMealPlan.date = selectedDate.toISOString().split('T')[0];
      
      // Save meal plan to Firestore
      const mealPlanId = await saveMealPlan(user.uid, newMealPlan);
      
      // Set the generated meal plan
      setMealPlan({ id: mealPlanId, ...newMealPlan });
      console.log('Meal plan generated and saved successfully');
      
    } catch (err) {
      console.error('Error generating meal plan:', err);
      // More detailed error message
      if (err.response && err.response.status === 401) {
        setError('API authentication failed. Using sample meal plan instead.');
        
        // Create a simple fallback meal plan in case API fails
        try {
          const fallbackPlan = {
            date: selectedDate.toISOString().split('T')[0],
            meals: [
              {
                id: 1,
                title: "Scrambled Eggs with Vegetables",
                readyInMinutes: 15,
                servings: 1,
                image: "https://spoonacular.com/recipeImages/635446-312x231.jpg",
                nutrition: {
                  nutrients: [
                    { name: 'Calories', amount: Math.floor((userPreferences?.targetCalories || 2000) / 3) },
                    { name: 'Protein', amount: 20 },
                    { name: 'Fat', amount: 15 },
                    { name: 'Carbohydrates', amount: 10 }
                  ]
                }
              },
              {
                id: 2,
                title: "Grilled Chicken Salad",
                readyInMinutes: 20,
                servings: 1,
                image: "https://spoonacular.com/recipeImages/649931-312x231.jpg",
                nutrition: {
                  nutrients: [
                    { name: 'Calories', amount: Math.floor((userPreferences?.targetCalories || 2000) / 3) },
                    { name: 'Protein', amount: 25 },
                    { name: 'Fat', amount: 10 },
                    { name: 'Carbohydrates', amount: 15 }
                  ]
                }
              },
              {
                id: 3,
                title: "Baked Salmon with Vegetables",
                readyInMinutes: 25,
                servings: 1,
                image: "https://spoonacular.com/recipeImages/641057-312x231.jpg",
                nutrition: {
                  nutrients: [
                    { name: 'Calories', amount: Math.floor((userPreferences?.targetCalories || 2000) / 3) },
                    { name: 'Protein', amount: 22 },
                    { name: 'Fat', amount: 18 },
                    { name: 'Carbohydrates', amount: 12 }
                  ]
                }
              }
            ]
          };
          
          const fallbackPlanId = await saveMealPlan(user.uid, fallbackPlan);
          setMealPlan({ id: fallbackPlanId, ...fallbackPlan });
          console.log('Fallback meal plan created and saved');
        } catch (fallbackError) {
          console.error('Failed to create fallback meal plan:', fallbackError);
          setError('Failed to generate any meal plan. Please try again later.');
        }
      } else {
        setError('Failed to generate meal plan. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };
  
  // If no userPreferences or still loading, show loading state
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
          
          {/* Header with profile and date selector */}
          <ThemedView style={styles.header}>
            <TouchableRipple onPress={() => setUserDataModalVisible(true)}>
              <ThemedView style={styles.profileButton}>
                <Ionicons name="person-circle-outline" size={24} color="#E53935" />
                <ThemedText type="defaultSemiBold" style={styles.userName}>
                  {auth.currentUser?.displayName || 'User'}
                </ThemedText>
              </ThemedView>
            </TouchableRipple>
            
            <ThemedView style={styles.dateSelector}>
              <TouchableRipple onPress={() => handleDateChange(-1)}>
                <View style={styles.iconButton}>
                  <Ionicons name="chevron-back" size={24} color="#E53935" />
                </View>
              </TouchableRipple>
              
              <ThemedText type="defaultSemiBold">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </ThemedText>
              
              <TouchableRipple onPress={() => handleDateChange(1)}>
                <View style={styles.iconButton}>
                  <Ionicons name="chevron-forward" size={24} color="#E53935" />
                </View>
              </TouchableRipple>
            </ThemedView>
          </ThemedView>
          
          {/* Nutrition Summary */}
          <ThemedView style={styles.summaryCard}>
            <ThemedText type="subtitle" style={styles.dailyGoalTitle}>Daily Goal</ThemedText>
            
            <ThemedView style={styles.nutritionRow}>
              <ThemedView style={styles.nutritionItem}>
                <ThemedText type="defaultSemiBold">{userPreferences?.targetCalories || 2000}</ThemedText>
                <ThemedText style={styles.smallText}>calories</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.nutritionItem}>
                <ThemedText type="defaultSemiBold">{Math.round((userPreferences?.targetCalories || 2000) * 0.3 / 4)}</ThemedText>
                <ThemedText style={styles.smallText}>protein (g)</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.nutritionItem}>
                <ThemedText type="defaultSemiBold">{Math.round((userPreferences?.targetCalories || 2000) * 0.45 / 4)}</ThemedText>
                <ThemedText style={styles.smallText}>carbs (g)</ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.nutritionItem}>
                <ThemedText type="defaultSemiBold">{Math.round((userPreferences?.targetCalories || 2000) * 0.25 / 9)}</ThemedText>
                <ThemedText style={styles.smallText}>fat (g)</ThemedText>
              </ThemedView>
            </ThemedView>
            
            <ThemedView style={styles.progressBar}>
              <ThemedView 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(100, (totalCaloriesPlanned / (userPreferences?.targetCalories || 2000)) * 100)}%` }
                ]} 
              />
            </ThemedView>
            
            <ThemedText>
              {Math.round(totalCaloriesPlanned)} / {userPreferences?.targetCalories || 2000} calories
            </ThemedText>
          </ThemedView>
          
          {/* Meal Plan Generation */}
          {!mealPlan ? (
            <ThemedView style={styles.noMealPlanContainer}>
              <ThemedText style={styles.noMealPlanText}>
                No meal plan for this date. Generate a new one?
              </ThemedText>
              <Button 
                mode="contained" 
                onPress={handleGenerateMealPlan}
                loading={generating}
                disabled={generating}
                style={{ backgroundColor: '#E53935', marginTop: 10 }}
              >
                Generate Meal Plan
              </Button>
              {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
            </ThemedView>
          ) : (
            <>
              {/* AI Recommendations Message */}
              <ThemedView style={styles.aiRecommendationBanner}>
                <Ionicons name="nutrition-outline" size={24} color="#E53935" />
                <ThemedText style={styles.aiMessage}>
                  Meal plan based on your {userPreferences?.fitnessGoal === 'lose' ? 'weight loss' : 
                  userPreferences?.fitnessGoal === 'gain' ? 'muscle gain' : 'maintenance'} goal
                </ThemedText>
              </ThemedView>
              
              {/* Meal Plans */}
              <View style={styles.mealList}>
                {/* Display meal plan from Spoonacular */}
                {mealPlan.meals.map((meal, index) => (
                  <ThemedView key={meal.id} style={styles.mealSection}>
                    <ThemedText type="subtitle" style={styles.mealSectionTitle}>
                      {index === 0 ? 'Breakfast' : index === 1 ? 'Lunch' : 'Dinner'}
                    </ThemedText>
                    <TouchableRipple 
                      onPress={() => handleMealSelect(meal, index === 0 ? 'breakfast' : index === 1 ? 'lunch' : 'dinner')}
                    >
                      <View style={styles.mealCard}>
                        {meal.image ? (
                          <Avatar.Image 
                            size={60} 
                            source={{ uri: meal.image || `https://spoonacular.com/recipeImages/${meal.id}-240x150.jpg` }} 
                            style={styles.mealImage} 
                          />
                        ) : (
                          <ThemedText style={styles.mealEmoji}>🍽️</ThemedText>
                        )}
                        <ThemedView style={styles.mealCardContent}>
                          <ThemedText type="defaultSemiBold">{meal.title}</ThemedText>
                          <ThemedText style={styles.smallText}>
                            {Math.round(meal.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0)} cal • 
                            {Math.round(meal.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0)}g protein
                          </ThemedText>
                          <ThemedView style={styles.mealTags}>
                            {meal.readyInMinutes && (
                              <Chip style={styles.tag} textStyle={styles.tagText}>
                                {meal.readyInMinutes} min
                              </Chip>
                            )}
                            {meal.price && (
                              <Chip style={styles.tag} textStyle={styles.tagText}>
                                ${(typeof meal.price === 'number' ? (meal.price > 10 ? (meal.price / 100).toFixed(2) : meal.price.toFixed(2)) : '0.00')}
                              </Chip>
                            )}
                          </ThemedView>
                        </ThemedView>
                        <Ionicons name="chevron-forward" size={24} color="#E53935" />
                      </View>
                    </TouchableRipple>
                  </ThemedView>
                ))}
              </View>
            </>
          )}
        </ThemedView>
      </ScrollView>

      {/* Meal Details Modal */}
      <Modal
        visible={mealDetailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMealDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableRipple 
              onPress={() => setMealDetailsModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableRipple>

            {selectedMeal && (
              <ScrollView>
                <ThemedText type="title" style={styles.modalTitle}>{selectedMeal.title}</ThemedText>
                
                {selectedMeal.image && (
                  <Avatar.Image 
                    size={120} 
                    source={{ uri: selectedMeal.image || `https://spoonacular.com/recipeImages/${selectedMeal.id}-556x370.jpg` }} 
                    style={styles.modalImage} 
                  />
                )}
                
                <ThemedText type="subtitle" style={styles.sectionTitle}>Nutrition Information</ThemedText>
                <ThemedView style={styles.nutritionGridContainer}>
                  <ThemedView style={styles.nutritionGrid}>
                    <ThemedView style={styles.nutritionGridItem}>
                      <ThemedText style={styles.nutritionValue}>
                        {Math.round(selectedMeal.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0)}
                      </ThemedText>
                      <ThemedText style={styles.nutritionLabel}>Calories</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.nutritionGridItem}>
                      <ThemedText style={styles.nutritionValue}>
                        {Math.round(selectedMeal.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0)}g
                      </ThemedText>
                      <ThemedText style={styles.nutritionLabel}>Protein</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.nutritionGridItem}>
                      <ThemedText style={styles.nutritionValue}>
                        {Math.round(selectedMeal.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0)}g
                      </ThemedText>
                      <ThemedText style={styles.nutritionLabel}>Carbs</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.nutritionGridItem}>
                      <ThemedText style={styles.nutritionValue}>
                        {Math.round(selectedMeal.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0)}g
                      </ThemedText>
                      <ThemedText style={styles.nutritionLabel}>Fat</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
                
                <ThemedText type="subtitle" style={styles.sectionTitle}>Recipe Details</ThemedText>
                <ThemedView style={styles.recipeDetails}>
                  <ThemedText style={styles.recipeDetail}>
                    <Ionicons name="time-outline" size={18} color="#666" /> {selectedMeal.readyInMinutes || '--'} minutes
                  </ThemedText>
                  <ThemedText style={styles.recipeDetail}>
                    <Ionicons name="cash-outline" size={18} color="#666" /> ${((selectedMeal.price || 0) / 100).toFixed(2)} per serving
                  </ThemedText>
                  <ThemedText style={styles.recipeDetail}>
                    <Ionicons name="restaurant-outline" size={18} color="#666" /> {selectedMeal.servings || 1} servings
                  </ThemedText>
                </ThemedView>
                
                <Button 
                  mode="contained"
                  style={styles.viewRecipeButton}
                  onPress={() => {
                    // Redirect to recipe site or show full recipe
                    setMealDetailsModalVisible(false);
                  }}
                >
                  View Full Recipe
                </Button>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  iconButton: {
    padding: 8,
  },
  userName: {
    marginLeft: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dailyGoalTitle: {
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  smallText: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E53935',
  },
  aiRecommendationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE0E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  aiMessage: {
    marginLeft: 8,
    flex: 1,
  },
  mealList: {
    flex: 1,
  },
  mealSection: {
    marginBottom: 24,
  },
  mealSectionTitle: {
    marginBottom: 8,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  mealEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  mealImage: {
    marginRight: 12,
  },
  mealCardContent: {
    flex: 1,
  },
  mealTags: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#EEEEEE',
    marginRight: 6,
    height: 24,
  },
  tagText: {
    fontSize: 10,
  },
  noMealPlanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noMealPlanText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#E53935',
    marginTop: 10,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalImage: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  nutritionGridContainer: {
    marginBottom: 20,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionGridItem: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    color: '#666',
  },
  recipeDetails: {
    marginBottom: 20,
  },
  recipeDetail: {
    marginBottom: 8,
    fontSize: 14,
  },
  viewRecipeButton: {
    backgroundColor: '#E53935',
    marginTop: 10,
  },
}); 