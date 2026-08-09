import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Loader } from './src/components/Loader';
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
import { GameHomeScreen } from './src/screens/GameHomeScreen';
import { AssessmentScreen } from './src/screens/AssessmentScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { PlaygroundScreen } from './src/screens/PlaygroundScreen';
import { CompetitiveScreen } from './src/screens/CompetitiveScreen';
import { AiTutorScreen } from './src/screens/AiTutorScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';

type ScreenType =
  | 'DASHBOARD'
  | 'ASSESSMENTS'
  | 'LEADERBOARD'
  | 'PLAYGROUND'
  | 'COMPETITIVE'
  | 'AITUTOR'
  | 'ANALYTICS';

function MainNavigator() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('DASHBOARD');
  const [selectedAsmId, setSelectedAsmId] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader size="large" color="#5451FF" />
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

  if (currentScreen === 'LEADERBOARD') {
    return (
      <LeaderboardScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  }

  if (currentScreen === 'PLAYGROUND') {
    return (
      <PlaygroundScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  }

  if (currentScreen === 'COMPETITIVE') {
    return (
      <CompetitiveScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  }

  if (currentScreen === 'AITUTOR') {
    return (
      <AiTutorScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  }

  if (currentScreen === 'ANALYTICS') {
    return (
      <AnalyticsScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  }

  return (
    <GameHomeScreen
      onOpenAssessments={(asmId) => {
        setSelectedAsmId(asmId || null);
        setCurrentScreen('ASSESSMENTS');
      }}
      onOpenLeaderboard={() => {
        setCurrentScreen('LEADERBOARD');
      }}
      onOpenPlayground={() => {
        setCurrentScreen('PLAYGROUND');
      }}
      onOpenCompetitive={() => {
        setCurrentScreen('COMPETITIVE');
      }}
      onOpenAiTutor={() => {
        setCurrentScreen('AITUTOR');
      }}
      onOpenAnalytics={() => {
        setCurrentScreen('ANALYTICS');
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
      link.href =
        'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Poppins:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Loader size="large" color="#5451FF" />
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
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#a1a1aa',
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.5,
  },
});
