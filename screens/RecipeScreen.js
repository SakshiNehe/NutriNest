import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';

const RecipeScreen = ({ route }) => {
  const { recipe } = route.params;
  const [servings, setServings] = useState(recipe.servings || 1);

  const adjustIngredients = (amount) => {
    return (amount * servings) / (recipe.servings || 1);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Cover source={{ uri: recipe.image }} style={styles.image} />
        <Card.Content>
          <Text style={styles.title}>{recipe.name}</Text>
          <View style={styles.chipContainer}>
            <Chip style={styles.chip}>{recipe.calories} calories</Chip>
            <Chip style={styles.chip}>{recipe.prepTime} mins</Chip>
            <Chip style={styles.chip}>{recipe.difficulty}</Chip>
          </View>

          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <Text key={index} style={styles.ingredient}>
              • {adjustIngredients(ingredient.amount)} {ingredient.unit} {ingredient.name}
            </Text>
          ))}

          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.instructions.map((step, index) => (
            <View key={index} style={styles.instructionStep}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.instruction}>{step}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Nutritional Information</Text>
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              <Text style={styles.nutritionValue}>{recipe.nutrition.protein}g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Carbs</Text>
              <Text style={styles.nutritionValue}>{recipe.nutrition.carbs}g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fat</Text>
              <Text style={styles.nutritionValue}>{recipe.nutrition.fat}g</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  image: {
    height: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 4,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#6200ee',
    color: '#fff',
    borderRadius: 12,
    textAlign: 'center',
    marginRight: 8,
    lineHeight: 24,
  },
  instruction: {
    flex: 1,
    fontSize: 16,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecipeScreen; 