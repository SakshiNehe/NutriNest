import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with the correct API key
const genAI = new GoogleGenerativeAI('AIzaSyBwfd57GFljJrHWbESXLVVMcnJ3xH91uNc');

// Use the correct model name based on latest documentation
const MODEL_NAME = 'gemini-1.5-pro';

export interface NutritionResponse {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  suggestions: string[];
}

export interface MealItem {
  meal: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  preparationTime: number;
}

export interface MealPlanResponse {
  date: string;
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
  snacks: MealItem[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

/**
 * Helper function to clean JSON string from markdown code blocks
 */
function cleanJsonResponse(text: string): string {
  // Check if the response is wrapped in markdown code blocks
  const jsonPattern = /```(?:json)?\s*([\s\S]*?)```/;
  const match = text.match(jsonPattern);
  
  if (match && match[1]) {
    console.log('Found JSON within markdown code block, extracting...');
    return match[1].trim();
  }
  
  // If no markdown blocks found, return the original text
  return text.trim();
}

export const geminiService = {
  async generateMealPlan(userPreferences: {
    dietaryRestrictions: string[];
    calorieGoal: number;
    allergies: string[];
    fitnessGoal: string;
    likes?: string[];
    dislikes?: string[];
    cuisinePreferences?: string[];
    mealPrepTime?: 'quick' | 'medium' | 'any';
  }): Promise<MealPlanResponse> {
    try {
      // Use the correct model
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      // Calculate macro distributions based on fitness goal
      let proteinPercentage, carbsPercentage, fatPercentage;
      switch (userPreferences.fitnessGoal.toLowerCase()) {
        case 'muscle gain':
          proteinPercentage = 30;
          carbsPercentage = 50;
          fatPercentage = 20;
          break;
        case 'weight loss':
          proteinPercentage = 40;
          carbsPercentage = 30;
          fatPercentage = 30;
          break;
        case 'lose':
          proteinPercentage = 40;
          carbsPercentage = 30;
          fatPercentage = 30;
          break;
        default: // maintenance
          proteinPercentage = 30;
          carbsPercentage = 40;
          fatPercentage = 30;
      }

      const prompt = `You are an expert nutritionist and meal planner. Create a detailed, healthy American meal plan following these specifications:

USER PREFERENCES:
- Daily Calorie Goal: ${userPreferences.calorieGoal} calories
- Dietary Restrictions: ${userPreferences.dietaryRestrictions.join(', ') || 'None'}
- Allergies: ${userPreferences.allergies.join(', ') || 'None'}
- Fitness Goal: ${userPreferences.fitnessGoal}
- Food Preferences:
  * Likes: ${userPreferences.likes?.join(', ') || 'Not specified'}
  * Dislikes: ${userPreferences.dislikes?.join(', ') || 'Not specified'}
- Cuisine Preferences: Indian
- Meal Prep Time: ${userPreferences.mealPrepTime || 'Any'}

MACRO DISTRIBUTION:
- Protein: ${proteinPercentage}% (${Math.round((userPreferences.calorieGoal * proteinPercentage/100) / 4)}g)
- Carbs: ${carbsPercentage}% (${Math.round((userPreferences.calorieGoal * carbsPercentage/100) / 4)}g)
- Fat: ${fatPercentage}% (${Math.round((userPreferences.calorieGoal * fatPercentage/100) / 9)}g)

Generate a complete american meal plan that:
1. Meets the calorie and macro goals
2. Uses authentic Indian recipes and ingredients
3. Avoids all allergens and restricted foods
4. Includes detailed recipes and instructions
5. Provides exact nutritional information
6. Considers preparation time preferences
7. Balances spices and flavors appropriately

IMPORTANT: Return ONLY pure JSON without any markdown formatting like \`\`\`json or \`\`\` wrappers. The data must be in the following format:
{
  "date": "YYYY-MM-DD",
  "breakfast": {
    "meal": "Name of meal",
    "description": "Brief description",
    "ingredients": ["ingredient1", "ingredient2"],
    "instructions": ["step1", "step2"],
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "preparationTime": number (in minutes)
  },
  "lunch": {same structure as breakfast},
  "dinner": {same structure as breakfast},
  "snacks": [{same structure as breakfast}],
  "totalNutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}`;

      console.log('Sending prompt to Gemini:', prompt);

      // Configure the generative model with JSON output
      const generationConfig = {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      };

      // Using the current API pattern according to latest documentation
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const rawText = response.text();
      
      console.log('Received raw response from Gemini:', rawText);

      try {
        // Clean the response from any markdown formatting
        const cleanedJsonText = cleanJsonResponse(rawText);
        console.log('Cleaned JSON text:', cleanedJsonText);
        
        const parsedResponse = JSON.parse(cleanedJsonText);
        
        // Validate the response structure
        if (!this.validateMealPlanResponse(parsedResponse)) {
          throw new Error('Invalid meal plan structure received from AI');
        }
        return parsedResponse;
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.error('Raw response:', rawText);
        throw new Error('Failed to parse meal plan from AI response');
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw error;
    }
  },

  validateMealPlanResponse(response: any): boolean {
    const requiredMealProperties = [
      'meal', 'description', 'ingredients', 'instructions',
      'calories', 'protein', 'carbs', 'fat', 'preparationTime'
    ];

    const validateMeal = (meal: any) => {
      return requiredMealProperties.every(prop => {
        const hasProperty = prop in meal;
        if (!hasProperty) {
          console.error(`Missing property ${prop} in meal:`, meal);
        }
        return hasProperty;
      });
    };

    try {
      if (!response.date || !response.totalNutrition) {
        console.error('Missing date or totalNutrition');
        return false;
      }

      if (!validateMeal(response.breakfast) || 
          !validateMeal(response.lunch) || 
          !validateMeal(response.dinner)) {
        return false;
      }

      if (!Array.isArray(response.snacks) || 
          !response.snacks.every((snack: any) => validateMeal(snack))) {
        console.error('Invalid snacks array');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating meal plan:', error);
      return false;
    }
  },

  async getNutritionAdvice(query: string): Promise<NutritionResponse> {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `As a nutrition expert, analyze and provide detailed nutrition advice for: ${query}. 
      Consider:
      1. Caloric content
      2. Macro distribution
      3. Health benefits
      4. Potential concerns
      5. Alternative suggestions

      IMPORTANT: Return ONLY pure JSON without any markdown formatting like \`\`\`json or \`\`\` wrappers. The data must be in this structure:
      {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "suggestions": [
          "detailed suggestion 1",
          "detailed suggestion 2",
          "detailed suggestion 3"
        ]
      }`;

      const generationConfig = {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const response = result.response;
      const rawText = response.text();
      
      // Clean and parse the response
      const cleanedJsonText = cleanJsonResponse(rawText);
      return JSON.parse(cleanedJsonText);
    } catch (error) {
      console.error('Error getting nutrition advice:', error);
      throw error;
    }
  },

  async getRecipeSuggestions(
    ingredients: string[],
    preferences: {
      dietaryRestrictions?: string[];
      allergies?: string[];
      mealType?: string;
      cuisine?: string;
    } = {}
  ): Promise<MealItem[]> {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `As a professional chef specializing in Indian cuisine, suggest creative and healthy Indian recipes using these ingredients: ${ingredients.join(', ')}.

      Consider these preferences:
      - Dietary restrictions: ${preferences.dietaryRestrictions?.join(', ') || 'None'}
      - Allergies: ${preferences.allergies?.join(', ') || 'None'}
      - Meal type: ${preferences.mealType || 'Any'}
      - Cuisine: Indian

      For each recipe, provide:
      1. Name and brief description
      2. Complete ingredients list with Indian spices
      3. Step-by-step instructions
      4. Nutritional information
      5. Preparation time

      IMPORTANT: Return ONLY pure JSON without any markdown formatting like \`\`\`json or \`\`\` wrappers. The response should be an array of recipe objects.`;

      const generationConfig = {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const response = result.response;
      const rawText = response.text();
      
      // Clean and parse the response
      const cleanedJsonText = cleanJsonResponse(rawText);
      return JSON.parse(cleanedJsonText);
    } catch (error) {
      console.error('Error getting recipe suggestions:', error);
      throw error;
    }
  }
}; 