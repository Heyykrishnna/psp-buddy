import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PSPBuddyApiClient } from './src/lib/api-sdk';

const apiClient = new PSPBuddyApiClient({
  baseURL: 'http://localhost:4000',
});

export default function App() {
  const [xp, setXp] = useState(1250);
  const [streak] = useState(5);
  const [synced] = useState(true);

  const simulateCompleteAssessmentOnMobile = () => {
    const earned = 100;
    setXp((prev) => prev + earned);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>PSP Buddy Mobile</Text>
          <View style={styles.badge}>
            <View style={[styles.dot, { backgroundColor: synced ? '#22c55e' : '#ef4444' }]} />
            <Text style={styles.badgeText}>{synced ? 'Synced with Web' : 'Offline'}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL XP</Text>
            <Text style={styles.statValue}>{xp} XP</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>STREAK</Text>
            <Text style={styles.statValue}>🔥 {streak} Days</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.button} onPress={simulateCompleteAssessmentOnMobile}>
          <Text style={styles.buttonText}>🚀 Complete Quiz on Mobile (+100 XP)</Text>
        </TouchableOpacity>

        {/* Feature List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synchronized Capabilities</Text>

          <View style={styles.featureItem}>
            <Text style={styles.featureText}>📱 Real-time Web & Mobile State Sync</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>📚 Assessment & Workbook Evaluation</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>💻 Coding Environment & Auto-grader</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>🏆 Live Global Leaderboard</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#38bdf8',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#0284c7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  section: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
});
