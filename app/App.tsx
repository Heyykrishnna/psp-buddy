import React, { useEffect, useState } from 'react';
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
import { AssessmentScreen } from './src/screens/AssessmentScreen';

function MainNavigator() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'DASHBOARD' | 'ASSESSMENTS'>('DASHBOARD');
  const [selectedAsmId, setSelectedAsmId] = useState<string | null>(null);

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

  if (currentScreen === 'ASSESSMENTS') {
    return (
      <AssessmentScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
        selectedAssessmentId={selectedAsmId}
      />
    );
  }

  return (
    <DashboardScreen
      onOpenAssessments={(asmId) => {
        setSelectedAsmId(asmId || null);
        setCurrentScreen('ASSESSMENTS');
      }}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_600SemiBold: require('./assets/SpaceGrotesk-SemiBold.ttf'),
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
      link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Poppins:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
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
