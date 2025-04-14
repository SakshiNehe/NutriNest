import { collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Save a nutrition entry
export const saveNutritionEntry = async (userId, nutritionData) => {
  try {
    // Format the date to YYYY-MM-DD for easy querying
    const date = new Date(nutritionData.date || new Date());
    const formattedDate = date.toISOString().split('T')[0];
    
    const nutritionEntry = {
      userId,
      ...nutritionData,
      date: formattedDate,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'nutritionEntries'), nutritionEntry);
    return docRef.id;
  } catch (error) {
    console.error('Error saving nutrition entry:', error);
    throw error;
  }
};

// Get user's nutrition entries for a specific date
export const getNutritionEntriesByDate = async (userId, date) => {
  try {
    const formattedDate = date.toISOString().split('T')[0];
    const entriesRef = collection(db, 'nutritionEntries');
    const q = query(
      entriesRef, 
      where('userId', '==', userId),
      where('date', '==', formattedDate)
    );
    
    const querySnapshot = await getDocs(q);
    const entries = [];
    
    querySnapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return entries;
  } catch (error) {
    console.error('Error fetching nutrition entries:', error);
    throw error;
  }
};

// Get user's nutrition entries for a date range
export const getNutritionEntriesInRange = async (userId, startDate, endDate) => {
  try {
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    const entriesRef = collection(db, 'nutritionEntries');
    const q = query(
      entriesRef,
      where('userId', '==', userId),
      where('date', '>=', formattedStartDate),
      where('date', '<=', formattedEndDate)
    );
    
    const querySnapshot = await getDocs(q);
    const entries = [];
    
    querySnapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return entries;
  } catch (error) {
    console.error('Error fetching nutrition entries for range:', error);
    throw error;
  }
};

// Update a nutrition entry
export const updateNutritionEntry = async (entryId, updatedData) => {
  try {
    await updateDoc(doc(db, 'nutritionEntries', entryId), updatedData);
    return true;
  } catch (error) {
    console.error('Error updating nutrition entry:', error);
    throw error;
  }
};

// Delete a nutrition entry
export const deleteNutritionEntry = async (entryId) => {
  try {
    await deleteDoc(doc(db, 'nutritionEntries', entryId));
    return true;
  } catch (error) {
    console.error('Error deleting nutrition entry:', error);
    throw error;
  }
};

// Get a specific nutrition entry
export const getNutritionEntry = async (entryId) => {
  try {
    const entryDoc = await getDoc(doc(db, 'nutritionEntries', entryId));
    if (entryDoc.exists()) {
      return {
        id: entryDoc.id,
        ...entryDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching nutrition entry:', error);
    throw error;
  }
};

// Calculate total nutrition for a list of entries
export const calculateTotalNutrition = (entries = []) => {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };
  
  entries.forEach(entry => {
    totals.calories += entry.calories || 0;
    totals.protein += entry.protein || 0;
    totals.carbs += entry.carbs || 0;
    totals.fat += entry.fat || 0;
  });
  
  return totals;
};

export default {
  saveNutritionEntry,
  getNutritionEntriesByDate,
  getNutritionEntriesInRange,
  updateNutritionEntry,
  deleteNutritionEntry,
  getNutritionEntry,
  calculateTotalNutrition
}; 