import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

export interface NutritionResponse {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  suggestions: string[];
}

export interface MealPlanResponse {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string[];
  nutritionInfo: NutritionResponse;
}

export const geminiService = {
  async getNutritionAdvice(query: string): Promise<NutritionResponse> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `As a nutrition expert, provide detailed nutrition advice for: ${query}. 
      Format the response as a JSON object with the following structure:
      {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "suggestions": string[]
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      return JSON.parse(text);
    } catch (error) {
      console.error('Error getting nutrition advice:', error);
      throw error;
    }
  },

  async getMealPlan(preferences: string): Promise<MealPlanResponse> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `Create a personalized meal plan based on these preferences: ${preferences}.
      Format the response as a JSON object with the following structure:
      {
        "breakfast": string,
        "lunch": string,
        "dinner": string,
        "snacks": string[],
        "nutritionInfo": {
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "suggestions": string[]
        }
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error getting meal plan:', error);
      throw error;
    }
  },

  async getRecipeSuggestions(ingredients: string[]): Promise<string[]> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `Suggest healthy recipes using these ingredients: ${ingredients.join(', ')}.
      Format the response as a JSON array of recipe suggestions.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Error getting recipe suggestions:', error);
      throw error;
    }
  }
}; 