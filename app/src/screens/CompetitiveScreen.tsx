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

type Tab = 'overview' | 'leaderboard' | 'contests' | 'achievements';
type LbTimeframe = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

interface CompetitiveScreenProps {
  onBackToDashboard: () => void;
}

export function CompetitiveScreen({ onBackToDashboard }: CompetitiveScreenProps) {
  const { apiClient: client, user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [profile, setProfile] = useState<any>(null);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const [weeklyChallenge, setWeeklyChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbTimeframe, setLbTimeframe] = useState<LbTimeframe>('ALL_TIME');
  const [contests, setContests] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = (user as any)?.studentId || user?.id;

  useEffect(() => {
    loadData();
  }, [studentId]);

  useEffect(() => {
    if (tab === 'leaderboard') loadLeaderboard(lbTimeframe);
  }, [tab, lbTimeframe]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (client) {
        const [dc, wc, cont, ach] = await Promise.all([
          client.getDailyChallenge(),
          client.getWeeklyChallenge(),
          client.getContests(),
          client.getAchievements(),
        ]);
        setDailyChallenge(dc);
        setWeeklyChallenge(wc);
        setContests(cont || []);
        setAchievements(ach || []);

        if (studentId) {
          const p = await client.getCompetitiveProfile(studentId);
          setProfile(p);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async (tf: LbTimeframe) => {
    try {
      if (client) {
        const data = await client.getCompetitiveLeaderboard(tf);
        setLeaderboard(data || []);
      }
    } catch {
      // Keep existing
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToDashboard} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Competitive Hub</Text>
      </View>

      {/* Nav Tabs */}
      <View style={styles.topTabBar}>
        {(['overview', 'leaderboard', 'contests', 'achievements'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.topTabItem, tab === t && styles.topTabItemActive]}
          >
            <Text style={[styles.topTabText, tab === t && styles.topTabTextActive]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <ScrollView style={styles.flex1} contentContainerStyle={styles.contentPadding}>
          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <View style={styles.gap16}>
              {/* Stats Bar */}
              {profile && (
                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.statVal}>{profile.student.totalXp}</Text>
                    <Text style={styles.statLbl}>Total XP</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: '#FFEDD5' }]}>
                    <Text style={styles.statVal}>{profile.student.currentStreak}d</Text>
                    <Text style={styles.statLbl}>Current Streak</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: '#E0E7FF' }]}>
                    <Text style={styles.statVal}>{profile.student.contestRating}</Text>
                    <Text style={styles.statLbl}>Rating</Text>
                  </View>
                </View>
              )}

              {/* Daily Challenge Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Daily Challenge</Text>
                  <Text style={styles.xpTag}>+{dailyChallenge?.bonusXp || 50} XP</Text>
                </View>
                {dailyChallenge ? (
                  <View>
                    <Text style={styles.probTitle}>{dailyChallenge.problem?.title}</Text>
                    <Text style={styles.probDesc}>
                      {dailyChallenge.totalSolved || 0} solved today
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.mutedText}>No challenge configured for today.</Text>
                )}
              </View>

              {/* Weekly Challenge Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Weekly Challenge</Text>
                  <Text style={styles.xpTag}>+{weeklyChallenge?.xpReward || 200} XP</Text>
                </View>
                {weeklyChallenge ? (
                  <View>
                    <Text style={styles.probTitle}>{weeklyChallenge.title}</Text>
                    <Text style={styles.probDesc}>{weeklyChallenge.description}</Text>
                  </View>
                ) : (
                  <Text style={styles.mutedText}>No active weekly challenge.</Text>
                )}
              </View>
            </View>
          )}

          {/* LEADERBOARD TAB */}
          {tab === 'leaderboard' && (
            <View style={styles.gap16}>
              <View style={styles.tfRow}>
                {(['ALL_TIME', 'WEEKLY', 'MONTHLY'] as LbTimeframe[]).map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    onPress={() => {
                      setLbTimeframe(tf);
                      loadLeaderboard(tf);
                    }}
                    style={[styles.tfBtn, lbTimeframe === tf && styles.tfBtnActive]}
                  >
                    <Text style={[styles.tfBtnText, lbTimeframe === tf && styles.tfBtnTextActive]}>
                      {tf === 'ALL_TIME' ? 'All Time' : tf === 'WEEKLY' ? 'This Week' : 'This Month'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.card}>
                {leaderboard.map((item, idx) => (
                  <View key={idx} style={styles.lbRow}>
                    <Text style={styles.lbRank}>#{item.rank}</Text>
                    <Text style={styles.lbName}>{item.name}</Text>
                    <Text style={styles.lbXp}>{item.totalXp} XP</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* CONTESTS TAB */}
          {tab === 'contests' && (
            <View style={styles.gap16}>
              {contests.map((c) => (
                <View key={c.id} style={styles.card}>
                  <Text style={styles.probTitle}>{c.title}</Text>
                  <Text style={styles.probDesc}>{c.description}</Text>
                  <TouchableOpacity
                    onPress={async () => {
                      if (client) await client.registerContest(c.id);
                      loadData();
                    }}
                    style={styles.regBtn}
                  >
                    <Text style={styles.regBtnText}>Register</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ACHIEVEMENTS TAB */}
          {tab === 'achievements' && (
            <View style={styles.gap16}>
              {achievements.map((a) => (
                <View key={a.id} style={styles.card}>
                  <Text style={styles.probTitle}>{a.title}</Text>
                  <Text style={styles.probDesc}>{a.description}</Text>
                  <Text style={styles.xpTag}>+{a.xpReward} XP</Text>
                </View>
              ))}
            </View>
          )}
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

  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topTabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  topTabItemActive: { borderBottomColor: '#0066FF' },
  topTabText: { fontSize: 11, fontWeight: '700', color: '#666' },
  topTabTextActive: { color: '#0066FF' },

  contentPadding: { padding: 16 },
  gap16: { gap: 12 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800', color: '#111' },
  statLbl: { fontSize: 10, color: '#555', marginTop: 2 },

  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  xpTag: { fontSize: 11, fontWeight: '700', color: '#0066FF' },
  probTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  probDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  mutedText: { fontSize: 12, color: '#999', fontStyle: 'italic' },

  tfRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tfBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  tfBtnActive: { backgroundColor: '#0066FF' },
  tfBtnText: { fontSize: 11, fontWeight: '700', color: '#444' },
  tfBtnTextActive: { color: '#FFF' },

  lbRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  lbRank: { fontSize: 12, fontWeight: '700', color: '#0066FF', width: 30 },
  lbName: { fontSize: 13, fontWeight: '600', color: '#111', flex: 1 },
  lbXp: { fontSize: 12, fontWeight: '700', color: '#D97706' },

  regBtn: { marginTop: 8, backgroundColor: '#0066FF', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  regBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
