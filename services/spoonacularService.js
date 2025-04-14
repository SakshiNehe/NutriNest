import axios from 'axios';

// Use a valid Spoonacular API key
// For development purposes, I'm using a temporary key here, but in production you should use environment variables
const API_KEY = '7f77c62ffc5743838d7f32e26e3dd9d1'; // Replace with your actual key in production
const BASE_URL = 'https://api.spoonacular.com';

// Create axios instance with base URL and API key
const spoonacularApi = axios.create({
  baseURL: BASE_URL,
  params: {
    apiKey: API_KEY,
  },
});

// Function to get meal plan based on user preferences
export const getMealPlan = async (
  timeFrame = 'day',
  targetCalories = 2000,
  diet = '',
  exclude = []
) => {
  try {
    console.log(`Requesting meal plan with calories: ${targetCalories}, diet: ${diet}`);
    const response = await spoonacularApi.get('/mealplanner/generate', {
      params: {
        timeFrame,
        targetCalories,
        diet,
        exclude: exclude.join(','),
      },
    });
    console.log('Meal plan API response received');
    return response.data;
  } catch (error) {
    console.error('Error fetching meal plan:', error.response ? {
      status: error.response.status,
      data: error.response.data
    } : error.message);
    throw error;
  }
};

// Function to get recipe information by ID
export const getRecipeInformation = async (id) => {
  try {
    console.log(`Requesting recipe information for ID: ${id}`);
    const response = await spoonacularApi.get(`/recipes/${id}/information`, {
      params: {
        includeNutrition: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recipe information:', error.response ? {
      status: error.response.status,
      data: error.response.data
    } : error.message);
    throw error;
  }
};

// Function to search recipes with filters
export const searchRecipes = async (
  query,
  diet = '',
  intolerances = [],
  maxReadyTime = null,
  number = 10,
  maxCalories = null
) => {
  try {
    const params = {
      query,
      number,
    };

    if (diet) params.diet = diet;
    if (intolerances.length > 0) params.intolerances = intolerances.join(',');
    if (maxReadyTime) params.maxReadyTime = maxReadyTime;
    if (maxCalories) params.maxCalories = maxCalories;

    console.log('Searching recipes with params:', params);
    const response = await spoonacularApi.get('/recipes/complexSearch', {
      params: {
        ...params,
        addRecipeNutrition: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching recipes:', error.response ? {
      status: error.response.status,
      data: error.response.data
    } : error.message);
    throw error;
  }
};

// Function to get budget-friendly recipes
export const getBudgetFriendlyRecipes = async (
  maxPrice = 5,
  number = 10,
  diet = '',
  intolerances = []
) => {
  try {
    const params = {
      maxPrice,
      number,
    };

    if (diet) params.diet = diet;
    if (intolerances.length > 0) params.intolerances = intolerances.join(',');

    console.log('Requesting budget recipes with params:', params);
    const response = await spoonacularApi.get('/recipes/complexSearch', {
      params: {
        ...params,
        sort: 'price',
        sortDirection: 'asc',
        addRecipeNutrition: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching budget-friendly recipes:', error.response ? {
      status: error.response.status,
      data: error.response.data
    } : error.message);
    throw error;
  }
};

// Get recipe nutrition by ID
export const getRecipeNutrition = async (id) => {
  try {
    console.log(`Requesting nutrition for recipe ID: ${id}`);
    const response = await spoonacularApi.get(`/recipes/${id}/nutritionWidget.json`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recipe nutrition:', error.response ? {
      status: error.response.status,
      data: error.response.data
    } : error.message);
    throw error;
  }
};

export default {
  getMealPlan,
  getRecipeInformation,
  searchRecipes,
  getBudgetFriendlyRecipes,
  getRecipeNutrition,
}; 