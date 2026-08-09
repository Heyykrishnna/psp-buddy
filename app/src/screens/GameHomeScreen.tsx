import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  AssessmentDTO,
  LearningChapterDTO,
  LearningLevelDTO,
  LearningPathDTO,
  SyncEventPayload,
  SyncEventType,
} from "../types";

const { width } = Dimensions.get("window");
const COLORS = {
  ink: "#17213B",
  muted: "#78829A",
  canvas: "#F4F8FF",
  white: "#FFFFFF",
  blue: "#56C7F2",
  purple: "#7C5CFC",
  orange: "#FF9F68",
  pink: "#FF6FAE",
  yellow: "#FFC857",
  green: "#62D39A",
};

function fallbackAssessment(id: string, title: string, type: "QUIZ" | "WORKSHEET"): AssessmentDTO {
  return {
    id,
    title,
    description: type === "QUIZ" ? "A quick knowledge check" : "A guided practice worksheet",
    className: "1st Sem",
    topic: "Learning Path",
    assessmentType: type === "QUIZ" ? "QUIZ" : "PRACTICE",
    totalMarks: 10,
    passingMarks: 7,
    durationMinutes: 15,
    isPublished: true,
  };
}

function fallbackPath(): LearningPathDTO {
  const activity = (id: string, title: string, type: "QUIZ" | "WORKSHEET", orderIndex: number) => ({
    id: `${id}-${type.toLowerCase()}`,
    type,
    orderIndex,
    assessment: fallbackAssessment(id, title, type),
    progress: { assessmentId: id, type, score: 0, completed: false, source: "NONE" as const },
  });
  const levels = [
    {
      id: "demo-level-1", key: "complexity-quest", title: "Complexity Quest", subtitle: "Learn to see the hidden cost", description: "Spot Big-O patterns and make smart choices before the timer runs out.", icon: "🧭", color: COLORS.blue, orderIndex: 1, xpReward: 120, passPercent: 70, status: "UNLOCKED" as const, bestPercent: 0, xpAwarded: 0,
      activities: [activity("demo-asm-1", "Algorithm Complexity Quiz", "QUIZ", 1), activity("demo-asm-4", "Logic Worksheet", "WORKSHEET", 2)],
    },
    {
      id: "demo-level-2", key: "systems-station", title: "Systems Station", subtitle: "Keep the machine moving", description: "Explore processes, memory, and the choices that keep systems reliable.", icon: "🛰️", color: COLORS.orange, orderIndex: 2, xpReward: 150, passPercent: 70, status: "LOCKED" as const, bestPercent: 0, xpAwarded: 0,
      activities: [activity("demo-asm-2", "Systems Quiz", "QUIZ", 1), activity("demo-asm-coding", "Build Lab Worksheet", "WORKSHEET", 2)],
    },
  ];
  return {
    student: { id: "demo", userId: "demo", name: "Learner" },
    chapters: [
      { id: "demo-chapter-1", key: "algorithm-academy", title: "Algorithm Academy", subtitle: "Train your logic muscles", description: "Build the foundations of algorithms, complexity, and problem solving.", icon: "⚡", color: COLORS.purple, orderIndex: 1, levels },
      { id: "demo-chapter-2", key: "builder-bay", title: "Builder Bay", subtitle: "Turn ideas into code", description: "Practice object thinking and ship solutions that hold together.", icon: "🛠️", color: COLORS.pink, orderIndex: 2, levels: [{ ...levels[0], id: "demo-level-3", key: "object-town", title: "Object Town", status: "LOCKED" as const, color: COLORS.yellow }] },
    ],
  };
}

// A width-animated progress bar so mastery growth reads as motion, not a static fill.
function AnimatedBar({ percent, trackStyle, fillStyle, tint }: { percent: number; trackStyle: any; fillStyle: any; tint?: string }) {
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: Math.max(0, Math.min(100, percent)), duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [percent]);
  const w = grow.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });
  return (
    <View style={trackStyle}>
      <Animated.View style={[fillStyle, { width: w }, tint ? { backgroundColor: tint } : null]} />
    </View>
  );
}

// A number that counts up to its target so earning XP feels earned.
function useCountUp(target: number) {
  const anim = useRef(new Animated.Value(target)).current;
  const [value, setValue] = useState(target);
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setValue(Math.round(v)));
    Animated.timing(anim, { toValue: target, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [target]);
  return value;
}

function LevelNode({ level, isNext, onPress }: { level: LearningLevelDTO; isNext: boolean; onPress: () => void }) {
  const isLocked = level.status === "LOCKED";
  const isComplete = level.status === "COMPLETED";
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  // The "next" playable node breathes to pull the eye toward the current objective.
  useEffect(() => {
    if (!isNext) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isNext]);

  const pressIn = () => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }).start();
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });

  return (
    <TouchableOpacity disabled={isLocked} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.9} style={styles.nodeWrap}>
      <View style={styles.nodeStage}>
        {isNext && <Animated.View style={[styles.nodeHalo, { backgroundColor: level.color, opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />}
        <Animated.View style={{ transform: [{ scale: Animated.multiply(scale, isNext ? pulseScale : 1) }] }}>
          <View style={[styles.node, { backgroundColor: isLocked ? "#E8EDF6" : level.color }, isComplete && styles.nodeComplete]}>
            <Text style={[styles.nodeIcon, isLocked && styles.lockIcon]}>{isLocked ? "🔒" : isComplete ? "✓" : level.icon}</Text>
            {!isLocked && <View style={styles.nodeSpark}><Text style={styles.nodeSparkText}>{isComplete ? "DONE" : `${level.xpReward} XP`}</Text></View>}
          </View>
        </Animated.View>
      </View>
      <Text style={[styles.nodeTitle, isLocked && styles.lockedText]} numberOfLines={1}>{level.title}</Text>
      <Text style={[styles.nodeStatus, isNext && styles.nodeStatusNext]}>{isComplete ? "Completed" : isLocked ? "Locked" : level.status === "IN_PROGRESS" ? `${level.bestPercent}% ready` : "Start level"}</Text>
    </TouchableOpacity>
  );
}

function ActivityCard({ activity, onPress }: { activity: LearningLevelDTO["activities"][number]; onPress: () => void }) {
  const completed = activity.progress.completed;
  return (
    <TouchableOpacity style={styles.activityCard} onPress={onPress} activeOpacity={0.86}>
      <View style={[styles.activityIcon, { backgroundColor: activity.type === "QUIZ" ? "#E4F7FF" : "#FFF1E8" }]}>
        <Ionicons name={activity.type === "QUIZ" ? "sparkles-outline" : "document-text-outline"} size={21} color={activity.type === "QUIZ" ? COLORS.blue : COLORS.orange} />
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityType}>{activity.type === "QUIZ" ? "QUIZ" : "WORKSHEET"}</Text>
        <Text style={styles.activityTitle} numberOfLines={2}>{activity.assessment.title}</Text>
        <Text style={styles.activityMeta}>{completed ? `Completed · ${activity.progress.score}%` : `${activity.assessment.durationMinutes} min adventure`}</Text>
      </View>
      <View style={[styles.activityArrow, completed && styles.activityArrowDone]}><Text style={styles.activityArrowText}>{completed ? "✓" : "→"}</Text></View>
    </TouchableOpacity>
  );
}

// The reward moment: fired by the realtime LEVEL_PROGRESS_UPDATED event so clearing a
// level (even from another device) lands as a celebration instead of a silent number change.
const CONFETTI = ["🎉", "⭐️", "✨", "🎊", "💫", "🏆", "⚡️"];
function CelebrationOverlay({ title, xp, onDone }: { title: string; xp: number; onDone: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.6)).current;
  const piecesRef = useRef<Array<{ key: number; emoji: string; left: number; delay: number; drift: number; drop: Animated.Value }> | null>(null);
  if (!piecesRef.current) {
    piecesRef.current = Array.from({ length: 16 }, (_, i) => ({
      key: i,
      emoji: CONFETTI[i % CONFETTI.length],
      left: 6 + Math.random() * 88,
      delay: Math.random() * 260,
      drift: (Math.random() - 0.5) * 40,
      drop: new Animated.Value(0),
    }));
  }
  const pieces = piecesRef.current;
  const rewardXp = useCountUp(xp);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      ...pieces.map((p) =>
        Animated.timing(p.drop, { toValue: 1, duration: 1600, delay: p.delay, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => onDone());
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[styles.celebrateOverlay, { opacity: fade }]} pointerEvents="box-none">
      {pieces.map((p) => (
        <Animated.Text
          key={p.key}
          style={[
            styles.confetti,
            {
              left: `${p.left}%`,
              opacity: p.drop.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateY: p.drop.interpolate({ inputRange: [0, 1], outputRange: [-40, 520] }) },
                { translateX: p.drop.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                { rotate: p.drop.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "220deg"] }) },
              ],
            },
          ]}
        >
          {p.emoji}
        </Animated.Text>
      ))}
      <Animated.View style={[styles.celebrateCard, { transform: [{ scale: pop }] }]}>
        <Text style={styles.celebrateBadge}>🏅</Text>
        <Text style={styles.celebrateKicker}>LEVEL CLEARED</Text>
        <Text style={styles.celebrateTitle}>{title}</Text>
        <View style={styles.celebrateXp}><Ionicons name="flash" size={16} color={COLORS.yellow} /><Text style={styles.celebrateXpText}>+{rewardXp} XP</Text></View>
        <Text style={styles.celebrateCopy}>New level unlocked. The map just got bigger!</Text>
      </Animated.View>
    </Animated.View>
  );
}

export interface GameHomeScreenProps {
  onOpenAssessments?: (asmId?: string) => void;
  onOpenLeaderboard?: () => void;
  onOpenPlayground?: () => void;
  onOpenCompetitive?: () => void;
  onOpenAiTutor?: () => void;
  onOpenAnalytics?: () => void;
}

export function GameHomeScreen({ onOpenAssessments, onOpenLeaderboard, onOpenPlayground, onOpenCompetitive, onOpenAiTutor, onOpenAnalytics }: GameHomeScreenProps) {
  const { user, logout, apiClient } = useAuth();
  const [path, setPath] = useState<LearningPathDTO>(() => fallbackPath());
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [celebration, setCelebration] = useState<{ title: string; xp: number } | null>(null);

  // Latest path kept in a ref so the realtime handler can name the cleared level without re-subscribing.
  const pathRef = useRef(path);
  pathRef.current = path;

  const displayXp = useCountUp(xp);

  // Staggered entrance so the map assembles itself instead of snapping into place.
  const intro = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(90, intro.map((v) => Animated.timing(v, { toValue: 1, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }))).start();
  }, []);
  const introStyle = (i: number) => ({ opacity: intro[i], transform: [{ translateY: intro[i].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] });

  const loadPath = async () => {
    try {
      const [nextPath, overview] = await Promise.all([
        apiClient.getLearningPath(user?.id),
        apiClient.getStudentOverview().catch(() => null),
      ]);
      if (nextPath?.chapters?.length) setPath(nextPath);
      if (overview) { setXp(overview.totalXp || 0); setStreak(overview.currentStreak || 0); }
    } catch {
      // The fallback keeps the game shell usable while a local backend is offline.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPath(); }, [apiClient, user?.id]);

  useEffect(
    () =>
      apiClient.subscribeSync(SyncEventType.LEVEL_PROGRESS_UPDATED, (payload: SyncEventPayload) => {
        // Turn a freshly-cleared level into a celebration before refreshing the map.
        const changes = (payload?.data as any)?.changes as Array<{ levelId: string; status: string; xpAwarded?: number }> | undefined;
        const cleared = changes?.find((c) => c.status === "COMPLETED" && (c.xpAwarded ?? 0) > 0);
        if (cleared) {
          const level = pathRef.current.chapters.flatMap((c) => c.levels).find((l) => l.id === cleared.levelId);
          setCelebration({ title: level?.title || "Level cleared", xp: cleared.xpAwarded || level?.xpReward || 0 });
        }
        loadPath();
      }),
    [apiClient],
  );

  const allLevels = useMemo(() => path.chapters.flatMap((chapter) => chapter.levels), [path]);
  const completedLevels = allLevels.filter((level) => level.status === "COMPLETED").length;
  const nextLevel = allLevels.find((level) => level.status === "UNLOCKED" || level.status === "IN_PROGRESS");
  const selectedLevel = allLevels.find((level) => level.id === selectedLevelId) || nextLevel;
  const totalLevels = Math.max(allLevels.length, 1);

  const openActivity = (assessment: AssessmentDTO) => onOpenAssessments?.(assessment.id);

  const celebrationOverlay = celebration ? (
    <CelebrationOverlay title={celebration.title} xp={celebration.xp} onDone={() => setCelebration(null)} />
  ) : null;

  if (selectedLevelId && selectedLevel) {
    const chapter = path.chapters.find((item) => item.levels.some((level) => level.id === selectedLevel.id));
    const isLocked = selectedLevel.status === "LOCKED";
    const cleared = selectedLevel.bestPercent >= selectedLevel.passPercent && selectedLevel.status === "COMPLETED";
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailTopbar}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedLevelId(null)}><Ionicons name="arrow-back" size={20} color={COLORS.ink} /></TouchableOpacity>
            <View style={styles.breadcrumb}><Text style={styles.breadcrumbText}>{chapter?.title || "Adventure"}</Text><Text style={styles.breadcrumbDivider}>/</Text><Text style={styles.breadcrumbCurrent}>Level {selectedLevel.orderIndex}</Text></View>
            <View style={styles.xpMini}><Ionicons name="flash" size={14} color={COLORS.yellow} /><Text style={styles.xpMiniText}>{displayXp}</Text></View>
          </View>
          <View style={[styles.levelHero, { backgroundColor: selectedLevel.color }]}>
            <View style={styles.heroOrb}><Text style={styles.heroOrbText}>{selectedLevel.icon}</Text></View>
            <Text style={styles.detailEyebrow}>LEVEL {selectedLevel.orderIndex} · {selectedLevel.xpReward} XP</Text>
            <Text style={styles.detailTitle}>{selectedLevel.title}</Text>
            <Text style={styles.detailSubtitle}>{selectedLevel.description}</Text>
            <AnimatedBar percent={selectedLevel.bestPercent} trackStyle={styles.detailProgressTrack} fillStyle={styles.detailProgressFill} tint={cleared ? COLORS.green : COLORS.white} />
            <Text style={styles.detailProgressLabel}>{selectedLevel.bestPercent}% mastered · {selectedLevel.passPercent}% needed to clear</Text>
          </View>
          {isLocked ? (
            <View style={styles.lockedPanel}><Text style={styles.lockedPanelIcon}>🔒</Text><Text style={styles.lockedPanelTitle}>Finish the previous level</Text><Text style={styles.lockedPanelCopy}>Clear the adventure before this one to unlock it.</Text></View>
          ) : (
            <>
              <View style={styles.sectionHeading}><View><Text style={styles.sectionKicker}>YOUR MISSION</Text><Text style={styles.sectionTitle}>Clear both checkpoints</Text></View><View style={styles.scorePill}><Text style={styles.scorePillText}>{selectedLevel.activities.filter((a) => a.progress.completed).length}/{selectedLevel.activities.length}</Text></View></View>
              <View style={styles.activityList}>{selectedLevel.activities.map((activity) => <ActivityCard key={activity.id} activity={activity} onPress={() => openActivity(activity.assessment)} />)}</View>
              <View style={styles.tipCard}><Text style={styles.tipEmoji}>💡</Text><View style={{ flex: 1 }}><Text style={styles.tipTitle}>Tiny steps count</Text><Text style={styles.tipCopy}>Finish each activity, then hit the score target to open your next level.</Text></View></View>
            </>
          )}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelectedLevelId(null)}><Text style={styles.secondaryButtonText}>Back to adventure map</Text></TouchableOpacity>
        </ScrollView>
        {celebrationOverlay}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.firstName?.[0] || "L").toUpperCase()}</Text></View>
          <View style={styles.welcomeCopy}><Text style={styles.welcomeMuted}>WELCOME BACK</Text><Text style={styles.welcomeName}>{user?.firstName || "Learner"} <Text style={{ color: COLORS.purple }}>✦</Text></Text></View>
          <View style={styles.topbarActions}><View style={styles.xpPill}><Ionicons name="flash" size={15} color={COLORS.yellow} /><Text style={styles.xpText}>{displayXp.toLocaleString()}</Text></View><TouchableOpacity style={styles.menuButton} onPress={() => logout()}><Ionicons name="log-out-outline" size={18} color={COLORS.ink} /></TouchableOpacity></View>
        </View>
        <Animated.View style={[styles.heroCard, introStyle(0)]}>
          <View style={styles.heroCopy}><View style={styles.streakPill}><Ionicons name="flame" size={14} color="#FF8B4D" /><Text style={styles.streakText}>{streak || 0} day streak</Text></View><Text style={styles.heroTitle}>Your next win{`\n`}is waiting.</Text><Text style={styles.heroBody}>{completedLevels === 0 ? "Start your first adventure and earn your first burst of XP." : `${completedLevels} level${completedLevels === 1 ? "" : "s"} cleared. Keep the momentum going!`}</Text><TouchableOpacity style={styles.heroButton} onPress={() => nextLevel && setSelectedLevelId(nextLevel.id)}><Text style={styles.heroButtonText}>{nextLevel ? "Continue journey" : "Replay journey"}</Text><Ionicons name="arrow-forward" size={16} color={COLORS.white} /></TouchableOpacity></View><View style={styles.heroMascot}><Text style={styles.mascotText}>🚀</Text><View style={styles.mascotBubble}><Text style={styles.mascotBubbleText}>LET'S GO!</Text></View></View>
        </Animated.View>
        <Animated.View style={[styles.statRow, introStyle(1)]}><View style={styles.statCard}><Text style={styles.statValue}>{completedLevels}/{totalLevels}</Text><Text style={styles.statLabel}>LEVELS CLEARED</Text></View><View style={styles.statCard}><Text style={[styles.statValue, { color: COLORS.orange }]}>{streak || 0}</Text><Text style={styles.statLabel}>DAY STREAK</Text></View><View style={styles.statCard}><Text style={[styles.statValue, { color: COLORS.purple }]}>{Math.round((completedLevels / totalLevels) * 100)}%</Text><Text style={styles.statLabel}>MAP COMPLETE</Text></View></Animated.View>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionKicker}>WORLD MAP</Text><Text style={styles.sectionTitle}>Choose your adventure</Text></View><View style={styles.mapLegend}><View style={[styles.legendDot, { backgroundColor: COLORS.green }]} /><Text style={styles.legendText}>cleared</Text></View></View>
        {loading ? <View style={styles.loadingCard}><ActivityIndicator color={COLORS.purple} /><Text style={styles.loadingText}>Syncing your adventure...</Text></View> : path.chapters.map((chapter: LearningChapterDTO) => <Animated.View key={chapter.id} style={[styles.chapterCard, introStyle(2)]}><View style={[styles.chapterTop, { backgroundColor: chapter.color }]}><View style={styles.chapterIcon}><Text style={styles.chapterIconText}>{chapter.icon}</Text></View><View style={{ flex: 1 }}><Text style={styles.chapterKicker}>CHAPTER {chapter.orderIndex}</Text><Text style={styles.chapterTitle}>{chapter.title}</Text><Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text></View><Text style={styles.chapterArrow}>✦</Text></View><Text style={styles.chapterDescription}>{chapter.description}</Text><View style={styles.nodesRow}>{chapter.levels.length > 1 && <View style={styles.nodeConnector} />}{chapter.levels.map((level) => <LevelNode key={level.id} level={level} isNext={!!nextLevel && level.id === nextLevel.id} onPress={() => setSelectedLevelId(level.id)} />)}</View></Animated.View>)}
        <Animated.View style={introStyle(3)}><TouchableOpacity style={styles.coachCard} onPress={() => onOpenAiTutor?.()} activeOpacity={0.85}><View style={styles.coachIcon}><Text style={{ fontSize: 22 }}>🧠</Text></View><View style={{ flex: 1 }}><Text style={styles.coachTitle}>Need a hint?</Text><Text style={styles.coachCopy}>Ask your AI coach before you spend a life.</Text></View><Ionicons name="arrow-forward" size={18} color={COLORS.purple} /></TouchableOpacity></Animated.View>
        <View style={styles.bottomNav}><TouchableOpacity style={[styles.navItem, styles.navItemActive]}><Ionicons name="map" size={19} color={COLORS.white} /><Text style={styles.navItemActiveText}>Map</Text></TouchableOpacity><TouchableOpacity style={styles.navItem} onPress={() => onOpenAssessments?.()}><Ionicons name="book-outline" size={19} color={COLORS.muted} /><Text style={styles.navItemText}>Missions</Text></TouchableOpacity><TouchableOpacity style={styles.navItem} onPress={() => onOpenLeaderboard?.()}><Ionicons name="trophy-outline" size={19} color={COLORS.muted} /><Text style={styles.navItemText}>Rank</Text></TouchableOpacity><TouchableOpacity style={styles.navItem} onPress={() => onOpenAnalytics?.()}><Ionicons name="person-outline" size={19} color={COLORS.muted} /><Text style={styles.navItemText}>Profile</Text></TouchableOpacity></View>
      </ScrollView>
      {celebrationOverlay}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.canvas },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34, gap: 14 },
  topbar: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 16, backgroundColor: COLORS.yellow, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.white },
  avatarText: { color: COLORS.ink, fontWeight: "900", fontSize: 18 },
  welcomeCopy: { flex: 1 }, welcomeMuted: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 }, welcomeName: { color: COLORS.ink, fontSize: 17, fontWeight: "900", marginTop: 2 },
  topbarActions: { flexDirection: "row", alignItems: "center", gap: 7 }, xpPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 16, shadowColor: "#CDD7E8", shadowOpacity: 0.45, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 }, xpText: { color: COLORS.ink, fontSize: 12, fontWeight: "900" }, menuButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  heroCard: { minHeight: 240, borderRadius: 30, backgroundColor: COLORS.purple, padding: 22, overflow: "hidden", flexDirection: "row" }, heroCopy: { flex: 1, zIndex: 2 }, streakPill: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12 }, streakText: { color: COLORS.white, fontWeight: "800", fontSize: 10 }, heroTitle: { color: COLORS.white, fontWeight: "900", fontSize: 29, lineHeight: 31, letterSpacing: -0.6, marginTop: 16 }, heroBody: { color: "rgba(255,255,255,0.78)", fontSize: 11, lineHeight: 17, marginTop: 9, maxWidth: 190 }, heroButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: COLORS.ink, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 15, marginTop: 17 }, heroButtonText: { color: COLORS.white, fontSize: 11, fontWeight: "900" }, heroMascot: { width: 100, alignItems: "center", justifyContent: "center", transform: [{ rotate: "8deg" }] }, mascotText: { fontSize: 76 }, mascotBubble: { backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, marginTop: -4 }, mascotBubbleText: { color: COLORS.ink, fontSize: 8, fontWeight: "900" },
  statRow: { flexDirection: "row", gap: 9 }, statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 18, padding: 13, minHeight: 70, justifyContent: "center" }, statValue: { color: COLORS.blue, fontSize: 18, fontWeight: "900" }, statLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "800", letterSpacing: 0.45, marginTop: 4 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 5 }, sectionKicker: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 }, sectionTitle: { color: COLORS.ink, fontSize: 21, fontWeight: "900", marginTop: 3, letterSpacing: -0.3 }, mapLegend: { flexDirection: "row", alignItems: "center", gap: 5, paddingBottom: 3 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendText: { color: COLORS.muted, fontSize: 9, fontWeight: "700" },
  loadingCard: { height: 120, backgroundColor: COLORS.white, borderRadius: 22, justifyContent: "center", alignItems: "center", gap: 9 }, loadingText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" }, chapterCard: { backgroundColor: COLORS.white, borderRadius: 26, paddingBottom: 18, overflow: "hidden" }, chapterTop: { padding: 17, flexDirection: "row", alignItems: "center", gap: 12 }, chapterIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.24)", alignItems: "center", justifyContent: "center" }, chapterIconText: { fontSize: 25 }, chapterKicker: { color: "rgba(255,255,255,0.75)", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 }, chapterTitle: { color: COLORS.white, fontSize: 21, fontWeight: "900", marginTop: 2 }, chapterSubtitle: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "700", marginTop: 2 }, chapterArrow: { color: "rgba(255,255,255,0.8)", fontSize: 21 }, chapterDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 16, paddingHorizontal: 18, paddingTop: 14 }, nodesRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 18 }, nodeConnector: { position: "absolute", left: "22%", right: "22%", top: 18 + 36, height: 3, borderRadius: 2, borderTopWidth: 3, borderStyle: "dashed", borderColor: "#DCE4F2" }, nodeWrap: { width: Math.min((width - 80) / 2, 150), alignItems: "center" }, nodeStage: { width: 92, height: 84, alignItems: "center", justifyContent: "center" }, nodeHalo: { position: "absolute", width: 84, height: 84, borderRadius: 30 }, node: { width: 72, height: 72, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: COLORS.white, shadowColor: "#C4CEE2", shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }, nodeComplete: { backgroundColor: COLORS.green, borderColor: "#DFF8EB" }, nodeIcon: { fontSize: 30, color: COLORS.white, fontWeight: "900" }, lockIcon: { fontSize: 20, opacity: 0.65 }, nodeSpark: { position: "absolute", right: -20, top: -10, backgroundColor: COLORS.white, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9, shadowColor: "#CCD6E6", shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, nodeSparkText: { color: COLORS.ink, fontSize: 8, fontWeight: "900" }, nodeTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "900", marginTop: 8, textAlign: "center" }, nodeStatus: { color: COLORS.muted, fontSize: 9, fontWeight: "700", marginTop: 3 }, nodeStatusNext: { color: COLORS.purple, fontWeight: "900" }, lockedText: { color: "#A8B1C3" },
  coachCard: { backgroundColor: "#FFF6D9", borderRadius: 22, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#FFE9A1" }, coachIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center" }, coachTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "900" }, coachCopy: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  bottomNav: { backgroundColor: COLORS.white, borderRadius: 22, padding: 7, flexDirection: "row", justifyContent: "space-between", marginTop: 3 }, navItem: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 16 }, navItemActive: { backgroundColor: COLORS.ink }, navItemText: { color: COLORS.muted, fontSize: 9, fontWeight: "800" }, navItemActiveText: { color: COLORS.white, fontSize: 9, fontWeight: "800" },
  detailTopbar: { flexDirection: "row", alignItems: "center", gap: 10 }, backButton: { width: 38, height: 38, backgroundColor: COLORS.white, borderRadius: 14, alignItems: "center", justifyContent: "center" }, breadcrumb: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center" }, breadcrumbText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" }, breadcrumbDivider: { color: "#B5BED0" }, breadcrumbCurrent: { color: COLORS.ink, fontSize: 11, fontWeight: "900" }, xpMini: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 13 }, xpMiniText: { color: COLORS.ink, fontSize: 11, fontWeight: "900" }, levelHero: { borderRadius: 28, padding: 22, overflow: "hidden" }, heroOrb: { width: 62, height: 62, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.26)", alignItems: "center", justifyContent: "center", marginBottom: 16 }, heroOrbText: { fontSize: 32 }, detailEyebrow: { color: "rgba(255,255,255,0.76)", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 }, detailTitle: { color: COLORS.white, fontSize: 30, fontWeight: "900", marginTop: 5 }, detailSubtitle: { color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 18, marginTop: 8 }, detailProgressTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.27)", borderRadius: 4, marginTop: 20, overflow: "hidden" }, detailProgressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.white }, detailProgressLabel: { color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: "700", marginTop: 7 }, scorePill: { backgroundColor: COLORS.ink, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 7 }, scorePillText: { color: COLORS.white, fontSize: 11, fontWeight: "900" }, activityList: { gap: 10 }, activityCard: { backgroundColor: COLORS.white, borderRadius: 21, padding: 13, flexDirection: "row", alignItems: "center", gap: 11 }, activityIcon: { width: 44, height: 44, borderRadius: 15, justifyContent: "center", alignItems: "center" }, activityCopy: { flex: 1 }, activityType: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 }, activityTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "900", marginTop: 3 }, activityMeta: { color: COLORS.muted, fontSize: 9, fontWeight: "600", marginTop: 4 }, activityArrow: { width: 31, height: 31, borderRadius: 12, backgroundColor: COLORS.ink, justifyContent: "center", alignItems: "center" }, activityArrowDone: { backgroundColor: COLORS.green }, activityArrowText: { color: COLORS.white, fontWeight: "900", fontSize: 15 }, lockedPanel: { backgroundColor: COLORS.white, borderRadius: 23, alignItems: "center", padding: 28 }, lockedPanelIcon: { fontSize: 36 }, lockedPanelTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900", marginTop: 9 }, lockedPanelCopy: { color: COLORS.muted, fontSize: 11, textAlign: "center", marginTop: 5, lineHeight: 16 }, tipCard: { backgroundColor: "#E8F8FF", borderRadius: 20, padding: 15, flexDirection: "row", gap: 11, alignItems: "center" }, tipEmoji: { fontSize: 23 }, tipTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "900" }, tipCopy: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 2 }, secondaryButton: { borderWidth: 1, borderColor: "#D8E0EE", borderRadius: 17, paddingVertical: 13, alignItems: "center" }, secondaryButtonText: { color: COLORS.ink, fontSize: 11, fontWeight: "900" },
  celebrateOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(23,33,59,0.55)", alignItems: "center", justifyContent: "center", padding: 30 }, confetti: { position: "absolute", top: 0, fontSize: 22 }, celebrateCard: { backgroundColor: COLORS.white, borderRadius: 30, padding: 28, alignItems: "center", width: "100%", maxWidth: 320, shadowColor: "#0B1533", shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 }, celebrateBadge: { fontSize: 54 }, celebrateKicker: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 2, marginTop: 8 }, celebrateTitle: { color: COLORS.ink, fontSize: 24, fontWeight: "900", marginTop: 4, textAlign: "center" }, celebrateXp: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF6D9", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 9, marginTop: 14 }, celebrateXpText: { color: COLORS.ink, fontSize: 16, fontWeight: "900" }, celebrateCopy: { color: COLORS.muted, fontSize: 11, textAlign: "center", marginTop: 12, lineHeight: 16 },
});
