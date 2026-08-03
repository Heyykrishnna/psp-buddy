import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export function DashboardScreen() {
  const { user, logout } = useAuth();
  const [xp, setXp] = useState(1250);
  const [streak] = useState(5);

  const simulateQuiz = () => {
    setXp((prev) => prev + 50);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Navbar */}
        <View style={styles.topNav}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>PSP</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>PSP LUMORA MOBILE</Text>
              <Text style={styles.brandUser}>{user?.firstName} {user?.lastName}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={() => logout()}>
            <Text style={styles.signOutText}>SIGN OUT</Text>
          </TouchableOpacity>
        </View>

        {/* Role Banner Card */}
        <View style={styles.roleCard}>
          <View style={styles.roleHeaderRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>ROLE: {String(user?.role)}</Text>
            </View>
            <View style={styles.syncedTag}>
              <Text style={styles.syncedTagText}>SYNCED</Text>
            </View>
          </View>

          <Text style={styles.roleTitle}>
            {user?.role === 'STUDENT'
              ? 'Student Learning Portal'
              : user?.role === 'TEACHER'
              ? 'Teacher Assessment Desk'
              : 'Admin System Console'}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Stats Card (Charcoal Black Card) */}
        <View style={styles.statsCard}>
          <Text style={styles.statsHeader}>⚡ REAL-TIME XP & PROGRESS</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>TOTAL XP</Text>
              <Text style={styles.xpValue}>{xp} XP</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>STREAK</Text>
              <Text style={styles.streakValue}>🔥 {streak} Days</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.quizButton} onPress={simulateQuiz}>
            <Text style={styles.quizButtonText}>+ SOLVE PRACTICE QUIZ (+50 XP)</Text>
            <View style={styles.arrowCircleWhite}>
              <Text style={styles.arrowTextBlack}>↗</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Leaderboard Card */}
        <View style={styles.leaderboardCard}>
          <Text style={styles.leaderboardTitle}>🏆 LIVE LEADERBOARD</Text>

          {[
            { rank: 1, name: 'Alex Johnson', xp: 2450 },
            { rank: 2, name: `${user?.firstName || 'You'} (${String(user?.role)})`, xp, isUser: true },
            { rank: 3, name: 'Sophia Lee', xp: 980 },
            { rank: 4, name: 'Marcus Vance', xp: 850 },
          ].map((item) => (
            <View
              key={item.rank}
              style={[styles.leaderRow, item.isUser && styles.highlightLeaderRow]}
            >
              <Text style={styles.rankText}>#{item.rank}</Text>
              <Text style={styles.nameText}>{item.name}</Text>
              <Text style={styles.xpText}>{item.xp} XP</Text>
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
    backgroundColor: '#B8C6B6',
  },
  scrollContent: {
    padding: 18,
    gap: 16,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#121316',
  },
  brandUser: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5451FF',
  },
  signOutButton: {
    backgroundColor: '#121316',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  roleCard: {
    backgroundColor: '#5451FF',
    borderRadius: 28,
    padding: 20,
    gap: 8,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  syncedTag: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncedTagText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '800',
  },
  roleTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  statsCard: {
    backgroundColor: '#121316',
    borderRadius: 28,
    padding: 20,
    gap: 14,
  },
  statsHeader: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1f2024',
    padding: 14,
    borderRadius: 18,
  },
  statBoxLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
  },
  xpValue: {
    color: '#F4C463',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  streakValue: {
    color: '#FF5745',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF5745',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  quizButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  arrowCircleWhite: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowTextBlack: {
    color: '#121316',
    fontWeight: 'bold',
  },
  leaderboardCard: {
    backgroundColor: '#121316',
    borderRadius: 28,
    padding: 20,
    gap: 10,
  },
  leaderboardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2024',
    padding: 12,
    borderRadius: 14,
  },
  highlightLeaderRow: {
    backgroundColor: '#5451FF',
  },
  rankText: {
    color: '#F4C463',
    fontWeight: '900',
    fontSize: 12,
    width: 30,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  xpText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
});
