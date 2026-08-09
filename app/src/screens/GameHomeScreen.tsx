import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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

const COLORS = {
  ink: "#20253D",
  muted: "#7D879F",
  canvas: "#F1F5FB",
  white: "#FFFFFF",
  blue: "#55B9EE",
  purple: "#7366E8",
  orange: "#FF9D68",
  pink: "#EE72A7",
  yellow: "#F7C95E",
  green: "#55C98C",
  line: "#DDE5F2",
};

const ICONS: Record<string, any> = {
  compass: "compass-outline",
  rocket: "rocket-outline",
  layers: "layers-outline",
  database: "server-outline",
  code: "code-slash-outline",
  hardware: "hardware-chip-outline",
  cube: "cube-outline",
  git: "git-branch-outline",
  bulb: "bulb-outline",
  lock: "lock-closed-outline",
  trophy: "trophy-outline",
  quiz: "help-circle-outline",
  worksheet: "document-text-outline",
  sparkles: "sparkles-outline",
};

function Icon({ name, size = 22, color = COLORS.ink }: { name: string; size?: number; color?: string }) {
  return <Ionicons name={ICONS[name] || name as any} size={size} color={color} />;
}

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
    { id: "demo-level-1", key: "complexity-quest", title: "Complexity Quest", subtitle: "Read the hidden cost", description: "Spot Big-O patterns and make smart choices before the timer runs out.", icon: "compass", color: COLORS.blue, orderIndex: 1, xpReward: 120, passPercent: 70, status: "UNLOCKED" as const, bestPercent: 0, xpAwarded: 0, activities: [activity("demo-asm-1", "Algorithm Complexity Quiz", "QUIZ", 1), activity("demo-asm-4", "Logic Worksheet", "WORKSHEET", 2)] },
    { id: "demo-level-2", key: "systems-station", title: "Systems Station", subtitle: "Keep the machine moving", description: "Explore processes, memory, and the choices that keep systems reliable.", icon: "hardware", color: COLORS.orange, orderIndex: 2, xpReward: 150, passPercent: 70, status: "LOCKED" as const, bestPercent: 0, xpAwarded: 0, activities: [activity("demo-asm-2", "Systems Quiz", "QUIZ", 1), activity("demo-asm-coding", "Build Lab Worksheet", "WORKSHEET", 2)] },
  ];
  return {
    student: { id: "demo", userId: "demo", name: "Learner" },
    chapters: [
      { id: "demo-chapter-1", key: "algorithm-academy", title: "Algorithm Academy", subtitle: "Train your logic muscles", description: "Build the foundations of algorithms, complexity, and problem solving.", icon: "layers", color: COLORS.purple, orderIndex: 1, levels },
      { id: "demo-chapter-2", key: "builder-bay", title: "Builder Bay", subtitle: "Turn ideas into code", description: "Practice object thinking and ship solutions that hold together.", icon: "cube", color: COLORS.pink, orderIndex: 2, levels: [{ ...levels[0], id: "demo-level-3", key: "object-town", title: "Object Town", status: "LOCKED" as const, color: COLORS.yellow, icon: "cube" }, { ...levels[1], id: "demo-level-4", key: "branching-grove", title: "Branching Grove", status: "LOCKED" as const, color: COLORS.green, icon: "git" }] },
      { id: "demo-chapter-3", key: "data-dock", title: "Data Dock", subtitle: "Organize the moving parts", description: "Practice choosing, tracing, and repairing the structures behind reliable programs.", icon: "database", color: COLORS.blue, orderIndex: 3, levels: [{ ...levels[0], id: "demo-level-5", key: "structure-harbor", title: "Structure Harbor", status: "LOCKED" as const, color: COLORS.green, icon: "layers" }, { ...levels[1], id: "demo-level-6", key: "debugger-den", title: "Debugger Den", status: "LOCKED" as const, color: COLORS.orange, icon: "bulb" }] },
    ],
  };
}

function AnimatedBar({ percent, trackStyle, fillStyle, tint }: { percent: number; trackStyle: any; fillStyle: any; tint?: string }) {
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: Math.max(0, Math.min(100, percent)), duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [percent]);
  const width = grow.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });
  return <View style={trackStyle}><Animated.View style={[fillStyle, { width }, tint ? { backgroundColor: tint } : null]} /></View>;
}

function useCountUp(target: number) {
  const anim = useRef(new Animated.Value(target)).current;
  const [value, setValue] = useState(target);
  useEffect(() => {
    const id = anim.addListener(({ value: next }) => setValue(Math.round(next)));
    Animated.timing(anim, { toValue: target, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [target]);
  return value;
}

function LevelNode({ level, isNext, onPress }: { level: LearningLevelDTO; isNext: boolean; onPress: () => void }) {
  const locked = level.status === "LOCKED";
  const complete = level.status === "COMPLETED";
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isNext) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isNext]);
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] });
  return (
    <TouchableOpacity disabled={locked} onPress={onPress} activeOpacity={0.85} style={styles.levelNode}>
      <View style={styles.levelNodeStage}>
        {isNext && <Animated.View style={[styles.nodeHalo, { backgroundColor: level.color, transform: [{ scale: haloScale }] }]} />}
        <View style={[styles.nodeCircle, { backgroundColor: locked ? "#E3E9F3" : complete ? COLORS.green : level.color }]}>
          <Icon name={locked ? "lock" : complete ? "trophy" : level.icon} size={28} color={locked ? "#98A4B8" : COLORS.white} />
        </View>
        {!locked && <View style={[styles.xpBadge, { borderColor: level.color }]}><Text style={styles.xpBadgeText}>{level.xpReward} XP</Text></View>}
      </View>
      <Text style={[styles.levelTitle, locked && styles.lockedText]} numberOfLines={1}>{level.title}</Text>
      <Text style={[styles.levelStatus, isNext && styles.nextText]}>{complete ? "Cleared" : locked ? "Locked" : level.status === "IN_PROGRESS" ? `${level.bestPercent}% ready` : "Start level"}</Text>
    </TouchableOpacity>
  );
}

function MapChapter({ chapter, nextLevel, onSelect }: { chapter: LearningChapterDTO; nextLevel?: LearningLevelDTO; onSelect: (id: string) => void }) {
  return (
    <View style={styles.chapterCard}>
      <View style={[styles.chapterHeader, { backgroundColor: chapter.color }]}>
        <View style={styles.chapterIcon}><Icon name={chapter.icon} size={25} color={COLORS.white} /></View>
        <View style={{ flex: 1 }}><Text style={styles.chapterKicker}>CHAPTER {chapter.orderIndex}</Text><Text style={styles.chapterTitle}>{chapter.title}</Text><Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text></View>
        <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.82)" />
      </View>
      <View style={styles.mapBoard}>
        <View style={[styles.mapIsland, styles.islandOne]} /><View style={[styles.mapIsland, styles.islandTwo]} /><View style={[styles.mapIsland, styles.islandThree]} />
        <Text style={styles.mapLabel}>LEARNING TRAIL</Text>
        {chapter.levels.map((level, index) => (
          <View key={level.id} style={styles.mapRow}>
            {index < chapter.levels.length - 1 && <View style={[styles.trailLine, index % 2 === 0 ? styles.trailLineLeft : styles.trailLineRight]} />}
            <View style={index % 2 === 0 ? styles.nodeLeft : styles.nodeRight}><LevelNode level={level} isNext={nextLevel?.id === level.id} onPress={() => onSelect(level.id)} /></View>
          </View>
        ))}
      </View>
      <Text style={styles.chapterDescription}>{chapter.description}</Text>
    </View>
  );
}

function ActivityCard({ activity, onPress }: { activity: LearningLevelDTO["activities"][number]; onPress: () => void }) {
  const completed = activity.progress.completed;
  const quiz = activity.type === "QUIZ";
  return (
    <TouchableOpacity style={styles.activityCard} onPress={onPress} activeOpacity={0.86}>
      <View style={[styles.activityIcon, { backgroundColor: quiz ? "#E5F6FF" : "#FFF0E7" }]}><Icon name={quiz ? "quiz" : "worksheet"} size={21} color={quiz ? COLORS.blue : COLORS.orange} /></View>
      <View style={styles.activityCopy}><Text style={styles.activityType}>{quiz ? "QUIZ" : "ASSIGNMENT"}</Text><Text style={styles.activityTitle} numberOfLines={2}>{activity.assessment.title}</Text><Text style={styles.activityMeta}>{completed ? `Completed - ${activity.progress.score}%` : `${activity.assessment.durationMinutes} min challenge`}</Text></View>
      <View style={[styles.activityArrow, completed && styles.activityArrowDone]}><Icon name={completed ? "checkmark" : "arrow-forward"} size={17} color={COLORS.white} /></View>
    </TouchableOpacity>
  );
}

function CelebrationOverlay({ title, xp, onDone }: { title: string; xp: number; onDone: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.parallel([Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }), Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true })]).start();
    const timer = setTimeout(() => Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(onDone), 2300);
    return () => clearTimeout(timer);
  }, []);
  return <Animated.View style={[styles.celebrationOverlay, { opacity: fade }]} pointerEvents="box-none">
    {[...Array(12)].map((_, index) => <View key={index} style={[styles.confetti, { left: `${8 + index * 7}%`, top: 30 + (index % 4) * 52, backgroundColor: [COLORS.blue, COLORS.yellow, COLORS.pink, COLORS.green][index % 4], transform: [{ rotate: `${index * 22}deg` }] }]} />)}
    <Animated.View style={[styles.celebrationCard, { transform: [{ scale: pop }] }]}><View style={styles.celebrationIcon}><Icon name="trophy" size={34} color={COLORS.yellow} /></View><Text style={styles.celebrationKicker}>LEVEL CLEARED</Text><Text style={styles.celebrationTitle}>{title}</Text><View style={styles.celebrationXp}><Icon name="flash" size={16} color={COLORS.orange} /><Text style={styles.celebrationXpText}>+{xp} XP</Text></View><Text style={styles.celebrationCopy}>Your next checkpoint is ready on the map.</Text></Animated.View>
  </Animated.View>;
}

export interface GameHomeScreenProps {
  onOpenAssessments?: (asmId?: string) => void;
  onOpenLeaderboard?: () => void;
  onOpenPlayground?: () => void;
  onOpenCompetitive?: () => void;
  onOpenAiTutor?: () => void;
  onOpenAnalytics?: () => void;
}

export function GameHomeScreen({ onOpenAssessments, onOpenLeaderboard, onOpenAiTutor, onOpenAnalytics }: GameHomeScreenProps) {
  const { user, logout, apiClient } = useAuth();
  const [path, setPath] = useState<LearningPathDTO>(() => fallbackPath());
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [celebration, setCelebration] = useState<{ title: string; xp: number } | null>(null);
  const pathRef = useRef(path);
  pathRef.current = path;
  const displayXp = useCountUp(xp);

  const loadPath = async () => {
    try {
      const [nextPath, overview] = await Promise.all([apiClient.getLearningPath(user?.id), apiClient.getStudentOverview().catch(() => null)]);
      if (nextPath?.chapters?.length) setPath(nextPath);
      if (overview) { setXp(overview.totalXp || 0); setStreak(overview.currentStreak || 0); }
    } catch { /* The local path keeps the app useful when the API is offline. */ }
    finally { setLoading(false); }
  };
  useEffect(() => { loadPath(); }, [apiClient, user?.id]);
  useEffect(() => apiClient.subscribeSync(SyncEventType.LEVEL_PROGRESS_UPDATED, (payload: SyncEventPayload) => {
    const changes = (payload?.data as any)?.changes as Array<{ levelId: string; status: string; xpAwarded?: number }> | undefined;
    const cleared = changes?.find((change) => change.status === "COMPLETED" && (change.xpAwarded || 0) > 0);
    if (cleared) { const level = pathRef.current.chapters.flatMap((chapter) => chapter.levels).find((item) => item.id === cleared.levelId); setCelebration({ title: level?.title || "Level cleared", xp: cleared.xpAwarded || level?.xpReward || 0 }); }
    loadPath();
  }), [apiClient]);

  const allLevels = useMemo(() => path.chapters.flatMap((chapter) => chapter.levels), [path]);
  const completedLevels = allLevels.filter((level) => level.status === "COMPLETED").length;
  const nextLevel = allLevels.find((level) => level.status === "UNLOCKED" || level.status === "IN_PROGRESS");
  const selectedLevel = allLevels.find((level) => level.id === selectedLevelId);
  const openActivity = (assessment: AssessmentDTO) => onOpenAssessments?.(assessment.id);

  if (selectedLevelId && selectedLevel) {
    const chapter = path.chapters.find((item) => item.levels.some((level) => level.id === selectedLevel.id));
    const locked = selectedLevel.status === "LOCKED";
    return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.detailTopbar}><TouchableOpacity style={styles.backButton} onPress={() => setSelectedLevelId(null)}><Icon name="arrow-back" size={20} color={COLORS.ink} /></TouchableOpacity><View style={styles.breadcrumb}><Text style={styles.breadcrumbText}>{chapter?.title || "Adventure"}</Text><Icon name="chevron-forward" size={13} color={COLORS.muted} /><Text style={styles.breadcrumbCurrent}>Level {selectedLevel.orderIndex}</Text></View><View style={styles.xpMini}><Icon name="flash" size={14} color={COLORS.orange} /><Text style={styles.xpMiniText}>{displayXp}</Text></View></View>
      <View style={[styles.levelHero, { backgroundColor: selectedLevel.color }]}><View style={styles.heroOrb}><Icon name={selectedLevel.icon} size={32} color={COLORS.white} /></View><Text style={styles.detailEyebrow}>LEVEL {selectedLevel.orderIndex}  /  {selectedLevel.xpReward} XP</Text><Text style={styles.detailTitle}>{selectedLevel.title}</Text><Text style={styles.detailSubtitle}>{selectedLevel.description}</Text><AnimatedBar percent={selectedLevel.bestPercent} trackStyle={styles.detailProgressTrack} fillStyle={styles.detailProgressFill} tint={COLORS.white} /><Text style={styles.detailProgressLabel}>{selectedLevel.bestPercent}% mastered  /  {selectedLevel.passPercent}% needed</Text></View>
      {locked ? <View style={styles.lockedPanel}><View style={styles.lockedIcon}><Icon name="lock" size={27} color={COLORS.muted} /></View><Text style={styles.lockedPanelTitle}>Finish the previous level</Text><Text style={styles.lockedPanelCopy}>Clear the checkpoint before this one to open the next part of the map.</Text></View> : <><View style={styles.sectionHeading}><View><Text style={styles.sectionKicker}>YOUR CHECKPOINTS</Text><Text style={styles.sectionTitle}>Clear the trail</Text></View><View style={styles.scorePill}><Text style={styles.scorePillText}>{selectedLevel.activities.filter((activity) => activity.progress.completed).length}/{selectedLevel.activities.length}</Text></View></View><View style={styles.activityList}>{selectedLevel.activities.map((activity) => <ActivityCard key={activity.id} activity={activity} onPress={() => openActivity(activity.assessment)} />)}</View><View style={styles.tipCard}><View style={styles.tipIcon}><Icon name="bulb" size={21} color={COLORS.orange} /></View><View style={{ flex: 1 }}><Text style={styles.tipTitle}>Small steps count</Text><Text style={styles.tipCopy}>Finish each activity, then reach the score target to unlock the next level.</Text></View></View></>}
      <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelectedLevelId(null)}><Text style={styles.secondaryButtonText}>Back to adventure map</Text></TouchableOpacity>
    </ScrollView>{celebration && <CelebrationOverlay title={celebration.title} xp={celebration.xp} onDone={() => setCelebration(null)} />}</SafeAreaView>;
  }

  const completionPercent = allLevels.length ? Math.round((completedLevels / allLevels.length) * 100) : 0;
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.topbar}><View style={styles.avatar}><Text style={styles.avatarText}>{(user?.firstName?.[0] || "L").toUpperCase()}</Text></View><View style={styles.welcomeCopy}><Text style={styles.welcomeMuted}>WELCOME BACK</Text><Text style={styles.welcomeName}>{user?.firstName || "Learner"}</Text></View><View style={styles.topbarActions}><View style={styles.xpPill}><Icon name="flash" size={15} color={COLORS.orange} /><Text style={styles.xpText}>{displayXp.toLocaleString()}</Text></View><TouchableOpacity style={styles.menuButton} onPress={() => logout()}><Icon name="log-out-outline" size={18} color={COLORS.ink} /></TouchableOpacity></View></View>
    <View style={styles.heroCard}><View style={styles.heroCopy}><View style={styles.streakPill}><Icon name="flame" size={14} color="#FF8B4D" /><Text style={styles.streakText}>{streak} day streak</Text></View><Text style={styles.heroTitle}>Your next win is waiting.</Text><Text style={styles.heroBody}>{completedLevels === 0 ? "Start your first adventure and earn your first burst of XP." : `${completedLevels} checkpoint${completedLevels === 1 ? "" : "s"} cleared. Keep the momentum going.`}</Text><TouchableOpacity style={styles.heroButton} onPress={() => nextLevel && setSelectedLevelId(nextLevel.id)}><Text style={styles.heroButtonText}>{nextLevel ? "Continue journey" : "Replay journey"}</Text><Icon name="arrow-forward" size={16} color={COLORS.white} /></TouchableOpacity></View><View style={styles.heroArt}><View style={styles.artPlanet}><Icon name="rocket" size={43} color={COLORS.purple} /></View><View style={styles.artStar}><Icon name="sparkles" size={15} color={COLORS.orange} /></View><View style={styles.artOrbit} /></View></View>
    <View style={styles.statRow}><View style={styles.statCard}><Text style={styles.statValue}>{completedLevels}/{Math.max(allLevels.length, 1)}</Text><Text style={styles.statLabel}>LEVELS CLEARED</Text></View><View style={styles.statCard}><Text style={[styles.statValue, { color: COLORS.orange }]}>{streak}</Text><Text style={styles.statLabel}>DAY STREAK</Text></View><View style={styles.statCard}><Text style={[styles.statValue, { color: COLORS.purple }]}>{completionPercent}%</Text><Text style={styles.statLabel}>MAP COMPLETE</Text></View></View>
    <View style={styles.sectionHeading}><View><Text style={styles.sectionKicker}>WORLD MAP</Text><Text style={styles.sectionTitle}>Choose your adventure</Text></View><View style={styles.mapLegend}><View style={[styles.legendDot, { backgroundColor: COLORS.green }]} /><Text style={styles.legendText}>cleared</Text></View></View>
    {loading ? <View style={styles.loadingCard}><ActivityIndicator color={COLORS.purple} /><Text style={styles.loadingText}>Syncing your adventure...</Text></View> : path.chapters.map((chapter) => <MapChapter key={chapter.id} chapter={chapter} nextLevel={nextLevel} onSelect={setSelectedLevelId} />)}
    <TouchableOpacity style={styles.coachCard} onPress={() => onOpenAiTutor?.()} activeOpacity={0.85}><View style={styles.coachIcon}><Icon name="bulb" size={22} color={COLORS.purple} /></View><View style={{ flex: 1 }}><Text style={styles.coachTitle}>Need a hint?</Text><Text style={styles.coachCopy}>Ask your learning coach before you spend a life.</Text></View><Icon name="arrow-forward" size={18} color={COLORS.purple} /></TouchableOpacity>
  </ScrollView>{celebration && <CelebrationOverlay title={celebration.title} xp={celebration.xp} onDone={() => setCelebration(null)} />}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.canvas },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34, gap: 14 },
  topbar: { flexDirection: "row", alignItems: "center", gap: 10 }, avatar: { width: 42, height: 42, borderRadius: 16, backgroundColor: COLORS.yellow, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: COLORS.white }, avatarText: { color: COLORS.ink, fontSize: 18, fontWeight: "900" }, welcomeCopy: { flex: 1 }, welcomeMuted: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 }, welcomeName: { color: COLORS.ink, fontSize: 17, fontWeight: "900", marginTop: 2 }, topbarActions: { flexDirection: "row", alignItems: "center", gap: 7 }, xpPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 16, shadowColor: "#C7D2E5", shadowOpacity: 0.4, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 }, xpText: { color: COLORS.ink, fontSize: 12, fontWeight: "900" }, menuButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  heroCard: { minHeight: 225, borderRadius: 30, backgroundColor: COLORS.purple, padding: 22, overflow: "hidden", flexDirection: "row" }, heroCopy: { flex: 1, zIndex: 2 }, streakPill: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12 }, streakText: { color: COLORS.white, fontWeight: "800", fontSize: 10 }, heroTitle: { color: COLORS.white, fontWeight: "900", fontSize: 29, lineHeight: 32, letterSpacing: -0.6, marginTop: 16, maxWidth: 210 }, heroBody: { color: "rgba(255,255,255,0.78)", fontSize: 11, lineHeight: 17, marginTop: 9, maxWidth: 190 }, heroButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: COLORS.ink, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 15, marginTop: 17 }, heroButtonText: { color: COLORS.white, fontSize: 11, fontWeight: "900" }, heroArt: { width: 108, alignItems: "center", justifyContent: "center", position: "relative" }, artPlanet: { width: 74, height: 74, borderRadius: 37, backgroundColor: "#F1F4FF", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-12deg" }] }, artOrbit: { position: "absolute", width: 126, height: 42, borderRadius: 50, borderWidth: 2, borderColor: "rgba(255,255,255,0.42)", transform: [{ rotate: "-28deg" }] }, artStar: { position: "absolute", right: 3, top: 30, width: 29, height: 29, borderRadius: 10, backgroundColor: COLORS.yellow, alignItems: "center", justifyContent: "center" },
  statRow: { flexDirection: "row", gap: 9 }, statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 18, padding: 13, minHeight: 70, justifyContent: "center" }, statValue: { color: COLORS.blue, fontSize: 18, fontWeight: "900" }, statLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "800", letterSpacing: 0.45, marginTop: 4 }, sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 5 }, sectionKicker: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 }, sectionTitle: { color: COLORS.ink, fontSize: 21, fontWeight: "900", marginTop: 3 }, mapLegend: { flexDirection: "row", alignItems: "center", gap: 5, paddingBottom: 3 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendText: { color: COLORS.muted, fontSize: 9, fontWeight: "700" }, loadingCard: { height: 120, backgroundColor: COLORS.white, borderRadius: 22, justifyContent: "center", alignItems: "center", gap: 9 }, loadingText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  chapterCard: { backgroundColor: COLORS.white, borderRadius: 27, overflow: "hidden", shadowColor: "#C9D4E7", shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, chapterHeader: { padding: 17, flexDirection: "row", alignItems: "center", gap: 12 }, chapterIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.23)", alignItems: "center", justifyContent: "center" }, chapterKicker: { color: "rgba(255,255,255,0.75)", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 }, chapterTitle: { color: COLORS.white, fontSize: 21, fontWeight: "900", marginTop: 2 }, chapterSubtitle: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "700", marginTop: 2 }, chapterDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 16, paddingHorizontal: 18, paddingBottom: 17 }, mapBoard: { minHeight: 242, backgroundColor: "#EAF3FF", margin: 12, borderRadius: 21, overflow: "hidden", paddingVertical: 15 }, mapLabel: { color: "#A5B5CD", fontSize: 8, fontWeight: "900", letterSpacing: 1.3, alignSelf: "center", marginBottom: 5 }, mapIsland: { position: "absolute", borderRadius: 50, opacity: 0.8 }, islandOne: { width: 90, height: 28, backgroundColor: "#C8EABF", top: 44, left: -20, transform: [{ rotate: "-18deg" }] }, islandTwo: { width: 76, height: 24, backgroundColor: "#D7C9F5", top: 138, right: -13, transform: [{ rotate: "19deg" }] }, islandThree: { width: 52, height: 20, backgroundColor: "#C5E7EF", bottom: 20, left: 16, transform: [{ rotate: "8deg" }] }, mapRow: { height: 106, justifyContent: "center", position: "relative" }, nodeLeft: { alignSelf: "flex-start", marginLeft: 21 }, nodeRight: { alignSelf: "flex-end", marginRight: 21 }, trailLine: { position: "absolute", height: 48, width: "46%", borderColor: "#B9C9DF", borderStyle: "dashed", borderWidth: 2, borderTopWidth: 0, bottom: -26 }, trailLineLeft: { left: "27%", borderLeftWidth: 2, borderBottomLeftRadius: 30 }, trailLineRight: { right: "27%", borderRightWidth: 2, borderBottomRightRadius: 30 }, levelNode: { width: 128, alignItems: "center" }, levelNodeStage: { width: 96, height: 78, alignItems: "center", justifyContent: "center" }, nodeHalo: { position: "absolute", width: 79, height: 79, borderRadius: 28, opacity: 0.25 }, nodeCircle: { width: 67, height: 67, borderRadius: 25, borderWidth: 4, borderColor: COLORS.white, alignItems: "center", justifyContent: "center", shadowColor: "#B7C6DB", shadowOpacity: 0.65, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 4 }, xpBadge: { position: "absolute", right: -15, top: -2, backgroundColor: COLORS.white, borderWidth: 1.5, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9 }, xpBadgeText: { color: COLORS.ink, fontSize: 8, fontWeight: "900" }, levelTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "900", marginTop: 7, textAlign: "center" }, levelStatus: { color: COLORS.muted, fontSize: 9, fontWeight: "700", marginTop: 3 }, nextText: { color: COLORS.purple, fontWeight: "900" }, lockedText: { color: "#AAB4C5" },
  coachCard: { backgroundColor: "#FFF7DA", borderRadius: 22, padding: 15, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#FFE9A4" }, coachIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center" }, coachTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "900" }, coachCopy: { color: COLORS.muted, fontSize: 10, marginTop: 3 }, bottomNav: { backgroundColor: COLORS.white, borderRadius: 22, padding: 7, flexDirection: "row", justifyContent: "space-between", marginTop: 3 }, navItem: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 16 }, navItemActive: { backgroundColor: COLORS.ink }, navItemText: { color: COLORS.muted, fontSize: 9, fontWeight: "800" }, navItemActiveText: { color: COLORS.white, fontSize: 9, fontWeight: "800" },
  detailTopbar: { flexDirection: "row", alignItems: "center", gap: 10 }, backButton: { width: 38, height: 38, backgroundColor: COLORS.white, borderRadius: 14, alignItems: "center", justifyContent: "center" }, breadcrumb: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center" }, breadcrumbText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" }, breadcrumbCurrent: { color: COLORS.ink, fontSize: 11, fontWeight: "900" }, xpMini: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 13 }, xpMiniText: { color: COLORS.ink, fontSize: 11, fontWeight: "900" }, levelHero: { borderRadius: 28, padding: 22, overflow: "hidden" }, heroOrb: { width: 62, height: 62, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 16 }, detailEyebrow: { color: "rgba(255,255,255,0.78)", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 }, detailTitle: { color: COLORS.white, fontSize: 30, fontWeight: "900", marginTop: 5 }, detailSubtitle: { color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 18, marginTop: 8 }, detailProgressTrack: { height: 8, backgroundColor: "rgba(255,255,255,0.27)", borderRadius: 4, marginTop: 20, overflow: "hidden" }, detailProgressFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.white }, detailProgressLabel: { color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: "700", marginTop: 7 }, scorePill: { backgroundColor: COLORS.ink, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 7 }, scorePillText: { color: COLORS.white, fontSize: 11, fontWeight: "900" }, activityList: { gap: 10 }, activityCard: { backgroundColor: COLORS.white, borderRadius: 21, padding: 13, flexDirection: "row", alignItems: "center", gap: 11 }, activityIcon: { width: 44, height: 44, borderRadius: 15, justifyContent: "center", alignItems: "center" }, activityCopy: { flex: 1 }, activityType: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 }, activityTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "900", marginTop: 3 }, activityMeta: { color: COLORS.muted, fontSize: 9, fontWeight: "600", marginTop: 4 }, activityArrow: { width: 31, height: 31, borderRadius: 12, backgroundColor: COLORS.ink, justifyContent: "center", alignItems: "center" }, activityArrowDone: { backgroundColor: COLORS.green }, lockedPanel: { backgroundColor: COLORS.white, borderRadius: 23, alignItems: "center", padding: 28 }, lockedIcon: { width: 58, height: 58, borderRadius: 21, backgroundColor: "#EFF3F8", alignItems: "center", justifyContent: "center" }, lockedPanelTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900", marginTop: 12 }, lockedPanelCopy: { color: COLORS.muted, fontSize: 11, textAlign: "center", marginTop: 5, lineHeight: 16 }, tipCard: { backgroundColor: "#E8F8FF", borderRadius: 20, padding: 15, flexDirection: "row", gap: 11, alignItems: "center" }, tipIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" }, tipTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "900" }, tipCopy: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 2 }, secondaryButton: { borderWidth: 1, borderColor: "#D8E0EE", borderRadius: 17, paddingVertical: 13, alignItems: "center" }, secondaryButtonText: { color: COLORS.ink, fontSize: 11, fontWeight: "900" },
  celebrationOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(32,37,61,0.58)", alignItems: "center", justifyContent: "center", padding: 30 }, confetti: { position: "absolute", width: 10, height: 18, borderRadius: 3 }, celebrationCard: { backgroundColor: COLORS.white, borderRadius: 30, padding: 28, alignItems: "center", width: "100%", maxWidth: 320, shadowColor: "#0B1533", shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 }, celebrationIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#FFF4CF", alignItems: "center", justifyContent: "center" }, celebrationKicker: { color: COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 2, marginTop: 13 }, celebrationTitle: { color: COLORS.ink, fontSize: 24, fontWeight: "900", marginTop: 4, textAlign: "center" }, celebrationXp: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF6D9", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 9, marginTop: 14 }, celebrationXpText: { color: COLORS.ink, fontSize: 16, fontWeight: "900" }, celebrationCopy: { color: COLORS.muted, fontSize: 11, textAlign: "center", marginTop: 12, lineHeight: 16 },
});
