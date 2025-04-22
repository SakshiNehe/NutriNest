import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, useTheme } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NavigationBar = () => {
  const router = useRouter();
  const theme = useTheme();

  const navigationItems = [
    { name: 'Home', route: '/' },
    { name: 'Meal Plan', route: '/meal-plan' },
    { name: 'Recipes', route: '/recipes' },
    { name: 'Profile', route: '/profile' },
  ];

  return (
    <BlurView intensity={80} style={styles.container}>
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons 
          name="food-apple" 
          size={28} 
          color={theme.colors.primary} 
          style={styles.logoIcon}
        />
        <Text variant="titleMedium" style={[styles.logoText, { color: theme.colors.primary }]}>
          NutriNest
        </Text>
      </View>
      <View style={styles.navigationContainer}>
        {navigationItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => router.push(item.route)}
          >
            <Text
              variant="labelLarge"
              style={[
                styles.navText,
                { color: theme.colors.onSurface },
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 8,
  },
  logoText: {
    fontWeight: 'bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navText: {
    fontWeight: '500',
  },
});

export default NavigationBar; 