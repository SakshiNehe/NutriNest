import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getGeminiResponse } from './geminiService';

// Save a meal plan to Firestore
export const saveMealPlan = async (userId, mealPlan) => {
  try {
    const mealPlansRef = collection(db, 'mealPlans');
    const mealPlanData = {
      userId,
      ...mealPlan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(mealPlansRef, mealPlanData);
    return { id: docRef.id, ...mealPlanData };
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
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting meal plans:', error);
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
export const updateMealPlan = async (mealPlanId, updates) => {
  try {
    const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
    await updateDoc(mealPlanRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { id: mealPlanId, ...updates };
  } catch (error) {
    console.error('Error updating meal plan:', error);
    throw error;
  }
};

// Delete a meal plan
export const deleteMealPlan = async (mealPlanId) => {
  try {
    const mealPlanRef = doc(db, 'mealPlans', mealPlanId);
    await deleteDoc(mealPlanRef);
    return mealPlanId;
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    throw error;
  }
};

const MEAL_PLAN_PROMPT = `Generate a detailed meal plan for the following requirements:
- Number of days: {days}
- Calories per day: {calories}
- Dietary restrictions: {restrictions}
- Budget: {budget}

Please provide the following for each day:
1. Breakfast, lunch, dinner, and snacks
2. Nutritional information for each meal
3. Ingredient quantities
4. Preparation instructions
5. Estimated cost
6. Shopping list
7. Budget-friendly alternatives

Format the response as a JSON object with the following structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": {
        "breakfast": { "name": "", "calories": 0, "ingredients": [], "instructions": "", "cost": 0 },
        "lunch": { "name": "", "calories": 0, "ingredients": [], "instructions": "", "cost": 0 },
        "dinner": { "name": "", "calories": 0, "ingredients": [], "instructions": "", "cost": 0 },
        "snacks": [{ "name": "", "calories": 0, "ingredients": [], "instructions": "", "cost": 0 }]
      },
      "totalCalories": 0,
      "totalCost": 0
    }
  ],
  "shoppingList": [],
  "budgetFriendlyAlternatives": []
}`;

export const generateMealPlan = async (days, calories, restrictions, budget) => {
  try {
    const prompt = MEAL_PLAN_PROMPT
      .replace('{days}', days)
      .replace('{calories}', calories)
      .replace('{restrictions}', restrictions || 'None')
      .replace('{budget}', budget || 'Flexible');

    const response = await getGeminiResponse(prompt);
    const mealPlan = JSON.parse(response);
    return mealPlan;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new Error('Failed to generate meal plan');
  }
};

export const getBudgetFriendlySuggestions = async (currentMealPlan) => {
  try {
    const prompt = `Given the following meal plan, suggest budget-friendly alternatives while maintaining similar nutritional value:
${JSON.stringify(currentMealPlan, null, 2)}

Please provide alternatives that:
1. Reduce cost by at least 20%
2. Maintain similar nutritional value
3. Use common, easily available ingredients
4. Are simple to prepare

Format the response as a JSON array of alternatives.`;

    const response = await getGeminiResponse(prompt);
    const alternatives = JSON.parse(response);
    return alternatives;
  } catch (error) {
    console.error('Error getting budget-friendly suggestions:', error);
    throw new Error('Failed to get budget-friendly suggestions');
  }
};

export default {
  saveMealPlan,
  getUserMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
  generateMealPlan,
  getBudgetFriendlySuggestions
}; 