import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AssessmentDTO, StudentTopicMasteryDTO } from '../types';

const DEMO_TOPICS: StudentTopicMasteryDTO[] = [
  { topic: 'Arrays', masteryScore: 82, accuracy: 82, totalAttempts: 10, correctAnswers: 8, assessmentCount: 3, lastPracticedAt: '', status: 'Mastered', isWeak: false },
  { topic: 'Loops', masteryScore: 64, accuracy: 64, totalAttempts: 8, correctAnswers: 5, assessmentCount: 2, lastPracticedAt: '', status: 'Proficient', isWeak: false },
  { topic: 'Recursion', masteryScore: 31, accuracy: 31, totalAttempts: 6, correctAnswers: 2, assessmentCount: 2, lastPracticedAt: '', status: 'Needs Improvement', isWeak: true },
  { topic: 'Graphs', masteryScore: 20, accuracy: 20, totalAttempts: 3, correctAnswers: 0, assessmentCount: 1, lastPracticedAt: '', status: 'Needs Improvement', isWeak: true },
];

export function DashboardScreen() {
  const { user, logout, apiClient } = useAuth();
  const [xp, setXp] = useState(1250);
  const [streak] = useState(5);
  const [assessments, setAssessments] = useState<AssessmentDTO[]>([
    {
      id: 'demo-asm-1',
      title: 'Algorithm Complexity & Data Structures Quiz',
      description: 'Mid-term evaluation covering Big-O analysis, sorting algorithms, and boolean logic.',
      className: 'Class 10-A',
      topic: 'Computer Science',
      assessmentType: 'QUIZ' as any,
      totalMarks: 25,
      passingMarks: 15,
      durationMinutes: 30,
      hasNegativeMarking: true,
      negativeMarkValue: 0.25,
      isPublished: true,
    },
  ]);
  const [topics, setTopics] = useState<StudentTopicMasteryDTO[]>(DEMO_TOPICS);

  useEffect(() => {
    async function loadData() {
      try {
        const [list, topicData] = await Promise.allSettled([
          apiClient.getAssessments(),
          apiClient.getTopicMastery(),
        ]);
        if (list.status === 'fulfilled' && list.value?.length > 0) setAssessments(list.value);
        if (topicData.status === 'fulfilled' && topicData.value?.length > 0) setTopics(topicData.value);
      } catch {}
    }
    loadData();
  }, [apiClient]);

  const simulateQuiz = () => setXp((prev) => prev + 50);

  const getMasteryBarColor = (score: number) => {
    if (score >= 80) return '#16a34a';
    if (score >= 50) return '#2563eb';
    return '#d97706';
  };

  const weakTopics = topics.filter((t) => t.isWeak);
  const leaderboard = [
    { rank: 1, name: 'Alex Johnson', xp: 2450 },
    { rank: 2, name: `${user?.firstName || 'You'}`, xp, isUser: true },
    { rank: 3, name: 'Sophia Lee', xp: 980 },
    { rank: 4, name: 'Marcus Vance', xp: 850 },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Top Navigation Bar */}
        <View style={styles.navbar}>
          <View style={styles.navLeft}>
            <View style={styles.navLogo}>
              <Feather name="layers" size={16} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.navBrand}>PSP LUMORA</Text>
              <Text style={styles.navUser}>{user?.firstName} {user?.lastName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={() => logout()} activeOpacity={0.8}>
            <Feather name="log-out" size={13} color="#ffffff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Role Banner */}
        <View style={styles.roleBanner}>
          <View style={styles.roleTagRow}>
            <View style={styles.roleTag}>
              <Feather name={user?.role === 'TEACHER' ? 'briefcase' : user?.role === 'ADMIN' ? 'shield' : 'book-open'} size={11} color="#ffffff" />
              <Text style={styles.roleTagText}>{String(user?.role)}</Text>
            </View>
            <View style={styles.syncedTag}>
              <View style={styles.syncDot} />
              <Text style={styles.syncedTagText}>SYNCED</Text>
            </View>
          </View>
          <Text style={styles.roleTitle}>
            {user?.role === 'STUDENT' ? 'Student Learning Portal' : user?.role === 'TEACHER' ? 'Teacher Assessment Desk' : 'Admin Console'}
          </Text>
          <Text style={styles.roleEmail}>{user?.email}</Text>
        </View>

        {/* ANALYTICS: Topic Mastery Bars */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="target" size={15} color="#111111" />
            <Text style={styles.cardTitle}>Topic Mastery</Text>
            {weakTopics.length > 0 && (
              <View style={styles.weakBadge}>
                <Feather name="alert-circle" size={11} color="#d97706" />
                <Text style={styles.weakBadgeText}>{weakTopics.length} weak</Text>
              </View>
            )}
          </View>

          <View style={styles.masteryList}>
            {topics.map((topic) => (
              <View key={topic.topic} style={styles.masteryItem}>
                <View style={styles.masteryLabelRow}>
                  <Text style={styles.masteryTopic}>{topic.topic}</Text>
                  <Text style={styles.masteryPct}>{Math.round(topic.masteryScore)}%</Text>
                </View>
                <View style={styles.masteryTrack}>
                  <View
                    style={[
                      styles.masteryFill,
                      { width: `${Math.min(100, topic.masteryScore)}%` as any, backgroundColor: getMasteryBarColor(topic.masteryScore) },
                    ]}
                  />
                </View>
                <Text style={styles.masteryMeta}>
                  {topic.correctAnswers}/{topic.totalAttempts} correct · {topic.status}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Active Assessments */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="file-text" size={15} color="#111111" />
            <Text style={styles.cardTitle}>Active Assessments</Text>
          </View>
          {assessments.map((asm) => (
            <View key={asm.id} style={styles.asmItem}>
              <View style={styles.asmMeta}>
                <View style={styles.asmClassChip}>
                  <Text style={styles.asmClassText}>{asm.className}</Text>
                </View>
                <Text style={styles.asmDuration}>
                  <Feather name="clock" size={11} color="#71717a" /> {asm.durationMinutes} mins
                </Text>
              </View>
              <Text style={styles.asmTitle}>{asm.title}</Text>
              <Text style={styles.asmDesc}>{asm.description}</Text>
              <View style={styles.asmFooter}>
                <Text style={styles.asmMarks}>{asm.totalMarks} marks</Text>
                {asm.hasNegativeMarking && (
                  <Text style={styles.asmNeg}>-{asm.negativeMarkValue} marking</Text>
                )}
                <TouchableOpacity style={styles.startBtn} onPress={simulateQuiz} activeOpacity={0.8}>
                  <Text style={styles.startBtnText}>Start</Text>
                  <Feather name="arrow-right" size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* XP Stats */}
        <View style={styles.statsCard}>
          <View style={styles.cardHeader}>
            <Feather name="zap" size={15} color="#ffffff" />
            <Text style={[styles.cardTitle, { color: '#ffffff' }]}>XP & Progress</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL XP</Text>
              <Text style={styles.statXp}>{xp.toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statStreak}>{streak} Days</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.xpBtn} onPress={simulateQuiz} activeOpacity={0.8}>
            <Text style={styles.xpBtnText}>Solve Practice Quiz (+50 XP)</Text>
            <Feather name="arrow-right" size={13} color="#111111" />
          </TouchableOpacity>
        </View>

        {/* Leaderboard */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="award" size={15} color="#111111" />
            <Text style={styles.cardTitle}>Leaderboard</Text>
          </View>
          {leaderboard.map((item) => (
            <View key={item.rank} style={[styles.leaderRow, item.isUser && styles.leaderRowUser]}>
              <Text style={styles.leaderRank}>#{item.rank}</Text>
              <Text style={[styles.leaderName, item.isUser && styles.leaderNameUser]}>{item.name}</Text>
              <View style={styles.leaderXpRow}>
                <Feather name="zap" size={11} color={item.isUser ? '#ffffff' : '#71717a'} />
                <Text style={[styles.leaderXp, item.isUser && styles.leaderXpUser]}>{item.xp.toLocaleString()} XP</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F4F6',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
    gap: 14,
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBrand: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: 0.5,
  },
  navUser: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111111',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Role Banner
  roleBanner: {
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  roleTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  syncedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74,222,128,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  syncedTagText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '700',
  },
  roleTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  roleEmail: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },

  // Generic Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },
  weakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  weakBadgeText: {
    color: '#d97706',
    fontSize: 10,
    fontWeight: '700',
  },

  // Mastery Bars
  masteryList: {
    gap: 12,
  },
  masteryItem: {
    gap: 4,
  },
  masteryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masteryTopic: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
  },
  masteryPct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111111',
    fontVariant: ['tabular-nums'],
  },
  masteryTrack: {
    height: 6,
    backgroundColor: '#f4f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  masteryFill: {
    height: 6,
    borderRadius: 3,
  },
  masteryMeta: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: '500',
  },

  // Assessment Items
  asmItem: {
    backgroundColor: '#f9f9fb',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  asmMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  asmClassChip: {
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  asmClassText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  asmDuration: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '600',
  },
  asmTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  asmDesc: {
    fontSize: 11,
    color: '#71717a',
    lineHeight: 16,
  },
  asmFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    marginTop: 2,
  },
  asmMarks: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '600',
    flex: 1,
  },
  asmNeg: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '700',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111111',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Stats Card (dark)
  statsCard: {
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 14,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statXp: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f4c463',
  },
  statStreak: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ff5745',
  },
  xpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4f4f6',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  xpBtnText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
  },

  // Leaderboard
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9f9fb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  leaderRowUser: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  leaderRank: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a1a1aa',
    width: 24,
  },
  leaderName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
  },
  leaderNameUser: {
    color: '#ffffff',
  },
  leaderXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leaderXp: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
  },
  leaderXpUser: {
    color: '#ffffff',
  },
});
