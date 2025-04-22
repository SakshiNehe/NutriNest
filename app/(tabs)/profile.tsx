import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Switch, Button, IconButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '../../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profileData = await AsyncStorage.getItem('userProfile');
      if (profileData) {
        setUserProfile(JSON.parse(profileData));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile-setup');
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar.Icon 
            size={80} 
            icon="account"
            style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{auth.currentUser?.displayName || 'User'}</Text>
            <Text style={styles.email}>{auth.currentUser?.email}</Text>
          </View>
          <IconButton
            icon="pencil"
            size={24}
            onPress={handleEditProfile}
            style={styles.editButton}
          />
        </View>

        {/* Stats Card */}
        {userProfile && (
          <Card style={styles.card}>
            <Card.Title title="Your Stats" />
            <Card.Content style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{userProfile.height || '--'}</Text>
                <Text style={styles.statLabel}>Height (cm)</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{userProfile.weight || '--'}</Text>
                <Text style={styles.statLabel}>Weight (kg)</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{userProfile.age || '--'}</Text>
                <Text style={styles.statLabel}>Age</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Settings Card */}
        <Card style={styles.card}>
          <Card.Title title="Settings" />
          <Card.Content>
            <View style={styles.settingItem}>
              <Text>Push Notifications</Text>
              <Switch value={notifications} onValueChange={toggleNotifications} />
            </View>
            <View style={styles.settingItem}>
              <Text>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={toggleDarkMode} />
            </View>
          </Card.Content>
        </Card>

        {/* Sign Out Button */}
        <Button 
          mode="outlined" 
          onPress={handleSignOut}
          style={styles.signOutButton}
          icon="logout"
        >
          Sign Out
        </Button>
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
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  avatar: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    marginLeft: 8,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  signOutButton: {
    marginTop: 24,
    marginBottom: 32,
  },
}); 