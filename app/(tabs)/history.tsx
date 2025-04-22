import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Divider, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
  const theme = useTheme();
  const [mealHistory, setMealHistory] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'meals', 'activities'

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('mealHistory');
      if (history) {
        setMealHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const renderHistoryItem = (item, index) => {
    return (
      <Card key={index} style={styles.historyCard}>
        <Card.Title
          title={item.name}
          subtitle={new Date(item.date).toLocaleDateString()}
          left={(props) => (
            <IconButton
              icon={item.type === 'meal' ? 'food' : 'run'}
              {...props}
            />
          )}
        />
        <Card.Content>
          <View style={styles.detailsContainer}>
            {item.type === 'meal' && (
              <>
                <Text style={styles.detailText}>Calories: {item.calories}</Text>
                <Text style={styles.detailText}>Protein: {item.protein}g</Text>
                <Text style={styles.detailText}>Carbs: {item.carbs}g</Text>
                <Text style={styles.detailText}>Fat: {item.fat}g</Text>
              </>
            )}
            {item.type === 'activity' && (
              <>
                <Text style={styles.detailText}>Duration: {item.duration} min</Text>
                <Text style={styles.detailText}>Calories Burned: {item.caloriesBurned}</Text>
              </>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const filteredHistory = mealHistory.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <View style={styles.filterContainer}>
          <IconButton
            icon="filter"
            size={24}
            onPress={() => {
              const filters = ['all', 'meals', 'activities'];
              const currentIndex = filters.indexOf(selectedFilter);
              const nextFilter = filters[(currentIndex + 1) % filters.length];
              setSelectedFilter(nextFilter);
            }}
          />
          <Text style={styles.filterText}>
            {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
          </Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item, index) => renderHistoryItem(item, index))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.primary} />
            <Text style={styles.emptyStateText}>No history yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your meal and activity history will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  historyCard: {
    marginBottom: 12,
    elevation: 2,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
}); 