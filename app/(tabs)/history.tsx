import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Divider, useTheme, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [mealHistory, setMealHistory] = useState([]);
  const [intakeHistory, setIntakeHistory] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'planned', 'consumed'
  const [mergedHistory, setMergedHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    // Merge and sort histories when either history changes
    const merged = [...mealHistory, ...intakeHistory].sort((a, b) => {
      // Sort by date, newest first
      const dateA = new Date(a.consumedAt || a.date);
      const dateB = new Date(b.consumedAt || b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    setMergedHistory(merged);
    setLoading(false);
  }, [mealHistory, intakeHistory]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      // Load planned meal history
      const mealHistoryData = await AsyncStorage.getItem('mealHistory');
      if (mealHistoryData) {
        const parsedMealHistory = JSON.parse(mealHistoryData);
        // Mark these as planned meals
        const formattedMealHistory = parsedMealHistory.map(item => ({
          ...item,
          historyType: 'planned'
        }));
        setMealHistory(formattedMealHistory);
      }
      
      // Load consumed meal history
      const intakeHistoryData = await AsyncStorage.getItem('mealIntakeHistory');
      if (intakeHistoryData) {
        const parsedIntakeHistory = JSON.parse(intakeHistoryData);
        // Mark these as consumed meals
        const formattedIntakeHistory = parsedIntakeHistory.map(item => ({
          ...item,
          historyType: 'consumed'
        }));
        setIntakeHistory(formattedIntakeHistory);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const renderHistoryItem = (item, index) => {
    // Determine if this is a consumed or planned meal
    const isConsumed = item.historyType === 'consumed';
    const mealDate = new Date(isConsumed ? item.consumedAt : item.date);
    
    return (
      <Card key={index} style={styles.historyCard}>
        <Card.Title
          title={item.meal || item.name}
          subtitle={`${mealDate.toLocaleDateString()} ${isConsumed ? mealDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`}
          left={(props) => (
            <IconButton
              icon={isConsumed ? 'food-fork-drink' : 'calendar-today'}
              {...props}
              iconColor={isConsumed ? theme.colors.primary : '#666'}
            />
          )}
          right={(props) => (
            <Chip 
              mode="outlined" 
              style={{
                backgroundColor: isConsumed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                borderColor: isConsumed ? '#4CAF50' : '#2196F3'
              }}
            >
              {isConsumed ? 'Consumed' : 'Planned'}
            </Chip>
          )}
        />
        <Card.Content>
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Calories: {item.calories}</Text>
            {item.protein && <Text style={styles.detailText}>Protein: {item.protein}g</Text>}
            {item.carbs && <Text style={styles.detailText}>Carbs: {item.carbs}g</Text>}
            {item.fat && <Text style={styles.detailText}>Fat: {item.fat}g</Text>}
            {item.description && <Text style={styles.description}>{item.description}</Text>}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const filteredHistory = mergedHistory.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.historyType === selectedFilter;
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading your history...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <View style={styles.filterContainer}>
          <IconButton
            icon="filter"
            size={24}
            onPress={() => {
              const filters = ['all', 'planned', 'consumed'];
              const currentIndex = filters.indexOf(selectedFilter);
              const nextFilter = filters[(currentIndex + 1) % filters.length];
              setSelectedFilter(nextFilter);
            }}
          />
          <Text style={styles.filterText}>
            {selectedFilter === 'all' ? 'All' : 
             selectedFilter === 'planned' ? 'Planned' : 'Consumed'}
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
              Your meal history will appear here
            </Text>
          </View>
        )}
        
        {/* Bottom padding for better scrolling experience */}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 16,
  },
  historyCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    marginVertical: 2,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
}); 