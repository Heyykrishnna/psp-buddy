import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { SlidingSegmentedControl } from "../components/SlidingSegmentedControl";
import { LeaderboardEntryDTO } from "../types";

interface LeaderboardScreenProps {
  onBackToDashboard: () => void;
}

const DEFAULT_MOCK_LEADERBOARD: LeaderboardEntryDTO[] = [
  {
    id: "s-1",
    studentId: "s-1",
    studentName: "Alex Rivera",
    totalXp: 3450,
    rank: 1,
  },
  {
    id: "s-2",
    studentId: "s-2",
    studentName: "Sarah Chen",
    totalXp: 2980,
    rank: 2,
  },
  {
    id: "s-3",
    studentId: "s-3",
    studentName: "Yatharth K.",
    totalXp: 2450,
    rank: 3,
  },
  {
    id: "s-4",
    studentId: "s-4",
    studentName: "David Miller",
    totalXp: 2100,
    rank: 4,
  },
  {
    id: "s-5",
    studentId: "s-5",
    studentName: "Elena Rostova",
    totalXp: 1890,
    rank: 5,
  },
  {
    id: "s-6",
    studentId: "s-6",
    studentName: "Marcus Vance",
    totalXp: 1720,
    rank: 6,
  },
  {
    id: "s-7",
    studentId: "s-7",
    studentName: "Priya Sharma",
    totalXp: 1550,
    rank: 7,
  },
  {
    id: "s-8",
    studentId: "s-8",
    studentName: "Jordan Lee",
    totalXp: 1420,
    rank: 8,
  },
];

export function LeaderboardScreen({
  onBackToDashboard,
}: LeaderboardScreenProps) {
  const { user, apiClient } = useAuth();
  const [timeframe, setTimeframe] = useState<"WEEKLY" | "MONTHLY" | "ALL_TIME">(
    "ALL_TIME",
  );
  const [rankings, setRankings] = useState<LeaderboardEntryDTO[]>(
    DEFAULT_MOCK_LEADERBOARD,
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const data = await apiClient.getLeaderboard(timeframe);
        if (data && data.length > 0) {
          setRankings(data);
        } else {
          setRankings(DEFAULT_MOCK_LEADERBOARD);
        }
      } catch {
        setRankings(DEFAULT_MOCK_LEADERBOARD);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [timeframe]);

  const userFullName = user
    ? `${user.firstName} ${user.lastName}`
    : "Your Rank";
  const userEntry = rankings.find(
    (r) =>
      r.studentId === user?.id ||
      r.studentName
        .toLowerCase()
        .includes((user?.firstName || "").toLowerCase()),
  );

  const myRank = userEntry?.rank || 3;
  const myXp = userEntry?.totalXp || 2450;

  const top3 = rankings.slice(0, 3);
  const restRankings = rankings.slice(3);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Fixed Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBackToDashboard}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#4ade80" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>GLOBAL LEADERBOARD</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe Filter Tabs */}
        <SlidingSegmentedControl
          options={["WEEKLY", "MONTHLY", "ALL_TIME"] as const}
          selectedOption={timeframe}
          onSelect={(val) => setTimeframe(val as "WEEKLY" | "MONTHLY" | "ALL_TIME")}
        />

        {/* Current Student Highlight Banner */}
        <View style={styles.myRankCard}>
          <View style={styles.myRankBadge}>
            <Text style={styles.myRankBadgeText}>#{myRank}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.myRankLabel}>YOUR CURRENT RANK</Text>
            <Text style={styles.myRankName}>{userFullName}</Text>
            {user?.studentRegistrationNo && (
              <Text style={styles.myRankReg}>
                ID: {user.studentRegistrationNo}
              </Text>
            )}
          </View>
          <View style={styles.myXpBadge}>
            <Ionicons name="trophy" size={16} color="#F4C463" />
            <Text style={styles.myXpText}>{myXp.toLocaleString()} XP</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#5451FF" />
            <Text style={styles.loadingLabel}>FETCHING RANKINGS...</Text>
          </View>
        ) : (
          <>
            {/* Top 3 Podium Section */}
            {top3.length > 0 && (
              <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                {top3[1] && (
                  <View style={[styles.podiumCol, styles.podium2nd]}>
                    <View style={styles.avatarWrap2nd}>
                      <Text style={styles.podiumAvatarInitial}>
                        {top3[1].studentName.charAt(0)}
                      </Text>
                      <View style={styles.podiumBadge2nd}>
                        <Text style={styles.podiumBadgeText}>2</Text>
                      </View>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {top3[1].studentName}
                    </Text>
                    <Text style={styles.podiumXp}>{top3[1].totalXp} XP</Text>
                  </View>
                )}

                {/* 1st Place */}
                {top3[0] && (
                  <View style={[styles.podiumCol, styles.podium1st]}>
                    <FontAwesome5
                      name="crown"
                      size={20}
                      color="#F4C463"
                      style={{ marginBottom: -4 }}
                    />
                    <View style={styles.avatarWrap1st}>
                      <Text style={styles.podiumAvatarInitial1st}>
                        {top3[0].studentName.charAt(0)}
                      </Text>
                      <View style={styles.podiumBadge1st}>
                        <Text style={styles.podiumBadgeText1st}>1</Text>
                      </View>
                    </View>
                    <Text style={styles.podiumName1st} numberOfLines={1}>
                      {top3[0].studentName}
                    </Text>
                    <Text style={styles.podiumXp1st}>{top3[0].totalXp} XP</Text>
                  </View>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <View style={[styles.podiumCol, styles.podium3rd]}>
                    <View style={styles.avatarWrap3rd}>
                      <Text style={styles.podiumAvatarInitial}>
                        {top3[2].studentName.charAt(0)}
                      </Text>
                      <View style={styles.podiumBadge3rd}>
                        <Text style={styles.podiumBadgeText}>3</Text>
                      </View>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {top3[2].studentName}
                    </Text>
                    <Text style={styles.podiumXp}>{top3[2].totalXp} XP</Text>
                  </View>
                )}
              </View>
            )}

            {/* Full Rankings List */}
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>ALL STUDENT RANKINGS</Text>

              {rankings.map((item) => {
                const isMe =
                  item.studentId === user?.id ||
                  item.studentName
                    .toLowerCase()
                    .includes((user?.firstName || "").toLowerCase());
                return (
                  <View
                    key={item.id}
                    style={[styles.rankRow, isMe && styles.rankRowMe]}
                  >
                    <View
                      style={[
                        styles.rankBadge,
                        item.rank === 1
                          ? styles.rank1
                          : item.rank === 2
                            ? styles.rank2
                            : item.rank === 3
                              ? styles.rank3
                              : null,
                      ]}
                    >
                      <Text style={styles.rankBadgeText}>#{item.rank}</Text>
                    </View>

                    <View style={styles.userInitialCircle}>
                      <Text style={styles.userInitialText}>
                        {item.studentName.charAt(0)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.studentNameText,
                          isMe && styles.studentNameTextMe,
                        ]}
                        numberOfLines={1}
                      >
                        {item.studentName} {isMe ? "(You)" : ""}
                      </Text>
                    </View>

                    <Text style={[styles.xpText, isMe && styles.xpTextMe]}>
                      {item.totalXp.toLocaleString()} XP
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121316",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#191a1e",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  navTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#191a1e",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTabBtn: {
    backgroundColor: "#5451FF",
  },
  tabText: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  activeTabText: {
    color: "#ffffff",
  },
  myRankCard: {
    backgroundColor: "#191a1e",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderColor: "#5451FF",
  },
  myRankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#5451FF",
    alignItems: "center",
    justifyContent: "center",
  },
  myRankBadgeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  myRankLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  myRankName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  myRankReg: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "500",
  },
  myXpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(244,196,99,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  myXpText: {
    color: "#F4C463",
    fontSize: 12,
    fontWeight: "700",
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  podiumCol: {
    flex: 1,
    backgroundColor: "#191a1e",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  podium1st: {
    backgroundColor: "rgba(84,81,255,0.15)",
    borderColor: "#5451FF",
    borderWidth: 2,
    paddingTop: 16,
    paddingBottom: 22,
  },
  podium2nd: {},
  podium3rd: {},
  avatarWrap1st: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#5451FF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarWrap2nd: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarWrap3rd: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  podiumAvatarInitial1st: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  podiumAvatarInitial: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  podiumBadge1st: {
    position: "absolute",
    bottom: -6,
    backgroundColor: "#F4C463",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumBadge2nd: {
    position: "absolute",
    bottom: -6,
    backgroundColor: "#94A3B8",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumBadge3rd: {
    position: "absolute",
    bottom: -6,
    backgroundColor: "#D97706",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumBadgeText1st: {
    color: "#121316",
    fontSize: 11,
    fontWeight: "800",
  },
  podiumBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  podiumName1st: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  podiumName: {
    color: "#d1d5db",
    fontSize: 12,
    fontWeight: "600",
  },
  podiumXp1st: {
    color: "#F4C463",
    fontSize: 12,
    fontWeight: "700",
  },
  podiumXp: {
    color: "#9ca3af",
    fontSize: 11,
  },
  listContainer: {
    backgroundColor: "#191a1e",
    borderRadius: 24,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  listTitle: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#22242a",
    padding: 14,
    borderRadius: 16,
  },
  rankRowMe: {
    backgroundColor: "rgba(84,81,255,0.2)",
    borderWidth: 1,
    borderColor: "#5451FF",
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#191a1e",
    alignItems: "center",
    justifyContent: "center",
  },
  rank1: { backgroundColor: "#F4C463" },
  rank2: { backgroundColor: "#94A3B8" },
  rank3: { backgroundColor: "#D97706" },
  rankBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  userInitialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3E3BE0",
    alignItems: "center",
    justifyContent: "center",
  },
  userInitialText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  studentNameText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  studentNameTextMe: {
    color: "#5451FF",
    fontWeight: "700",
  },
  xpText: {
    color: "#F4C463",
    fontSize: 12,
    fontWeight: "700",
  },
  xpTextMe: {
    color: "#4ade80",
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingLabel: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "600",
  },
});
