import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, Dimensions, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, Button, Card, Avatar, Chip, TouchableRipple, Text, IconButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth } from '../../config/firebaseConfig';
import { getUserPreferences } from '../../services/userProfileService';
import { generateMealPlan, saveMealPlan, getUserMealPlans, getMealPlan } from '../../services/mealPlannerService';
import staticMealPlans from "../../staticMealPlans.json"
import { generateAIMealSuggestions, addMealToPlan } from '../../services/aiMealService';
const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

export default function MealPlannerScreen() {
  const theme = useTheme();
  const router = useRouter();
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
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [suggestionsModalVisible, setSuggestionsModalVisible] = useState(false);

  
  // Calculate total calories in the meal plan
  const totalCaloriesPlanned = mealPlan?.meals?.reduce((sum, meal) => {
    const calories = meal.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount;
    return sum + (calories || 0);
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
        
        // Get meal plans for the selected date from static JSON
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const planForDate = staticMealPlans.mealPlans.find(plan => plan.date === formattedDate);
        
        if (planForDate) {
          setMealPlan(planForDate);
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
      setError('');
      
      const user = auth.currentUser;
      if (!user || !userPreferences) {
        setError('User preferences not found. Please update your profile.');
        return;
      }
  
      // Get a random meal plan from our static data
      const randomPlanIndex = Math.floor(Math.random() * staticMealPlans.mealPlans.length);
      const newMealPlan = { ...staticMealPlans.mealPlans[randomPlanIndex] };
      
      // Update the date to match selected date
      newMealPlan.date = selectedDate.toISOString().split('T')[0];
      
      // Adjust calories to match user preferences
      const targetCalories = userPreferences.targetCalories || 2000;
      const currentCalories = newMealPlan.meals.reduce((sum, meal) => {
        return sum + (meal.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0)
      }, 0);
      
      // Calculate adjustment factor
      const adjustmentFactor = targetCalories / currentCalories;
      
      // Adjust all nutrition values
      newMealPlan.meals = newMealPlan.meals.map(meal => {
        const adjustedMeal = { ...meal };
        adjustedMeal.nutrition.nutrients = adjustedMeal.nutrition.nutrients.map(nutrient => {
          return {
            ...nutrient,
            amount: Math.round(nutrient.amount * adjustmentFactor)
          };
        });
        return adjustedMeal;
      });
  
      // In a real app, you might still want to save this to Firestore
      // const mealPlanId = await saveMealPlan(user.uid, newMealPlan);
      // setMealPlan({ id: mealPlanId, ...newMealPlan });
      
      // For demo purposes, we'll just set it directly
      setMealPlan(newMealPlan);
      
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setError('Failed to generate meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  const loadMealPlan = async () => {
    try {
      const storedPlan = await AsyncStorage.getItem(`mealPlan_${selectedDate.toDateString()}`);
      if (storedPlan) {
        setMealPlan(JSON.parse(storedPlan));
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
    }
  };

  const handleAddMeal = async (mealType) => {
    setSelectedMealType(mealType);
    try {
      const suggestions = await generateAIMealSuggestions(userPreferences, mealType);
      setAiSuggestions(suggestions);
      setSuggestionsModalVisible(true);
    } catch (error) {
      console.error('Error getting meal suggestions:', error);
      setError('Failed to get meal suggestions. Please try again.');
    }
  };

  const handleSelectSuggestion = async (meal) => {
    try {
      const updatedPlan = await addMealToPlan(meal, selectedDate.toISOString().split('T')[0]);
      setMealPlan(updatedPlan);
      setSuggestionsModalVisible(false);
      setAiSuggestions([]);
    } catch (error) {
      console.error('Error adding meal to plan:', error);
      setError('Failed to add meal to plan. Please try again.');
    }
  };

  const renderMealSection = (mealType, title) => {
    const meals = mealPlan?.meals?.filter(meal => meal.type === mealType) || [];
    
    return (
      <Card style={styles.mealCard}>
        <Card.Title
          title={title}
          right={(props) => (
            <IconButton
              {...props}
              icon="plus"
              onPress={() => handleAddMeal(mealType)}
            />
          )}
        />
        <Card.Content>
          {meals.length > 0 ? (
            meals.map((meal, index) => (
              <TouchableRipple 
                key={index}
                onPress={() => handleMealSelect(meal, mealType)}
              >
                <View style={styles.mealItem}>
                  <View>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealMacros}>
                      {meal.calories} cal • {meal.protein}g protein • {meal.carbs}g carbs • {meal.fat}g fat
                    </Text>
                  </View>
                  <IconButton icon="chevron-right" size={24} />
                </View>
              </TouchableRipple>
            ))
          ) : (
            <Text style={styles.emptyMealText}>No meals added yet</Text>
          )}
        </Card.Content>
      </Card>
    );
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
              
              {/* Meal Sections */}
              {renderMealSection('breakfast', 'Breakfast')}
              {renderMealSection('lunch', 'Lunch')}
              {renderMealSection('dinner', 'Dinner')}
              {renderMealSection('snacks', 'Snacks')}
            </>
          )}
        </ThemedView>
      </ScrollView>

      {/* AI Suggestions Modal */}
      <Modal
        visible={suggestionsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSuggestionsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Suggested Meals</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setSuggestionsModalVisible(false)}
              />
            </View>

            <ScrollView>
              {aiSuggestions.map((suggestion, index) => (
                <Card key={index} style={styles.suggestionCard}>
                  <Card.Title title={suggestion.name} />
                  <Card.Content>
                    <View style={styles.macrosContainer}>
                      <Text style={styles.macroText}>Calories: {suggestion.calories}</Text>
                      <Text style={styles.macroText}>Protein: {suggestion.protein}g</Text>
                      <Text style={styles.macroText}>Carbs: {suggestion.carbs}g</Text>
                      <Text style={styles.macroText}>Fat: {suggestion.fat}g</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Ingredients:</Text>
                    {suggestion.ingredients.map((ingredient, i) => (
                      <Text key={i} style={styles.listItem}>• {ingredient}</Text>
                    ))}

                    <Text style={styles.sectionTitle}>Instructions:</Text>
                    {suggestion.instructions.map((instruction, i) => (
                      <Text key={i} style={styles.listItem}>{i + 1}. {instruction}</Text>
                    ))}

                    <Button
                      mode="contained"
                      onPress={() => handleSelectSuggestion(suggestion)}
                      style={styles.addButton}
                    >
                      Add to Meal Plan
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  mealCard: {
    marginBottom: 16,
    elevation: 2,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealName: {
    fontSize: 16,
  },
  mealCalories: {
    fontSize: 14,
    color: '#666',
  },
  emptyMealText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 16,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  macroText: {
    fontSize: 14,
    color: '#666',
  },
  listItem: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
  addButton: {
    marginTop: 16,
    backgroundColor: '#E53935',
  },
  mealMacros: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 