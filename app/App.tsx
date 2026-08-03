import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';

function MainNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5451FF" />
        <Text style={styles.loadingText}>SYNCHRONIZING PSP LUMORA MOBILE...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!user.isOnboarded) {
    return <OnboardingScreen />;
  }

  return <DashboardScreen />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);

      const style = document.createElement('style');
      style.textContent = `* { font-family: 'Poppins', system-ui, -apple-system, sans-serif !important; }`;
      document.head.appendChild(style);
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5451FF" />
        <Text style={styles.loadingText}>LOADING POPPINS FONTS...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#B8C6B6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#121316',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_600SemiBold',
    letterSpacing: 1,
  },
});
