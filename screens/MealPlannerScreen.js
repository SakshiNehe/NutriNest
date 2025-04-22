import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import { generateMealPlan } from '../services/mealPlannerService';

const MealPlannerScreen = () => {
  const [days, setDays] = useState('7');
  const [calories, setCalories] = useState('2000');
  const [restrictions, setRestrictions] = useState('');
  const [budget, setBudget] = useState('medium');
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      const plan = await generateMealPlan(days, calories, restrictions, budget);
      setMealPlan(plan);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.inputCard}>
        <Card.Content>
          <Text style={styles.title}>Meal Planner</Text>
          <TextInput
            label="Number of Days"
            value={days}
            onChangeText={setDays}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Daily Calories"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Dietary Restrictions"
            value={restrictions}
            onChangeText={setRestrictions}
            style={styles.input}
            placeholder="e.g., vegetarian, gluten-free"
          />
          <View style={styles.budgetContainer}>
            <Text style={styles.budgetLabel}>Budget:</Text>
            <View style={styles.budgetButtons}>
              {['low', 'medium', 'high'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.budgetButton,
                    budget === option && styles.budgetButtonActive,
                  ]}
                  onPress={() => setBudget(option)}
                >
                  <Text
                    style={[
                      styles.budgetButtonText,
                      budget === option && styles.budgetButtonTextActive,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Button
            mode="contained"
            onPress={handleGeneratePlan}
            loading={loading}
            style={styles.generateButton}
          >
            Generate Meal Plan
          </Button>
        </Card.Content>
      </Card>

      {mealPlan && (
        <Card style={styles.mealPlanCard}>
          <Card.Content>
            <Text style={styles.mealPlanTitle}>Your Meal Plan</Text>
            {mealPlan.days.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                <Text style={styles.dayTitle}>Day {index + 1}</Text>
                <View style={styles.mealContainer}>
                  <Text style={styles.mealTitle}>Breakfast</Text>
                  <Text>{day.meals.breakfast.name}</Text>
                  <Text>Calories: {day.meals.breakfast.calories}</Text>
                </View>
                <View style={styles.mealContainer}>
                  <Text style={styles.mealTitle}>Lunch</Text>
                  <Text>{day.meals.lunch.name}</Text>
                  <Text>Calories: {day.meals.lunch.calories}</Text>
                </View>
                <View style={styles.mealContainer}>
                  <Text style={styles.mealTitle}>Dinner</Text>
                  <Text>{day.meals.dinner.name}</Text>
                  <Text>Calories: {day.meals.dinner.calories}</Text>
                </View>
                <View style={styles.mealContainer}>
                  <Text style={styles.mealTitle}>Snacks</Text>
                  {day.meals.snacks.map((snack, snackIndex) => (
                    <Text key={snackIndex}>
                      {snack.name} ({snack.calories} calories)
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inputCard: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  budgetContainer: {
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  budgetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetButton: {
    flex: 1,
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  budgetButtonActive: {
    backgroundColor: '#6200ee',
  },
  budgetButtonText: {
    color: '#000',
  },
  budgetButtonTextActive: {
    color: '#fff',
  },
  generateButton: {
    marginTop: 16,
  },
  mealPlanCard: {
    margin: 16,
    elevation: 4,
  },
  mealPlanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  dayContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mealContainer: {
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default MealPlannerScreen; 