import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { AssessmentDTO, StudentTopicMasteryDTO, LeaderboardEntryDTO } from "../types";

const { width } = Dimensions.get("window");

// Animated mastery bar component with smooth spring entry
function MasteryBar({
  topic,
  score,
  delay,
}: {
  topic: string;
  score: number;
  delay: number;
}) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(animWidth, {
        toValue: score,
        duration: 900,
        delay: 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [score]);

  const barColor =
    score >= 80 ? "#4ade80" : score >= 50 ? "#5451FF" : "#FF5745";
  const trackWidth = width - 40 - 44; // 20px padding each side + 22px card padding each side

  const barPx = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: [0, trackWidth],
    extrapolate: "clamp",
  });

  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelRow}>
        <Text style={barStyles.topicText}>{topic}</Text>
        <Text style={barStyles.pctText}>{Math.round(score)}%</Text>
      </View>
      <View style={barStyles.track}>
        <Animated.View
          style={[barStyles.fill, { width: barPx, backgroundColor: barColor }]}
        />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topicText: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
  pctText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#a1a1aa",
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3 },
});

// XP Bar chart columns
function XpBarChart({ xp }: { xp: number }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const heights = [35, 55, 45, 80, 60, 90, 70];
  const animValues = useRef(heights.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const anims = animValues.map((v, i) =>
      Animated.timing(v, {
        toValue: heights[i],
        duration: 700,
        delay: i * 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    );
    Animated.stagger(60, anims).start();
  }, []);

  return (
    <View style={chartStyles.container}>
      {days.map((day, i) => (
        <View key={i} style={chartStyles.col}>
          <Animated.View
            style={[
              chartStyles.bar,
              {
                height: animValues[i],
                backgroundColor: i === 5 ? "#F4C463" : "rgba(255,255,255,0.15)",
              },
            ]}
          />
          <Text style={chartStyles.dayLabel}>{day}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 100,
  },
  col: { flex: 1, alignItems: "center", gap: 5 },
  bar: { width: "100%", borderRadius: 5 },
  dayLabel: { fontSize: 10, color: "#71717a", fontWeight: "700" },
});

export interface DashboardScreenProps {
  onOpenAssessments?: (asmId?: string) => void;
  onOpenLeaderboard?: () => void;
  onOpenPlayground?: () => void;
  onOpenCompetitive?: () => void;
  onOpenAiTutor?: () => void;
  onOpenAnalytics?: () => void;
}

export function DashboardScreen({
  onOpenAssessments,
  onOpenLeaderboard,
  onOpenPlayground,
  onOpenCompetitive,
  onOpenAiTutor,
  onOpenAnalytics,
}: DashboardScreenProps) {
  const { user, logout, apiClient } = useAuth();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [assessments, setAssessments] = useState<AssessmentDTO[]>([]);
  const [topics, setTopics] = useState<StudentTopicMasteryDTO[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [list, topicData, overviewData, leaderboardData] = await Promise.allSettled([
          apiClient.getAssessments(),
          apiClient.getTopicMastery(),
          apiClient.getStudentOverview(),
          apiClient.getLeaderboard(),
        ]);
        if (list.status === "fulfilled" && Array.isArray(list.value))
          setAssessments(list.value);
        if (topicData.status === "fulfilled" && Array.isArray(topicData.value))
          setTopics(topicData.value);
        if (overviewData.status === "fulfilled" && overviewData.value) {
          setXp(overviewData.value.totalXp || 0);
          setStreak(overviewData.value.currentStreak || 0);
        }
        if (leaderboardData.status === "fulfilled" && Array.isArray(leaderboardData.value))
          setLeaderboard(leaderboardData.value);
      } catch {}
      finally {
        setLoading(false);
      }
    }
    loadData();
  }, [apiClient]);

  const weakTopics = topics.filter((t) => t.isWeak);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#111111" />
        <Text style={{ marginTop: 14, fontSize: 12, color: "#71717a", fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>
          Loading Dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP NAVIGATION */}
        <View style={styles.topNav}>
          <Text style={styles.topNavBrand}>PSP LUMORA</Text>
          <View style={styles.topNavRight}>
            <TouchableOpacity
              style={styles.signOutPill}
              onPress={() => logout()}
              activeOpacity={0.85}
            >
              <Text style={styles.signOutText}>SIGN OUT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GREETING + ROLE CARD */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingTagRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>
                {String(user?.role || "STUDENT")}
              </Text>
            </View>
          </View>

          <Text style={styles.greetingText}>
            Hi, {user?.firstName || "Student"}!
          </Text>

          <Text style={styles.greetingEmail}>{user?.email}</Text>

          <View style={styles.greetingStats}>
            <View>
              <Text style={styles.greetingStatVal}>{xp.toLocaleString()}</Text>
              <Text style={styles.greetingStatLabel}>TOTAL XP</Text>
            </View>
            <View style={styles.greetingStatDivider} />
            <View>
              <Text style={styles.greetingStatVal}>{streak}</Text>
              <Text style={styles.greetingStatLabel}>DAY STREAK</Text>
            </View>
            <View style={styles.greetingStatDivider} />
            <View>
              <Text style={styles.greetingStatVal}>{weakTopics.length}</Text>
              <Text style={styles.greetingStatLabel}>WEAK TOPICS</Text>
            </View>
          </View>
        </View>

        {/* QUICK FEATURE LAUNCH GRID */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: "#18181b", borderColor: "#27272a" }]}
            onPress={() => onOpenPlayground?.()}
            activeOpacity={0.85}
          >
            <Text style={styles.quickCardIcon}>💻</Text>
            <Text style={styles.quickCardTitle}>Code IDE (Web)</Text>
            <Text style={styles.quickCardSub}>Desktop Web Required</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: "#18181b", borderColor: "#27272a" }]}
            onPress={() => onOpenCompetitive?.()}
            activeOpacity={0.85}
          >
            <Text style={styles.quickCardIcon}>🏆</Text>
            <Text style={styles.quickCardTitle}>Competitive</Text>
            <Text style={styles.quickCardSub}>Daily, Streaks, Badges</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: "#18181b", borderColor: "#27272a" }]}
            onPress={() => onOpenAiTutor?.()}
            activeOpacity={0.85}
          >
            <Text style={styles.quickCardIcon}>🤖</Text>
            <Text style={styles.quickCardTitle}>AI Tutor</Text>
            <Text style={styles.quickCardSub}>Ask Questions & Hints</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: "#18181b", borderColor: "#27272a" }]}
            onPress={() => onOpenAnalytics?.()}
            activeOpacity={0.85}
          >
            <Text style={styles.quickCardIcon}>📊</Text>
            <Text style={styles.quickCardTitle}>Analytics</Text>
            <Text style={styles.quickCardSub}>Topic Mastery & Stats</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVE ASSESSMENTS (Coral Card) */}
        <View style={styles.assessmentSection}>
          <View style={styles.sectionHeaderRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text style={styles.sectionTitle}>ASSESSMENTS</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{assessments.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewAllPill}
              onPress={() => onOpenAssessments?.()}
              activeOpacity={0.8}
            >
              <Text style={styles.viewAllPillText}>VIEW ALL →</Text>
            </TouchableOpacity>
          </View>

          {assessments.map((asm) => (
            <TouchableOpacity
              key={asm.id}
              style={styles.asmCard}
              onPress={() => onOpenAssessments?.(asm.id)}
              activeOpacity={0.85}
            >
              <View style={styles.asmTopRow}>
                <View style={styles.asmClassChip}>
                  <Text style={styles.asmClassText}>{asm.className}</Text>
                </View>
                <TouchableOpacity
                  style={styles.asmArrow}
                  onPress={() => onOpenAssessments?.(asm.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.asmArrowText}>↗</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.asmTitle}>{asm.title}</Text>
              <Text style={styles.asmDesc}>{asm.description}</Text>

              <View style={styles.asmMeta}>
                <View style={styles.asmMetaChip}>
                  <Text style={styles.asmMetaText}>{asm.assessmentType}</Text>
                </View>
                <View style={styles.asmMetaChip}>
                  <Text style={styles.asmMetaText}>
                    {asm.durationMinutes} mins
                  </Text>
                </View>
                <View style={styles.asmMetaChip}>
                  <Text style={styles.asmMetaText}>{asm.totalMarks} marks</Text>
                </View>
                {asm.hasNegativeMarking && (
                  <View
                    style={[
                      styles.asmMetaChip,
                      { backgroundColor: "rgba(255,255,255,0.25)" },
                    ]}
                  >
                    <Text style={styles.asmMetaText}>
                      -{asm.negativeMarkValue} neg
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.openPortalButton}
            onPress={() => onOpenAssessments?.()}
            activeOpacity={0.85}
          >
            <Text style={styles.openPortalButtonText}>
              VIEW ALL ASSIGNMENTS & ASSESSMENTS
            </Text>
            <View style={styles.arrowCircleSmall}>
              <Text style={styles.arrowTextSmall}>↗</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* TOPIC MASTERY (Purple Card) */}
        <View style={styles.masteryCard}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardSectionLabel}>TOPIC MASTERY</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>this semester</Text>
            </View>
          </View>

          <Text style={styles.masteryTitle}>
            {weakTopics.length > 0
              ? `${weakTopics.length} topic${weakTopics.length > 1 ? "s" : ""} need focus`
              : "All topics on track"}
          </Text>

          <View style={styles.masteryBars}>
            {topics.map((t, i) => (
              <MasteryBar
                key={t.topic}
                topic={t.topic}
                score={t.masteryScore}
                delay={i * 100}
              />
            ))}
          </View>
        </View>

        {/* XP CHART CARD (Dark) */}
        <View style={styles.xpCard}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardSectionLabel, { color: "#a1a1aa" }]}>
              XP PERFORMANCE
            </Text>
            <TouchableOpacity
              style={styles.xpBtn}
              onPress={() => setXp((p) => p + 50)}
              activeOpacity={0.85}
            >
              <Text style={styles.xpBtnText}>+50 XP</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.xpValue}>{xp.toLocaleString()} XP</Text>
          <Text style={styles.xpSub}>
            +50 from last quiz · streak: {streak} days
          </Text>

          <XpBarChart xp={xp} />
        </View>

        {/* LEADERBOARD (Dark Card) */}
        <TouchableOpacity
          style={styles.leaderCard}
          onPress={() => onOpenLeaderboard?.()}
          activeOpacity={0.85}
        >
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardSectionLabel, { color: "#a1a1aa" }]}>
              LEADERBOARD
            </Text>
            <Text style={[styles.leaderSubLabel, { color: "#5451FF" }]}>
              VIEW FULL RANKINGS →
            </Text>
          </View>

          <View style={styles.leaderList}>
            {leaderboard.length === 0 ? (
              <Text style={{ fontSize: 12, color: "#71717a", textAlign: "center", paddingVertical: 16 }}>
                No leaderboard data yet.
              </Text>
            ) : (
              leaderboard.map((item) => {
                const isCurrentUser = item.studentId === user?.id;
                return (
                  <View
                    key={item.id}
                    style={[styles.leaderRow, isCurrentUser && styles.leaderRowUser]}
                  >
                    <Text
                      style={[
                        styles.leaderRank,
                        isCurrentUser && styles.leaderRankUser,
                      ]}
                    >
                      {item.rank < 4
                        ? ["01", "02", "03", "04"][item.rank - 1]
                        : `0${item.rank}`}
                    </Text>
                    <Text
                      style={[
                        styles.leaderName,
                        isCurrentUser && styles.leaderNameUser,
                      ]}
                      numberOfLines={1}
                    >
                      {item.studentName}
                    </Text>
                    <Text
                      style={[styles.leaderXp, isCurrentUser && styles.leaderXpUser]}
                    >
                      {item.totalXp.toLocaleString()} XP
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#B8C6B6",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 14,
  },

  // Top Nav
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  topNavBrand: {
    fontSize: 16,
    fontWeight: "900",
    color: "#121316",
    letterSpacing: 0.8,
  },
  topNavRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#121316",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  syncText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    letterSpacing: 1,
  },
  signOutPill: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  signOutText: {
    color: "#121316",
    fontSize: 9,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    letterSpacing: 0.8,
  },

  // Greeting Card
  greetingCard: {
    backgroundColor: "#121316",
    borderRadius: 28,
    padding: 22,
    gap: 8,
  },
  greetingTagRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  roleTag: {
    backgroundColor: "#5451FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleTagText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    letterSpacing: 0.5,
  },
  activeTag: {
    backgroundColor: "rgba(74,222,128,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.4)",
  },
  activeTagText: {
    color: "#4ade80",
    fontSize: 10,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  greetingEmail: {
    fontSize: 12,
    color: "#71717a",
    fontWeight: "500",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
  greetingStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  greetingStatVal: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    color: "#ffffff",
  },
  greetingStatLabel: {
    fontSize: 9,
    fontWeight: "500",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
    color: "#71717a",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  greetingStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  // Mastery Card (purple)
  masteryCard: {
    backgroundColor: "#5451FF",
    borderRadius: 28,
    padding: 22,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.5,
  },
  cardBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  masteryTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  masteryBars: {
    gap: 12,
    marginTop: 4,
  },

  // XP Card (dark)
  xpCard: {
    backgroundColor: "#121316",
    borderRadius: 28,
    padding: 22,
    gap: 10,
  },
  xpValue: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
    color: "#F4C463",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  xpSub: {
    fontSize: 11,
    color: "#71717a",
    fontWeight: "500",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
    marginBottom: 4,
  },
  xpBtn: {
    backgroundColor: "#F4C463",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpBtnText: {
    color: "#121316",
    fontSize: 11,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    letterSpacing: 0.5,
  },

  // Assessment Section
  assessmentSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
    color: "#121316",
    letterSpacing: 1,
  },
  countPill: {
    backgroundColor: "#121316",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  viewAllPill: {
    backgroundColor: "#121316",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  viewAllPillText: {
    color: "#5451FF",
    fontSize: 10,
    fontWeight: "700",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    letterSpacing: 0.5,
  },
  openPortalButton: {
    backgroundColor: "#121316",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  openPortalButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    letterSpacing: 0.5,
  },
  arrowCircleSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#5451FF",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowTextSmall: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  asmCard: {
    backgroundColor: "#FF5745",
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  asmTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  asmClassChip: {
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  asmClassText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    letterSpacing: 0.5,
  },
  asmArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  asmArrowText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  asmTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
    color: "#ffffff",
    lineHeight: 22,
  },
  asmDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 17,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
  asmMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  asmMetaChip: {
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  asmMetaText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },

  // Leaderboard Card (dark)
  leaderCard: {
    backgroundColor: "#121316",
    borderRadius: 28,
    padding: 22,
    gap: 16,
  },
  leaderSubLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    color: "#3f3f46",
    letterSpacing: 0.8,
  },
  leaderList: {
    gap: 8,
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  leaderRowUser: {
    backgroundColor: "#5451FF",
  },
  leaderRank: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    color: "#3f3f46",
    letterSpacing: 0.5,
    width: 24,
  },
  leaderRankUser: {
    color: "rgba(255,255,255,0.7)",
  },
  leaderName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    color: "#ffffff",
  },
  leaderNameUser: {
    color: "#ffffff",
  },
  leaderXp: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    color: "#F4C463",
    fontVariant: ["tabular-nums"],
  },
  leaderXpUser: {
    color: "#ffffff",
  },

  // Quick feature launch grid
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 4,
  },
  quickCard: {
    width: (width - 40 - 10) / 2, // 2 column layout with 20px screen margin each side & 10px gap
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  quickCardIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_700Bold",
  },
  quickCardSub: {
    fontSize: 10,
    color: "#a1a1aa",
    fontWeight: "500",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
});
