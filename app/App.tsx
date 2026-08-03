import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
    fontWeight: '900',
    letterSpacing: 1,
  },
});
