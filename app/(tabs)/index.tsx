import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Text, Card, Button, Avatar, IconButton, Divider, Switch, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, isFirebaseInitialized, reinitializeFirebase } from '../../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { getUserPreferences, getUserProfile } from '../../services/userProfileService';
import { requestNotificationPermissions, scheduleMealReminder, scheduleGroceryReminder } from '../../services/notificationService';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { DocumentData } from 'firebase/firestore';

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

export default function ProfileScreen() {
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
  const router = useRouter();

  // Mock data for the nutrition chart
  const nutritionData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [2100, 1950, 2200, 2000, 2300, 1800, 2050],
        color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  // Fetch user preferences
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
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

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
        <Text style={{ marginTop: 20 }}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidView}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <Avatar.Icon 
              size={80} 
              icon="account" 
              style={styles.profileAvatar} 
              color="#fff" 
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile?.displayName || auth.currentUser?.displayName || 'User'}</Text>
              <Text style={styles.profileEmail}>{auth.currentUser?.email}</Text>
              <Button 
                mode="outlined" 
                onPress={() => router.push('/profile-setup')}
                style={styles.editButton}
              >
                Edit Profile
              </Button>
            </View>
          </View>

          {/* Personal Stats Card */}
          {userProfile && (userProfile.height || userProfile.weight || userProfile.age) && (
            <Card style={styles.card}>
              <Card.Title 
                title="Personal Stats" 
                left={(props) => <Avatar.Icon {...props} icon="human" style={styles.cardIcon} color="#fff" />}
              />
              <Card.Content>
                <View style={styles.statRowContainer}>
                  {userProfile.height ? (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{userProfile.height}</Text>
                      <Text style={styles.statLabel}>Height (cm)</Text>
                    </View>
                  ) : null}
                  
                  {userProfile.weight ? (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{userProfile.weight}</Text>
                      <Text style={styles.statLabel}>Weight (kg)</Text>
                    </View>
                  ) : null}
                  
                  {userProfile.age ? (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{userProfile.age}</Text>
                      <Text style={styles.statLabel}>Age</Text>
                    </View>
                  ) : null}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Nutrition Goals Card */}
          <Card style={styles.card}>
            <Card.Title 
              title="Nutrition Goals" 
              left={(props) => <Avatar.Icon {...props} icon="food-apple" style={styles.cardIcon} color="#fff" />}
            />
            <Card.Content>
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>Daily Calorie Target:</Text>
                <Text style={styles.goalValue}>{userPreferences?.targetCalories || 2000} cal</Text>
              </View>
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>Weight Goal:</Text>
                <Text style={styles.goalValue}>
                  {userPreferences?.fitnessGoal === 'lose' 
                    ? 'Lose Weight' 
                    : userPreferences?.fitnessGoal === 'gain'
                      ? 'Gain Muscle'
                      : 'Maintain Weight'
                  }
                </Text>
              </View>
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>Dietary Preferences:</Text>
                <View style={styles.chipContainer}>
                  {userPreferences?.dietaryPreferences?.map((pref) => (
                    <Text key={pref} style={styles.chip}>{pref}</Text>
                  ))}
                  {(!userPreferences?.dietaryPreferences || userPreferences.dietaryPreferences.length === 0) && (
                    <Text style={styles.chip}>None</Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Weekly Nutrition Chart */}
          <Card style={styles.card}>
            <Card.Title 
              title="Weekly Calorie Intake" 
              left={(props) => <Avatar.Icon {...props} icon="chart-line" style={styles.cardIcon} color="#fff" />}
            />
            <Card.Content>
              <LineChart
                data={nutritionData}
                width={screenWidth - 50}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#E53935'
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              icon="bell-outline" 
              onPress={() => setShowReminderDialog(true)}
              style={styles.actionButton}
            >
              Set Reminders
            </Button>
            
            <Button 
              mode="outlined" 
              icon="logout" 
              onPress={handleSignOut}
              style={styles.signOutButton}
            >
              Sign Out
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Reminder Dialog */}
      <Portal>
        <Dialog visible={showReminderDialog} onDismiss={() => setShowReminderDialog(false)}>
          <Dialog.Title>Set Meal Reminders</Dialog.Title>
          <Dialog.Content>
            <View style={styles.reminderSwitch}>
              <Text>Enable Meal Reminders</Text>
              <Switch 
                value={remindersEnabled} 
                onValueChange={setRemindersEnabled} 
                color="#E53935"
              />
            </View>
            
            {/* Add time picker UI for meal reminders here */}
            
            <Divider style={styles.divider} />
            
            <View style={styles.reminderSwitch}>
              <Text>Weekly Grocery Reminder</Text>
              <Switch 
                value={groceryReminderEnabled} 
                onValueChange={setGroceryReminderEnabled} 
                color="#E53935"
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowReminderDialog(false)}>Cancel</Button>
            <Button onPress={handleSetupReminders}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  container: {
    flex: 1, 
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  profileAvatar: {
    backgroundColor: '#E53935',
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  editButton: {
    borderColor: '#E53935',
    alignSelf: 'flex-start',
  },
  card: {
    marginVertical: 10,
    elevation: 2,
  },
  cardIcon: {
    backgroundColor: '#E53935',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 16,
    color: '#333',
  },
  goalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53935',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  divider: {
    marginVertical: 16,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#E53935',
    marginVertical: 8,
  },
  signOutButton: {
    borderColor: '#E53935',
    marginVertical: 8,
  },
  reminderSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  statRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
