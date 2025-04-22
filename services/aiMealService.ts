import { Configuration, OpenAIApi } from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MealSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface UserPreferences {
  targetCalories: number;
  dietaryRestrictions: string[];
  allergies: string[];
  fitnessGoal: 'lose' | 'maintain' | 'gain';
  activityLevel: string;
  mealPreference: string[];
}

const generateMealPrompt = (preferences: UserPreferences, mealType: string) => {
  return `Generate a healthy ${mealType} recipe based on the following preferences:
    - Target calories: ${preferences.targetCalories / 3} for this meal
    - Dietary restrictions: ${preferences.dietaryRestrictions.join(', ')}
    - Allergies to avoid: ${preferences.allergies.join(', ')}
    - Fitness goal: ${preferences.fitnessGoal}
    - Activity level: ${preferences.activityLevel}
    - Preferred cuisines: ${preferences.mealPreference.join(', ')}
    
    Please provide the recipe in the following JSON format:
    {
      "name": "Recipe Name",
      "calories": number,
      "protein": number (in grams),
      "carbs": number (in grams),
      "fat": number (in grams),
      "ingredients": ["ingredient 1", "ingredient 2", ...],
      "instructions": ["step 1", "step 2", ...],
      "type": "${mealType}"
    }`;
};

export const generateAIMealSuggestions = async (
  preferences: UserPreferences,
  mealType: string,
  count: number = 3
): Promise<MealSuggestion[]> => {
  try {
    // For demo purposes, return mock data
    // In production, you would use OpenAI API
    const mockSuggestions: MealSuggestion[] = [
      {
        name: "Protein-Packed Quinoa Bowl",
        calories: Math.round(preferences.targetCalories / 3),
        protein: 25,
        carbs: 45,
        fat: 15,
        ingredients: [
          "1 cup quinoa",
          "2 cups vegetable broth",
          "1 can chickpeas",
          "1 cup mixed vegetables",
          "2 tbsp olive oil",
          "Seasonings to taste"
        ],
        instructions: [
          "Cook quinoa in vegetable broth",
          "Sauté vegetables and chickpeas",
          "Combine and season"
        ],
        type: mealType as any
      },
      {
        name: "Mediterranean Salad Bowl",
        calories: Math.round(preferences.targetCalories / 3),
        protein: 20,
        carbs: 35,
        fat: 18,
        ingredients: [
          "2 cups mixed greens",
          "1/2 cup cherry tomatoes",
          "1/4 cup feta cheese",
          "1/2 cup cucumber",
          "2 tbsp olive oil",
          "1 tbsp balsamic vinegar"
        ],
        instructions: [
          "Chop vegetables",
          "Combine ingredients",
          "Dress with oil and vinegar"
        ],
        type: mealType as any
      },
      {
        name: "Asian-Style Stir Fry",
        calories: Math.round(preferences.targetCalories / 3),
        protein: 28,
        carbs: 40,
        fat: 12,
        ingredients: [
          "1 cup brown rice",
          "200g tofu or lean meat",
          "2 cups mixed vegetables",
          "2 tbsp soy sauce",
          "1 tbsp sesame oil"
        ],
        instructions: [
          "Cook rice according to package",
          "Stir fry protein and vegetables",
          "Combine with sauce"
        ],
        type: mealType as any
      }
    ];

    return mockSuggestions.slice(0, count);
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    throw error;
  }
};

export const saveMealToHistory = async (meal: MealSuggestion, date: string) => {
  try {
    const historyKey = 'mealHistory';
    const existingHistory = await AsyncStorage.getItem(historyKey);
    const history = existingHistory ? JSON.parse(existingHistory) : [];
    
    history.unshift({
      ...meal,
      date,
      id: Date.now().toString()
    });
    
    await AsyncStorage.setItem(historyKey, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving meal to history:', error);
    throw error;
  }
};

export const addMealToPlan = async (meal: MealSuggestion, date: string) => {
  try {
    const planKey = `mealPlan_${date}`;
    const existingPlan = await AsyncStorage.getItem(planKey);
    const plan = existingPlan ? JSON.parse(existingPlan) : { meals: [] };
    
    plan.meals.push(meal);
    await AsyncStorage.setItem(planKey, JSON.stringify(plan));
    
    // Also save to history
    await saveMealToHistory(meal, date);
    
    return plan;
  } catch (error) {
    console.error('Error adding meal to plan:', error);
    throw error;
  }
}; 