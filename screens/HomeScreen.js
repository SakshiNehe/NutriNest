import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NutriNest</Text>
        <Text style={styles.subtitle}>Your Personal Nutrition Assistant</Text>
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('MealPlanner')}
        >
          <MaterialIcons name="restaurant-menu" size={32} color="#6200ee" />
          <Text style={styles.navButtonText}>Meal Planner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <MaterialIcons name="person" size={32} color="#6200ee" />
          <Text style={styles.navButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Today's Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Calories Consumed</Text>
            <Text style={styles.summaryValue}>1,200 / 2,000</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Water Intake</Text>
            <Text style={styles.summaryValue}>1.5 / 2.5 L</Text>
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
  header: {
    padding: 20,
    backgroundColor: '#6200ee',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 4,
  },
  navButton: {
    alignItems: 'center',
    padding: 10,
  },
  navButtonText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6200ee',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 