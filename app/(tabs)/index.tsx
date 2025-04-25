import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions 
} from 'react-native';
import { Text, Card, Button, Avatar, IconButton, Divider, Switch, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, isFirebaseInitialized, reinitializeFirebase } from '../../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { getUserPreferences, getUserProfile } from '../../services/userProfileService';
import { requestNotificationPermissions, scheduleMealReminder, scheduleGroceryReminder } from '../../services/notificationService';
import { LineChart } from 'react-native-chart-kit';
import { getWeeklyNutritionData } from '../../services/aiMealService';

const screenWidth = Dimensions.get('window').width;

// User profile interface
interface UserProfile {
  displayName?: string;
  email?: string;
  age?: number;
  height?: number;
  weight?: number;
  preferences?: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}

// User preferences interface
interface UserPreferences {
  dietaryPreferences?: string[];
  allergies?: string[];
  fitnessGoal?: 'lose' | 'maintain' | 'gain';
  targetCalories?: number;
  mealTypes?: string[];
}

export default function HomeScreen() {
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReminderDialog, setShowReminderDialog] = useState<boolean>(false);
  const [breakfastReminderTime, setBreakfastReminderTime] = useState<string>('08:00');
  const [lunchReminderTime, setLunchReminderTime] = useState<string>('12:30');
  const [dinnerReminderTime, setDinnerReminderTime] = useState<string>('19:00');
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(false);
  const [groceryReminderEnabled, setGroceryReminderEnabled] = useState<boolean>(false);
  const [weeklyNutritionData, setWeeklyNutritionData] = useState({
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
        strokeWidth: 2
      }
    ]
  });
  const [todayCalories, setTodayCalories] = useState(0);
  const router = useRouter();

  // Fetch user preferences and nutrition data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Ensure Firebase is initialized
        if (!isFirebaseInitialized()) {
          console.log("Firebase not initialized, attempting to reinitialize...");
          reinitializeFirebase();
        }
        
        const user = auth?.currentUser;
        if (!user) {
          setError('User not authenticated');
          return;
        }
        
        // Get complete user profile
        const profile = await getUserProfile(user.uid);
        if (profile) {
          // Convert Firestore DocumentData to our UserProfile type
          const typedProfile: UserProfile = {
            displayName: profile.displayName,
            email: profile.email,
            age: profile.age,
            height: profile.height,
            weight: profile.weight,
            preferences: profile.preferences || {},
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt
          };
          
          setUserProfile(typedProfile);
          setUserPreferences(typedProfile.preferences || {});
          console.log("User profile loaded successfully");
        } else {
          console.log("No user profile found, you may need to set up your profile");
        }
        
        // Load weekly nutrition data
        await loadWeeklyNutritionData();
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const loadWeeklyNutritionData = async () => {
    try {
      // Get weekly nutrition data from AsyncStorage
      const weeklyData = await getWeeklyNutritionData();
      
      if (weeklyData) {
        // Create chart data format
        const chartData = {
          labels: weeklyData.labels,
          datasets: [
            {
              data: weeklyData.data,
              color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
              strokeWidth: 2
            }
          ]
        };
        
        setWeeklyNutritionData(chartData);
        
        // Get today's calories (based on day of week)
        const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
        setTodayCalories(weeklyData.data[today] || 0);
      }
    } catch (error) {
      console.error('Error loading weekly nutrition data:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Navigation to auth flow will be handled by the auth state listener in _layout.tsx
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleSetupReminders = async () => {
    try {
      // Request notification permissions
      const permissionGranted = await requestNotificationPermissions();
      
      if (!permissionGranted) {
        alert('Please enable notifications in your device settings to receive meal reminders.');
        return;
      }
      
      // Schedule meal reminders
      if (remindersEnabled) {
        await scheduleMealReminder('Breakfast', breakfastReminderTime);
        await scheduleMealReminder('Lunch', lunchReminderTime);
        await scheduleMealReminder('Dinner', dinnerReminderTime);
      }
      
      // Schedule grocery reminder
      if (groceryReminderEnabled) {
        await scheduleGroceryReminder('friday', '18:00');
      }
      
      setShowReminderDialog(false);
      alert('Reminders set successfully!');
    } catch (err) {
      console.error('Error setting up reminders:', err);
      alert('Failed to set up reminders. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={{ marginTop: 20 }}>Loading your dashboard...</Text>
      </View>
    );
  }

  // Calculate remaining calories for today
  const targetCalories = userPreferences?.targetCalories || 2000;
  const remainingCalories = targetCalories - todayCalories;
  const caloriePercentage = Math.min(100, Math.round((todayCalories / targetCalories) * 100));

  return (
    <SafeAreaView style={styles.safeContainer} edges={['right', 'left', 'bottom']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userProfile?.displayName || auth.currentUser?.displayName || 'User'}</Text>
          </View>
          <Avatar.Text 
            size={50} 
            label={(userProfile?.displayName?.[0] || auth.currentUser?.displayName?.[0] || 'U').toUpperCase()} 
            style={styles.avatar} 
          />
        </View>

        {/* Today's Summary Card */}
        <Card style={styles.card}>
          <Card.Title 
            title="Today's Summary" 
            subtitle="Your nutrition and activity" 
            left={(props) => <Avatar.Icon {...props} icon="calendar-today" style={styles.cardIcon} color="#fff" />}
          />
          <Card.Content>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {targetCalories}
                </Text>
                <Text style={styles.statLabel}>Calorie Goal</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayCalories}</Text>
                <Text style={styles.statLabel}>Consumed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{remainingCalories}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${caloriePercentage}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>{caloriePercentage}% of daily goal</Text>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button mode="text" onPress={() => router.push('/(tabs)/meal-planner')}>
              View Meal Plan
            </Button>
          </Card.Actions>
        </Card>

        {/* Weekly Stats Card */}
        <Card style={styles.card}>
          <Card.Title 
            title="Weekly Nutrition" 
            subtitle="Calorie intake over time" 
            left={(props) => <Avatar.Icon {...props} icon="chart-line" style={styles.cardIcon} color="#fff" />}
          />
          <Card.Content>
            <LineChart
              data={weeklyNutritionData}
              width={screenWidth - 60}
              height={180}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#E53935',
                },
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Quick Actions Card */}
        <Card style={styles.card}>
          <Card.Title 
            title="Quick Actions" 
            left={(props) => <Avatar.Icon {...props} icon="lightning-bolt" style={styles.cardIcon} color="#fff" />}
          />
          <Card.Content>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/meal-planner')}
              >
                <Avatar.Icon 
                  size={50} 
                  icon="food-fork-drink" 
                  style={styles.actionIcon} 
                  color="#fff" 
                />
                <Text style={styles.actionText}>Generate Meal Plan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/recipes')}
              >
                <Avatar.Icon 
                  size={50} 
                  icon="book-open-variant" 
                  style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]} 
                  color="#fff" 
                />
                <Text style={styles.actionText}>Browse Recipes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowReminderDialog(true)}
              >
                <Avatar.Icon 
                  size={50} 
                  icon="bell" 
                  style={[styles.actionIcon, { backgroundColor: '#FF9800' }]} 
                  color="#fff" 
                />
                <Text style={styles.actionText}>Set Reminders</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/profile-setup')}
              >
                <Avatar.Icon 
                  size={50} 
                  icon="cog" 
                  style={[styles.actionIcon, { backgroundColor: '#2196F3' }]} 
                  color="#fff" 
                />
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Reminder Dialog */}
        <Portal>
          <Dialog visible={showReminderDialog} onDismiss={() => setShowReminderDialog(false)}>
            <Dialog.Title>Meal Reminders</Dialog.Title>
            <Dialog.Content>
              <View style={styles.reminderSetting}>
                <Text>Enable Meal Reminders</Text>
                <Switch 
                  value={remindersEnabled} 
                  onValueChange={setRemindersEnabled} 
                  color="#E53935"
                />
              </View>
              
              <View style={styles.reminderSetting}>
                <Text>Grocery Shopping Reminder</Text>
                <Switch 
                  value={groceryReminderEnabled} 
                  onValueChange={setGroceryReminderEnabled} 
                  color="#E53935"
                />
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowReminderDialog(false)}>Cancel</Button>
              <Button onPress={() => handleSetupReminders()}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        
        {/* Sign Out Button */}
        <Button 
          mode="outlined" 
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
        
        {/* Bottom padding to ensure content is scrollable past the tab bar */}
        <View style={{ height: 70 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding to ensure content is accessible with the tab bar
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  avatar: {
    backgroundColor: '#E53935',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardIcon: {
    backgroundColor: '#E53935',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  progressSection: {
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E53935',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionIcon: {
    backgroundColor: '#E53935',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  reminderSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  signOutButton: {
    marginTop: 16,
    marginBottom: 40, // Add extra space at the bottom
  },
});
