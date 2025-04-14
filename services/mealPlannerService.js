import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import spoonacularService from './spoonacularService';

// Save a meal plan to Firestore
export const saveMealPlan = async (userId, mealPlanData) => {
  try {
    const mealPlanRef = await addDoc(collection(db, 'mealPlans'), {
      userId,
      ...mealPlanData,
      createdAt: new Date().toISOString()
    });
    return mealPlanRef.id;
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw error;
  }
};

// Get user's meal plans
export const getUserMealPlans = async (userId) => {
  try {
    const mealPlansRef = collection(db, 'mealPlans');
    const q = query(mealPlansRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const mealPlans = [];
    querySnapshot.forEach((doc) => {
      mealPlans.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return mealPlans;
  } catch (error) {
    console.error('Error fetching user meal plans:', error);
    throw error;
  }
};

// Get a specific meal plan
export const getMealPlan = async (mealPlanId) => {
  try {
    const mealPlanDoc = await getDoc(doc(db, 'mealPlans', mealPlanId));
    if (mealPlanDoc.exists()) {
      return {
        id: mealPlanDoc.id,
        ...mealPlanDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    throw error;
  }
};

// Update a meal plan
export const updateMealPlan = async (mealPlanId, updatedData) => {
  try {
    await updateDoc(doc(db, 'mealPlans', mealPlanId), updatedData);
    return true;
  } catch (error) {
    console.error('Error updating meal plan:', error);
    throw error;
  }
};

// Delete a meal plan
export const deleteMealPlan = async (mealPlanId) => {
  try {
    await deleteDoc(doc(db, 'mealPlans', mealPlanId));
    return true;
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    throw error;
  }
};

// Generate a meal plan using Spoonacular API based on user preferences
export const generateMealPlan = async (userPreferences) => {
  try {
    const {
      targetCalories = 2000,
      dietaryPreferences = '',
      allergies = []
    } = userPreferences;
    
    console.log(`Generating meal plan with preferences:`, userPreferences);
    
    // Get meal plan from Spoonacular
    try {
      const mealPlanData = await spoonacularService.getMealPlan(
        'day',
        targetCalories,
        dietaryPreferences,
        allergies
      );
      
      // Fetch detailed nutrition information for each meal
      const meals = mealPlanData.meals || [];
      
      if (meals.length === 0) {
        console.log('No meals returned from Spoonacular API, using fallback data');
        return getFallbackMealPlan(targetCalories);
      }
      
      console.log(`Successfully fetched meal plan with ${meals.length} meals`);
      
      const mealsWithNutrition = await Promise.all(
        meals.map(async (meal) => {
          try {
            const recipeInfo = await spoonacularService.getRecipeInformation(meal.id);
            return {
              ...meal,
              nutrition: recipeInfo.nutrition || {},
              image: recipeInfo.image || '',
              price: recipeInfo.pricePerServing || 0,
              readyInMinutes: recipeInfo.readyInMinutes || 0
            };
          } catch (error) {
            console.error(`Error fetching details for meal ${meal.id}:`, error);
            // Return the meal with default values if recipe info fails
            return {
              ...meal,
              nutrition: {},
              image: '',
              price: 0,
              readyInMinutes: 30
            };
          }
        })
      );
      
      return {
        ...mealPlanData,
        meals: mealsWithNutrition
      };
    } catch (error) {
      console.error('Error with Spoonacular API, using fallback data:', error);
      return getFallbackMealPlan(targetCalories);
    }
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw error;
  }
};

// Fallback meal plan in case the API fails
const getFallbackMealPlan = (targetCalories = 2000) => {
  const caloriesPerMeal = Math.floor(targetCalories / 3);
  
  return {
    meals: [
      {
        id: 1,
        title: "Scrambled Eggs with Vegetables",
        readyInMinutes: 15,
        servings: 1,
        image: "https://spoonacular.com/recipeImages/635446-312x231.jpg",
        nutrition: {
          calories: caloriesPerMeal,
          protein: Math.floor(caloriesPerMeal * 0.3 / 4), // 30% protein (4 cal per gram)
          fat: Math.floor(caloriesPerMeal * 0.4 / 9),     // 40% fat (9 cal per gram)
          carbs: Math.floor(caloriesPerMeal * 0.3 / 4)    // 30% carbs (4 cal per gram)
        },
        price: 2.5
      },
      {
        id: 2,
        title: "Grilled Chicken Salad",
        readyInMinutes: 20,
        servings: 1,
        image: "https://spoonacular.com/recipeImages/649931-312x231.jpg",
        nutrition: {
          calories: caloriesPerMeal,
          protein: Math.floor(caloriesPerMeal * 0.4 / 4),
          fat: Math.floor(caloriesPerMeal * 0.3 / 9),
          carbs: Math.floor(caloriesPerMeal * 0.3 / 4)
        },
        price: 3.5
      },
      {
        id: 3,
        title: "Baked Salmon with Vegetables",
        readyInMinutes: 25,
        servings: 1,
        image: "https://spoonacular.com/recipeImages/641057-312x231.jpg",
        nutrition: {
          calories: caloriesPerMeal,
          protein: Math.floor(caloriesPerMeal * 0.35 / 4),
          fat: Math.floor(caloriesPerMeal * 0.4 / 9),
          carbs: Math.floor(caloriesPerMeal * 0.25 / 4)
        },
        price: 4.5
      }
    ],
    nutrients: {
      calories: targetCalories,
      protein: Math.floor(targetCalories * 0.35 / 4),
      fat: Math.floor(targetCalories * 0.35 / 9),
      carbohydrates: Math.floor(targetCalories * 0.3 / 4)
    }
  };
};

// Get budget-friendly meal suggestions
export const getBudgetMeals = async (userPreferences) => {
  try {
    const {
      dietaryPreferences,
      allergies = []
    } = userPreferences;
    
    const budgetMeals = await spoonacularService.getBudgetFriendlyRecipes(
      5, // Max price per serving
      10, // Number of results
      dietaryPreferences,
      allergies
    );
    
    return budgetMeals.results || [];
  } catch (error) {
    console.error('Error fetching budget meals:', error);
    throw error;
  }
};

export default {
  saveMealPlan,
  getUserMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
  generateMealPlan,
  getBudgetMeals
}; 