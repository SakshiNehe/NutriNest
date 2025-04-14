import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, Dimensions, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

const OnboardingScreen = () => {
  const router = useRouter();
  
  const handleGetStarted = () => {
    // Navigate to the authentication screen
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.skipButton} onPress={handleGetStarted}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.titleRed}>Smart Meal</Text>
          <Text style={styles.titleRed}>Planning Made</Text>
          <View style={styles.titleBlackContainer}>
            <Text style={styles.titleBlack}>Simple</Text>
          </View>
        </View>
        
        <Text style={styles.subtitle}>
          Plan your meals tailored to your diet preferences, fitness goals, and budget
        </Text>
        
        {/* Feature Points */}
        <View style={styles.featureContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🍽️</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Personalized Meal Plans</Text>
              <Text style={styles.featureDescription}>Based on your preferences and nutrition goals</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>📊</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Track Nutrition</Text>
              <Text style={styles.featureDescription}>Monitor calories, protein, carbs and fats</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>💰</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Budget-Friendly</Text>
              <Text style={styles.featureDescription}>Cost-effective meal suggestions</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <View style={styles.arrowCircle}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F9',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: isSmallDevice ? 5 : 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    marginTop: isSmallDevice ? 10 : 20,
  },
  titleRed: {
    fontSize: isSmallDevice ? 32 : 38,
    fontWeight: 'bold',
    color: '#E53935',
    lineHeight: isSmallDevice ? 38 : 48,
    letterSpacing: 0.3,
  },
  titleBlackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  titleBlack: {
    fontSize: isSmallDevice ? 32 : 38,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    lineHeight: 22,
    letterSpacing: 0.2,
    marginBottom: 40,
  },
  featureContainer: {
    marginTop: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  button: {
    backgroundColor: '#E53935',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingLeft: 30,
    paddingRight: 15,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.3,
    flex: 1,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  arrowText: {
    fontSize: 20,
    color: '#E53935',
    fontWeight: 'bold',
  }
});

export default OnboardingScreen; 