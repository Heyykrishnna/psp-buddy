import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface AnalyticsScreenProps {
  onBackToDashboard: () => void;
}

export function AnalyticsScreen({ onBackToDashboard }: AnalyticsScreenProps) {
  const { apiClient: client } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      if (client) {
        const [ov, top] = await Promise.all([
          client.getStudentOverview(),
          client.getTopicMastery(),
        ]);
        setOverview(ov);
        setTopics(top || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToDashboard} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics & Performance</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <ScrollView style={styles.flex1} contentContainerStyle={styles.contentPadding}>
          {/* Overview Cards */}
          {overview && (
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.statVal}>{overview.averageScorePercentage || 0}%</Text>
                <Text style={styles.statLbl}>Average Score</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.statVal}>{overview.masteredTopicsCount || 0}</Text>
                <Text style={styles.statLbl}>Topics Mastered</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.statVal}>{overview.weakTopicsCount || 0}</Text>
                <Text style={styles.statLbl}>Needs Work</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
                <Text style={styles.statVal}>{overview.totalAssessmentsAttempted || 0}</Text>
                <Text style={styles.statLbl}>Assessments</Text>
              </View>
            </View>
          )}

          {/* Topic Mastery List */}
          <Text style={styles.sectionTitle}>Topic Mastery Breakdown</Text>
          <View style={styles.card}>
            {topics.length === 0 ? (
              <Text style={styles.mutedText}>No topic data recorded yet. Complete quizzes or practice problems!</Text>
            ) : (
              topics.map((t, idx) => (
                <View key={idx} style={styles.topicRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.topicName}>{t.topic}</Text>
                    <Text style={styles.topicAttempts}>{t.totalAttempts} attempts · {t.accuracy}% accuracy</Text>
                  </View>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillText}>{t.masteryScore} pts</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  flex1: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  backBtn: { paddingRight: 12 },
  backBtnText: { color: '#0066FF', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },

  contentPadding: { padding: 16, gap: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: '48%', padding: 14, borderRadius: 12, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#111' },
  statLbl: { fontSize: 11, color: '#555', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  mutedText: { fontSize: 12, color: '#999', fontStyle: 'italic' },

  topicRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  topicName: { fontSize: 13, fontWeight: '700', color: '#111' },
  topicAttempts: { fontSize: 11, color: '#666', marginTop: 2 },
  scorePill: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scorePillText: { fontSize: 11, fontWeight: '700', color: '#0066FF' },
});
