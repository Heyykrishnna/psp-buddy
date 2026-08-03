import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

interface AnalyticsScreenProps {
  onBackToDashboard: () => void;
}

function TopicProgressBar({ score, color }: { score: number; color: string }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: score,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score]);

  const trackWidth = width - 40 - 28; // Padding & margins
  const barPx = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: [0, trackWidth],
    extrapolate: 'clamp',
  });

  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, { width: barPx, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: { height: 6, borderRadius: 3 },
});

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
        <Text style={styles.headerTitle}>ANALYTICS & PERFORMANCE</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5451FF" />
          <Text style={styles.loadingText}>LOADING ANALYTICS...</Text>
        </View>
      ) : (
        <ScrollView style={styles.flex1} contentContainerStyle={styles.contentPadding}>
          {/* HERO ASSESSMENT PORTAL CARD */}
          <View style={styles.heroCard}>
            <Text style={styles.heroSubTag}>MOBILE ASSESSMENT PORTAL</Text>
            <Text style={styles.heroTitle}>
              Master your topics with active quizzes & exams.
            </Text>
            <Text style={styles.heroDescription}>
              Real-time score calculation, negative marking & topic insights.
            </Text>
          </View>

          {/* Section Header */}
          <Text style={styles.sectionHeaderTitle}>STUDENT PERFORMANCE OVERVIEW</Text>

          {/* Overview Cards Grid (4 Dark Cards) */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderColor: '#3b82f6' }]}>
              <Text style={[styles.statVal, { color: '#60a5fa' }]}>
                {overview?.averageScorePercentage || 0}%
              </Text>
              <Text style={styles.statLbl}>AVERAGE SCORE</Text>
            </View>

            <View style={[styles.statCard, { borderColor: '#10b981' }]}>
              <Text style={[styles.statVal, { color: '#4ade80' }]}>
                {overview?.masteredTopicsCount || 0}
              </Text>
              <Text style={styles.statLbl}>TOPICS MASTERED</Text>
            </View>

            <View style={[styles.statCard, { borderColor: '#ef4444' }]}>
              <Text style={[styles.statVal, { color: '#f87171' }]}>
                {overview?.weakTopicsCount || 0}
              </Text>
              <Text style={styles.statLbl}>NEEDS FOCUS</Text>
            </View>

            <View style={[styles.statCard, { borderColor: '#f59e0b' }]}>
              <Text style={[styles.statVal, { color: '#fbbf24' }]}>
                {overview?.totalAssessmentsAttempted || 0}
              </Text>
              <Text style={styles.statLbl}>ASSESSMENTS</Text>
            </View>
          </View>

          {/* Topic Mastery Detailed Breakdown */}
          <Text style={styles.sectionHeaderTitle}>TOPIC MASTERY BREAKDOWN</Text>

          <View style={styles.topicsCardContainer}>
            {topics.length === 0 ? (
              <Text style={styles.emptyText}>
                No topic data recorded yet. Complete quizzes or practice problems to track your performance!
              </Text>
            ) : (
              topics.map((t, idx) => {
                const score = t.masteryScore || 0;
                const barColor = score >= 80 ? '#4ade80' : score >= 50 ? '#5451FF' : '#FF5745';
                const statusLabel =
                  score >= 80 ? 'Mastered' : score >= 50 ? 'Proficient' : 'Needs Work';

                return (
                  <View key={idx} style={styles.topicCard}>
                    <View style={styles.topicHeaderRow}>
                      <View style={styles.flex1}>
                        <Text style={styles.topicTitle}>{t.topic}</Text>
                        <Text style={styles.topicMeta}>
                          {t.totalAttempts || 0} attempts · {Math.round(t.accuracy || 0)}% accuracy
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              score >= 80
                                ? 'rgba(74, 222, 128, 0.15)'
                                : score >= 50
                                ? 'rgba(84, 81, 255, 0.15)'
                                : 'rgba(255, 87, 69, 0.15)',
                            borderColor: barColor,
                          },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color: barColor }]}>
                          {statusLabel} ({Math.round(score)}%)
                        </Text>
                      </View>
                    </View>

                    <TopicProgressBar score={score} color={barColor} />
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  flex1: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? "'Space Grotesk', sans-serif" : 'SpaceGrotesk_600SemiBold',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#121316',
  },
  backBtn: { paddingRight: 12 },
  backBtnText: {
    color: '#5451FF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_600SemiBold',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? "'Space Grotesk', sans-serif" : 'SpaceGrotesk_600SemiBold',
  },
  contentPadding: {
    padding: 16,
    gap: 16,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 1.2,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? "'Space Grotesk', sans-serif" : 'SpaceGrotesk_600SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: (width - 32 - 10) / 2, // 2 column grid
    backgroundColor: '#121316',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_900Black',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? "'Space Grotesk', sans-serif" : 'SpaceGrotesk_600SemiBold',
  },
  topicsCardContainer: {
    gap: 10,
  },
  emptyText: {
    color: '#71717a',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  topicCard: {
    backgroundColor: '#121316',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_700Bold',
  },
  topicMeta: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_500Medium',
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_800ExtraBold',
  },

  // Hero Card Styles
  heroCard: {
    backgroundColor: '#5451FF',
    borderRadius: 24,
    padding: 24,
    marginVertical: 4,
    gap: 8,
  },
  heroSubTag: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? "'Space Grotesk', sans-serif" : 'SpaceGrotesk_600SemiBold',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 28,
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_800ExtraBold',
  },
  heroDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'Poppins, sans-serif' : 'Poppins_500Medium',
  },
});
