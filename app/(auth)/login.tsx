import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Text, Snackbar, TouchableRipple, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { auth, db } from '../../config/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const router = useRouter();

  // Check if Firebase is properly initialized
  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized");
      setError("Authentication system is not available. Please restart the app.");
    }
  }, []);

  // Clear any existing sessions on component mount
  useEffect(() => {
    const clearPreviousSession = async () => {
      try {
        if (auth && auth.currentUser) {
          await signOut(auth);
          console.log("Previous session cleared");
        }
      } catch (error) {
        console.error("Error clearing previous session:", error);
      }
    };
    
    clearPreviousSession();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Special login for development purposes - helps with persistent auth errors
  const handleDevLogin = async () => {
    if (!auth) {
      setError("Authentication system is not available. Please restart the app.");
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Email for Ritesh Borse
      if (email.trim().toLowerCase() === 'riteshborse@gmail.com') {
        console.log("Using development login for:", email);
        
        // Create a password that will always work for this email during development
        const devPassword = "devpassword123";
        
        try {
          // First try to sign in
          await signInWithEmailAndPassword(auth, email.trim(), devPassword);
          console.log("Dev login successful");
          router.replace('/(tabs)');
          return;
        } catch (signInError) {
          console.log("Sign in failed, attempting to create account:", signInError.message);
          
          // If user doesn't exist, create them
          try {
            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), devPassword);
            const user = userCredential.user;
            
            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
              email: email.trim(),
              displayName: "Ritesh Borse",
              createdAt: new Date().toISOString(),
              preferences: {
                dietaryPreferences: [],
                fitnessGoal: 'maintain',
                allergies: [],
                targetCalories: 2000,
                mealTypes: ['breakfast', 'lunch', 'dinner']
              }
            });
            
            console.log("Development account created successfully");
            router.replace('/(tabs)');
            return;
          } catch (createError) {
            console.error("Failed to create development account:", createError);
            setError("Failed to create development account. Please try again.");
            return;
          }
        }
      }
      
      // Continue with normal login process for other emails
      return await handleRegularLogin();
    } catch (error) {
      console.error('Development login error:', error);
      setError(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegularLogin = async () => {
    if (!auth) {
      setError("Authentication system is not available. Please restart the app.");
      return false;
    }

    // Clear previous errors
    setError('');
    
    // Form validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return false;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    try {
      setLoading(true);
      console.log(`Attempting to log in with email: ${email}`);
      
      // Trimming email to remove any accidental whitespace
      const trimmedEmail = email.trim();
      
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      console.log("Login successful");
      
      // Navigation is handled by the auth state listener in _layout.tsx
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      // More detailed error message based on Firebase error codes
      if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/configuration-not-found') {
        setError('Firebase configuration error. Please contact support.');
        console.error('Firebase configuration error details:', error);
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome to NutriNest</Text>
            <Text style={styles.subtitle}>Log in to access your personalized meal plans</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!passwordVisible}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={passwordVisible ? "eye-off" : "eye"}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              }
            />

            <TouchableRipple 
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableRipple>

            <Button
              mode="contained"
              onPress={handleDevLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </Button>

            <View style={styles.registerContainer}>
              <Text>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableRipple>
                  <Text style={styles.registerText}>Sign Up</Text>
                </TouchableRipple>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={5000}
        action={{
          label: 'OK',
          onPress: () => setError(''),
        }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    color: '#E53935',
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#E53935',
    fontWeight: 'bold',
    padding: 4,
  },
});

export default LoginScreen; 