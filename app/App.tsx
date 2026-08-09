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
import { AppBottomNav, AppNavKey } from './src/components/AppBottomNav';
import { MissionsScreen } from './src/screens/MissionsScreen';

type ScreenType =
  | 'DASHBOARD'
  | 'MISSIONS'
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

  const openScreen = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  const handleBottomNav = (next: AppNavKey) => {
    if (next === 'MAP') openScreen('DASHBOARD');
    if (next === 'MISSIONS') openScreen('MISSIONS');
    if (next === 'RANK') openScreen('LEADERBOARD');
    if (next === 'PROFILE') openScreen('ANALYTICS');
  };

  const activeNav: AppNavKey = currentScreen === 'MISSIONS'
    ? 'MISSIONS'
    : currentScreen === 'ASSESSMENTS'
      ? 'MISSIONS'
      : currentScreen === 'LEADERBOARD'
        ? 'RANK'
        : currentScreen === 'ANALYTICS'
          ? 'PROFILE'
          : 'MAP';

  let screen: React.ReactNode;
  if (currentScreen === 'MISSIONS') {
    screen = (
      <MissionsScreen
        onOpenAssessment={(asmId) => {
          setSelectedAsmId(asmId || null);
          openScreen('ASSESSMENTS');
        }}
      />
    );
  } else if (currentScreen === 'ASSESSMENTS') {
    screen = (
      <AssessmentScreen
        onBackToDashboard={() => setCurrentScreen('MISSIONS')}
        selectedAssessmentId={selectedAsmId}
      />
    );
  } else if (currentScreen === 'LEADERBOARD') {
    screen = (
      <LeaderboardScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  } else if (currentScreen === 'PLAYGROUND') {
    screen = (
      <PlaygroundScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  } else if (currentScreen === 'COMPETITIVE') {
    screen = (
      <CompetitiveScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  } else if (currentScreen === 'AITUTOR') {
    screen = (
      <AiTutorScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  } else if (currentScreen === 'ANALYTICS') {
    screen = (
      <AnalyticsScreen
        onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
      />
    );
  } else {
    screen = (
      <GameHomeScreen
        onOpenAssessments={(asmId) => {
          setSelectedAsmId(asmId || null);
          openScreen('ASSESSMENTS');
        }}
        onOpenLeaderboard={() => openScreen('LEADERBOARD')}
        onOpenPlayground={() => openScreen('PLAYGROUND')}
        onOpenCompetitive={() => openScreen('COMPETITIVE')}
        onOpenAiTutor={() => openScreen('AITUTOR')}
        onOpenAnalytics={() => openScreen('ANALYTICS')}
      />
    );
  }

  return (
    <View style={styles.appShell}>
      {screen}
      <AppBottomNav active={activeNav} onChange={handleBottomNav} />
    </View>
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
  appShell: {
    flex: 1,
    backgroundColor: '#F1F5FB',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F1F5FB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#7D879F',
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.5,
  },
});
