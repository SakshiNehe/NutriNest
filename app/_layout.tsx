import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { 
  Provider as PaperProvider, 
  MD3LightTheme, 
  MD3DarkTheme,
  configureFonts,
  MD3TypescaleKey
} from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { auth, isFirebaseInitialized, reinitializeFirebase } from '../config/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import NavigationBar from '../components/NavigationBar';
import { initializeNotifications } from '../services/notificationService';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Define font configuration according to MD3 specifications
const fontConfig: Record<MD3TypescaleKey, {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: number;
  lineHeight: number;
}> = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

// Custom theme for React Native Paper
const customTheme = {
  light: {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#E53935',
      secondary: '#FF8A65',
      error: '#B00020',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      onSurface: '#1A1A1A',
    },
    fonts: configureFonts({ config: { default: fontConfig } }),
  },
  dark: {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#E53935',
      secondary: '#FF8A65',
      error: '#CF6679',
      background: '#121212',
      surface: '#1E1E1E',
      onSurface: '#FFFFFF',
    },
    fonts: configureFonts({ config: { default: fontConfig } }),
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const segments = useSegments();
  const router = useRouter();
  const isMounted = useRef(true);
  
  // Initialize Firebase and notifications
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (!isFirebaseInitialized()) {
          await reinitializeFirebase();
        }
        await initializeNotifications();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle routing based on authentication state
  useEffect(() => {
    // Mark component as mounted on first effect run
    isMounted.current = true;
    
    // Don't attempt navigation until fully initialized and mounted
    if (initializing || !loaded) {
      console.log("Still initializing or loading fonts, delaying navigation");
      return;
    }

    // Use a timeout to ensure navigation happens after rendering
    const timer = setTimeout(() => {
      if (!isMounted.current) return;

      const inAuthGroup = segments[0] === '(auth)';
      const inOnboarding = segments[0] === 'onboarding';
      
      console.log(`Navigation check - User: ${!!user}, inAuthGroup: ${inAuthGroup}, inOnboarding: ${inOnboarding}`);

      if (!user && !inAuthGroup && !inOnboarding) {
        // If user is not signed in and not in auth group, redirect to onboarding
        console.log("Redirecting to onboarding");
        router.replace('/onboarding');
      } else if (user && inAuthGroup) {
        // If user is signed in and in auth group, redirect to main app
        console.log("User signed in, redirecting to main app");
        router.replace('/(tabs)');
      }
    }, 250); // Increased timeout for more reliability

    return () => {
      clearTimeout(timer);
    };
  }, [user, initializing, segments, loaded]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Cleanup function to set mounted state to false when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  if (!loaded || initializing) {
    return null;
  }

  return (
    <PaperProvider theme={colorScheme === 'dark' ? customTheme.dark : customTheme.light}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={styles.container}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <NavigationBar />
          <View style={styles.content}>
            <Slot />
          </View>
        </View>
      </ThemeProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
