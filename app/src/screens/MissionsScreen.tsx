import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
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
  softPurple: "#F0EEFF",
  softBlue: "#E8F7FF",
  softOrange: "#FFF1E9",
};

type NatureTheme = {
  sky: string;
  meadow: string;
  hill: string;
  hillBack: string;
  water: string;
  sun: string;
  border: string;
};

const NATURE_THEMES: NatureTheme[] = [
  { sky: "#EFFAFF", meadow: "#E4F5D9", hill: "#B9DFA6", hillBack: "#D1EBC3", water: "#B8E7F0", sun: "#FFE39B", border: "#D5EADC" },
  { sky: "#F7F0FF", meadow: "#E9DDF4", hill: "#C7A7D9", hillBack: "#E0CDEB", water: "#C4D9F3", sun: "#FFD6A0", border: "#E4D8EF" },
  { sky: "#FFF7EA", meadow: "#F3E6C4", hill: "#D6C07D", hillBack: "#E9D9A6", water: "#B9DFE8", sun: "#FFD27A", border: "#EDE0BE" },
  { sky: "#EAF9F7", meadow: "#D3EEE6", hill: "#8FCBB7", hillBack: "#B8E2D5", water: "#A6DDEC", sun: "#FFE19C", border: "#CBE9DF" },
];

function natureTheme(index: number) {
  return NATURE_THEMES[index % NATURE_THEMES.length];
}

function NatureBackdrop({ theme }: { theme: NatureTheme }) {
  return (
    <View pointerEvents="none" style={styles.natureBackdrop}>
      <View style={[styles.natureSun, { backgroundColor: theme.sun }]} />
      <View style={[styles.natureCloud, styles.natureCloudOne]} />
      <View style={[styles.natureCloud, styles.natureCloudTwo]} />
      <View style={[styles.natureHillBack, { backgroundColor: theme.hillBack }]} />
      <View style={[styles.natureHill, { backgroundColor: theme.hill }]} />
      <View style={[styles.natureWater, { backgroundColor: theme.water }]} />
      <View style={[styles.natureMeadow, { backgroundColor: theme.meadow }]} />
    </View>
  );
}

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
  flame: "flame-outline",
  flash: "flash-outline",
  star: "star",
  map: "map-outline",
  book: "book-outline",
  gift: "gift-outline",
  timer: "time-outline",
  play: "play",
  check: "checkmark",
  "check-circle": "checkmark-circle",
  "arrow-forward": "arrow-forward",
  "arrow-back": "arrow-back",
  "chevron-forward": "chevron-forward",
};

function Icon({
  name,
  size = 20,
  color = COLORS.ink,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={(ICONS[name] || name) as any} size={size} color={color} />;
}

function fallbackAssessment(
  id: string,
  title: string,
  type: "QUIZ" | "WORKSHEET",
): AssessmentDTO {
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
  const baseLevels = [
    {
      id: "demo-level-1",
      key: "complexity-quest",
      title: "Complexity Quest",
      subtitle: "Read the hidden cost",
      description: "Spot Big-O patterns and make smart choices before the timer runs out.",
      icon: "compass",
      color: COLORS.blue,
      orderIndex: 1,
      xpReward: 120,
      passPercent: 70,
      status: "UNLOCKED" as const,
      bestPercent: 0,
      xpAwarded: 0,
      activities: [activity("demo-asm-1", "Algorithm Complexity Quiz", "QUIZ", 1), activity("demo-asm-4", "Logic Worksheet", "WORKSHEET", 2)],
    },
    {
      id: "demo-level-2",
      key: "systems-station",
      title: "Systems Station",
      subtitle: "Keep the machine moving",
      description: "Explore processes, memory, and the choices that keep systems reliable.",
      icon: "hardware",
      color: COLORS.orange,
      orderIndex: 2,
      xpReward: 150,
      passPercent: 70,
      status: "LOCKED" as const,
      bestPercent: 0,
      xpAwarded: 0,
      activities: [activity("demo-asm-2", "Systems Quiz", "QUIZ", 1), activity("demo-asm-5", "Build Lab Worksheet", "WORKSHEET", 2)],
    },
  ];
  return {
    student: { id: "demo", userId: "demo", name: "Learner" },
    chapters: [
      {
        id: "demo-chapter-1",
        key: "algorithm-academy",
        title: "Algorithm Academy",
        subtitle: "Train your logic muscles",
        description: "Build the foundations of algorithms, complexity, and problem solving.",
        icon: "layers",
        color: COLORS.purple,
        orderIndex: 1,
        levels: baseLevels,
      },
      {
        id: "demo-chapter-2",
        key: "builder-bay",
        title: "Builder Bay",
        subtitle: "Turn ideas into code",
        description: "Practice object thinking and ship solutions that hold together.",
        icon: "cube",
        color: COLORS.pink,
        orderIndex: 2,
        levels: [
          { ...baseLevels[0], id: "demo-level-3", title: "Object Town", status: "LOCKED" as const, color: COLORS.yellow, icon: "cube" },
          { ...baseLevels[1], id: "demo-level-4", title: "Branching Grove", status: "LOCKED" as const, color: COLORS.green, icon: "git" },
        ],
      },
      {
        id: "demo-chapter-3",
        key: "data-dock",
        title: "Data Dock",
        subtitle: "Organize the moving parts",
        description: "Choose, trace, and repair the structures behind reliable programs.",
        icon: "database",
        color: COLORS.blue,
        orderIndex: 3,
        levels: [
          { ...baseLevels[0], id: "demo-level-5", title: "Structure Harbor", status: "LOCKED" as const, color: COLORS.green, icon: "layers" },
          { ...baseLevels[1], id: "demo-level-6", title: "Debugger Den", status: "LOCKED" as const, color: COLORS.orange, icon: "bulb" },
        ],
      },
    ],
  };
}

function ProgressBar({ percent, color, height = 8 }: { percent: number; color: string; height?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.max(0, Math.min(100, percent)),
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);
  const width = progress.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.progressFill, { width, height, borderRadius: height / 2, backgroundColor: color }]} />
    </View>
  );
}

function MissionNode({
  level,
  isNext,
  chapterColor,
  onPress,
}: {
  level: LearningLevelDTO;
  isNext: boolean;
  chapterColor: string;
  onPress: () => void;
}) {
  const locked = level.status === "LOCKED";
  const complete = level.status === "COMPLETED";
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isNext) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.spring(pulse, { toValue: 1.08, stiffness: 170, damping: 11, mass: 0.7, useNativeDriver: true }),
        Animated.spring(pulse, { toValue: 1, stiffness: 210, damping: 14, mass: 0.7, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isNext]);
  const nodeColor = locked ? "#C9D2E0" : complete ? COLORS.green : level.color || chapterColor;
  return (
    <TouchableOpacity disabled={locked} onPress={onPress} activeOpacity={0.82} accessibilityRole="button">
      <Animated.View style={[styles.nodeCircle, { backgroundColor: nodeColor, transform: [{ scale: pulse }] }, isNext && styles.nodeCircleNext]}>
        <Icon name={locked ? "lock" : complete ? "check-circle" : level.icon} size={24} color={COLORS.white} />
      </Animated.View>
      {!locked && (
        <View style={[styles.xpBadge, { backgroundColor: nodeColor }]}>
          <Text style={styles.xpBadgeText}>{level.xpReward} XP</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function LevelInfo({ level, isNext, chapterColor }: { level: LearningLevelDTO; isNext: boolean; chapterColor: string }) {
  const locked = level.status === "LOCKED";
  const complete = level.status === "COMPLETED";
  const accent = locked ? COLORS.muted : complete ? COLORS.green : level.color || chapterColor;
  return (
    <View style={[styles.levelInfo, locked && styles.levelInfoLocked]}>
      <View style={styles.levelInfoTop}>
        <Text style={[styles.levelNumber, { color: accent }]}>LEVEL {level.orderIndex}</Text>
        {isNext && <View style={[styles.nextPill, { backgroundColor: accent }]}><Text style={styles.nextPillText}>NEXT</Text></View>}
        {complete && <Icon name="check-circle" size={15} color={COLORS.green} />}
      </View>
      <Text style={[styles.levelTitle, locked && styles.levelTitleLocked]} numberOfLines={1}>{level.title}</Text>
      <Text style={styles.levelSubtitle} numberOfLines={1}>{level.subtitle}</Text>
      <Text style={styles.levelMetaText}>{locked ? "Locked" : `${level.xpReward} XP`}</Text>
    </View>
  );
}

function JourneyChapter({
  chapter,
  nextLevel,
  onSelectLevel,
  index,
}: {
  chapter: LearningChapterDTO;
  nextLevel?: LearningLevelDTO;
  onSelectLevel: (id: string) => void;
  index: number;
}) {
  const completed = chapter.levels.filter((level) => level.status === "COMPLETED").length;
  const percent = chapter.levels.length ? Math.round((completed / chapter.levels.length) * 100) : 0;
  const theme = natureTheme(index);
  return (
    <View style={[styles.chapterCard, { backgroundColor: theme.sky, borderColor: theme.border }]}>
      <NatureBackdrop theme={theme} />
      <View style={styles.chapterHeader}>
        <View style={[styles.chapterIcon, { backgroundColor: `${chapter.color}18` }]}>
          <Icon name={chapter.icon} size={22} color={chapter.color} />
        </View>
        <View style={styles.chapterHeaderCopy}>
          <Text style={styles.chapterEyebrow}>CHAPTER {chapter.orderIndex}</Text>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
        </View>
        <View style={styles.chapterPercent}>
          <Text style={[styles.chapterPercentValue, { color: chapter.color }]}>{percent}%</Text>
          <Text style={styles.chapterPercentLabel}>done</Text>
        </View>
      </View>
      <ProgressBar percent={percent} color={chapter.color} height={7} />
      <View style={styles.chapterProgressMeta}>
        <Text style={styles.chapterProgressText}>{completed}/{chapter.levels.length} cleared</Text>
        <Text style={styles.chapterProgressText}>{index === 0 ? "Begin here" : "Next area"}</Text>
      </View>

      <View style={styles.journeyRail}>
        <View style={[styles.railLine, { backgroundColor: `${chapter.color}35` }]} />
        {chapter.levels.map((level, levelIndex) => {
          const isNext = nextLevel?.id === level.id;
          const onLeft = levelIndex % 2 === 0;
          return (
            <View key={level.id} style={[styles.levelRow, onLeft ? styles.levelRowLeft : styles.levelRowRight]}>
              {onLeft ? <MissionNode level={level} isNext={isNext} chapterColor={chapter.color} onPress={() => onSelectLevel(level.id)} /> : <LevelInfo level={level} isNext={isNext} chapterColor={chapter.color} />}
              {onLeft ? <LevelInfo level={level} isNext={isNext} chapterColor={chapter.color} /> : <MissionNode level={level} isNext={isNext} chapterColor={chapter.color} onPress={() => onSelectLevel(level.id)} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ActivityCard({ activity, accent, onPress }: { activity: any; accent: string; onPress: () => void }) {
  const complete = activity.progress.completed;
  const quiz = activity.type === "QUIZ";
  return (
    <TouchableOpacity style={styles.activityCard} onPress={onPress} activeOpacity={0.84}>
      <View style={[styles.activityIcon, { backgroundColor: complete ? `${COLORS.green}18` : `${accent}18` }]}>
        <Icon name={complete ? "check-circle" : quiz ? "quiz" : "worksheet"} size={21} color={complete ? COLORS.green : accent} />
      </View>
      <View style={styles.activityCopy}>
        <Text style={styles.activityType}>{complete ? "COMPLETED" : quiz ? "QUIZ" : "ASSIGNMENT"}</Text>
        <Text style={styles.activityTitle} numberOfLines={2}>{activity.assessment.title}</Text>
        <View style={styles.activityMeta}>
          <Icon name="timer" size={12} color={COLORS.muted} />
          <Text style={styles.activityMetaText}>{complete ? `${activity.progress.score}% score` : `${activity.assessment.durationMinutes} min`}</Text>
        </View>
      </View>
      <View style={[styles.activityArrow, { backgroundColor: complete ? COLORS.green : accent }]}>
        <Icon name={complete ? "check" : "arrow-forward"} size={15} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  );
}

function LevelDetail({
  level,
  chapter,
  onBack,
  onOpenAssessment,
}: {
  level: LearningLevelDTO;
  chapter?: LearningChapterDTO;
  onBack: () => void;
  onOpenAssessment: (assessment: AssessmentDTO) => void;
}) {
  const locked = level.status === "LOCKED";
  const completed = level.activities.filter((activity) => activity.progress.completed).length;
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, stiffness: 180, damping: 20, mass: 0.8, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
        <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.detailTopbar}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Back to missions">
              <Icon name="arrow-back" size={19} color={COLORS.ink} />
            </TouchableOpacity>
            <View style={styles.detailBreadcrumb}>
              <Text style={styles.detailKicker}>{chapter?.title || "Missions"}</Text>
              <Text style={styles.detailHeading}>Level {level.orderIndex} journey</Text>
            </View>
            <View style={styles.detailReward}><Icon name="flash" size={14} color={COLORS.orange} /><Text style={styles.detailRewardText}>{level.xpReward}</Text></View>
          </View>
          <View style={[styles.detailHero, { backgroundColor: level.color || COLORS.purple }]}>
            <View style={styles.detailHeroOrb}><Icon name={level.icon} size={34} color={COLORS.white} /></View>
            <Text style={styles.detailHeroEyebrow}>CHECKPOINT {level.orderIndex} · {level.xpReward} XP</Text>
            <Text style={styles.detailHeroTitle}>{level.title}</Text>
            <Text style={styles.detailHeroBody}>{level.description}</Text>
            <View style={styles.detailProgressMeta}><Text style={styles.detailProgressLabel}>{level.bestPercent}% mastered</Text><Text style={styles.detailProgressLabel}>{level.passPercent}% to pass</Text></View>
            <ProgressBar percent={level.bestPercent} color="rgba(255,255,255,0.92)" height={8} />
          </View>
          {locked ? (
            <View style={styles.lockedCard}>
              <View style={styles.lockedIcon}><Icon name="lock" size={25} color={COLORS.muted} /></View>
              <Text style={styles.lockedTitle}>This checkpoint is waiting</Text>
              <Text style={styles.lockedBody}>Clear the previous checkpoint to open this part of your learning journey.</Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <View><Text style={styles.sectionKicker}>YOUR CHECKPOINTS</Text><Text style={styles.sectionTitle}>Choose your next move</Text></View>
                <View style={styles.scorePill}><Text style={styles.scorePillText}>{completed}/{level.activities.length}</Text></View>
              </View>
              <View style={styles.activityList}>
                {level.activities.map((activity) => <ActivityCard key={activity.id} activity={activity} accent={level.color || COLORS.purple} onPress={() => onOpenAssessment(activity.assessment)} />)}
              </View>
              <View style={styles.tipCard}>
                <View style={styles.tipIcon}><Icon name="bulb" size={20} color={COLORS.orange} /></View>
                <View style={{ flex: 1 }}><Text style={styles.tipTitle}>A little progress compounds</Text><Text style={styles.tipBody}>Finish each activity and reach the score target to unlock the next chapter.</Text></View>
              </View>
            </>
          )}
          <TouchableOpacity style={styles.secondaryButton} onPress={onBack}><Text style={styles.secondaryButtonText}>Back to journey</Text><Icon name="map" size={16} color={COLORS.purple} /></TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

export interface MissionsScreenProps {
  onOpenAssessment?: (assessmentId?: string) => void;
}

export function MissionsScreen({ onOpenAssessment }: MissionsScreenProps) {
  const { user, apiClient } = useAuth();
  const [path, setPath] = useState<LearningPathDTO>(() => fallbackPath());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  const loadPath = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const nextPath = await apiClient.getLearningPath();
      if (nextPath?.chapters?.length) setPath(nextPath);
    } catch {
      // The local journey remains available while the API reconnects.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadPath(); }, [apiClient, user?.id]);
  useEffect(() => apiClient.subscribeSync(SyncEventType.LEVEL_PROGRESS_UPDATED, () => loadPath()), [apiClient]);

  const levels = useMemo(() => path.chapters.flatMap((chapter) => chapter.levels), [path]);
  const completedLevels = levels.filter((level) => level.status === "COMPLETED").length;
  const nextLevel = levels.find((level) => level.status === "UNLOCKED" || level.status === "IN_PROGRESS");
  const percent = levels.length ? Math.round((completedLevels / levels.length) * 100) : 0;
  const selectedLevel = levels.find((level) => level.id === selectedLevelId);
  const selectedChapter = path.chapters.find((chapter) => chapter.levels.some((level) => level.id === selectedLevelId));

  if (selectedLevel) {
    return <LevelDetail level={selectedLevel} chapter={selectedChapter} onBack={() => setSelectedLevelId(null)} onOpenAssessment={(assessment) => onOpenAssessment?.(assessment.id)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPath(true)} tintColor={COLORS.purple} colors={[COLORS.purple]} />}
      >
        <View style={styles.topbar}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.firstName?.[0] || "L").toUpperCase()}</Text></View>
          <View style={styles.topbarCopy}><Text style={styles.topbarKicker}>MISSIONS</Text><Text style={styles.topbarTitle}>Learning journey</Text></View>
          <View style={styles.xpPill}><Icon name="flash" size={14} color={COLORS.orange} /><Text style={styles.xpText}>{completedLevels} cleared</Text></View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}><View><Text style={styles.sectionKicker}>JOURNEY PROGRESS</Text><Text style={styles.summaryTitle}>{percent}% explored</Text></View><Text style={styles.summaryCount}>{completedLevels}/{Math.max(levels.length, 1)}</Text></View>
          <ProgressBar percent={percent} color={COLORS.purple} height={9} />
          <View style={styles.summaryFooter}><Text style={styles.summaryFooterText}>{completedLevels} cleared</Text><Text style={styles.summaryFooterText}>{levels.length - completedLevels} ahead</Text></View>
        </View>

        <View style={styles.sectionHeading}><View><Text style={styles.sectionKicker}>JOURNEY MAP</Text><Text style={styles.sectionTitle}>Follow your trail</Text></View><View style={styles.liveChip}><View style={styles.liveDot} /><Text style={styles.liveText}>SYNCED</Text></View></View>

        {loading ? (
          <View style={styles.loadingCard}><ActivityIndicator color={COLORS.purple} /><Text style={styles.loadingText}>Syncing your journey...</Text></View>
        ) : (
          path.chapters.map((chapter, index) => <JourneyChapter key={chapter.id} chapter={chapter} nextLevel={nextLevel} onSelectLevel={setSelectedLevelId} index={index} />)
        )}

        <View style={styles.endCard}><View style={styles.endIcon}><Icon name="sparkles" size={22} color={COLORS.yellow} /></View><Text style={styles.endTitle}>The trail keeps growing</Text><Text style={styles.endBody}>New chapters and challenges will appear here as you progress.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.canvas },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, gap: 14 },
  topbar: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 16, backgroundColor: COLORS.yellow, borderWidth: 3, borderColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.ink, fontSize: 18, fontWeight: "900" },
  topbarCopy: { flex: 1 },
  topbarKicker: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  topbarTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900", marginTop: 2 },
  xpPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 16, shadowColor: "#C7D2E5", shadowOpacity: 0.36, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  xpText: { color: COLORS.ink, fontSize: 11, fontWeight: "900" },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 21, padding: 15, borderWidth: 1, borderColor: COLORS.line },
  summaryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
  summaryTitle: { color: COLORS.ink, fontSize: 15, fontWeight: "900", marginTop: 3 },
  summaryCount: { color: COLORS.purple, fontSize: 20, fontWeight: "900" },
  summaryFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  summaryFooterText: { color: COLORS.muted, fontSize: 9, fontWeight: "700" },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 },
  sectionKicker: { color: COLORS.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  sectionTitle: { color: COLORS.ink, fontSize: 21, fontWeight: "900", marginTop: 3 },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  liveText: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  chapterCard: { borderRadius: 26, padding: 16, borderWidth: 1, overflow: "hidden", shadowColor: "#C7D2E5", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  natureBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" },
  natureSun: { position: "absolute", width: 72, height: 72, borderRadius: 36, top: 13, right: 24, opacity: 0.55 },
  natureCloud: { position: "absolute", width: 62, height: 15, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.72)" },
  natureCloudOne: { top: 24, left: 40 },
  natureCloudTwo: { top: 50, right: 86, transform: [{ scale: 0.72 }] },
  natureHillBack: { position: "absolute", width: 260, height: 120, borderRadius: 130, bottom: -61, left: -28, opacity: 0.58 },
  natureHill: { position: "absolute", width: 230, height: 105, borderRadius: 120, bottom: -56, right: -34, opacity: 0.78 },
  natureWater: { position: "absolute", width: 150, height: 35, borderRadius: 75, bottom: 9, left: 10, opacity: 0.6, transform: [{ rotate: "-7deg" }] },
  natureMeadow: { position: "absolute", width: 170, height: 54, borderRadius: 85, bottom: -24, right: 36, opacity: 0.65 },
  chapterHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  chapterIcon: { width: 46, height: 46, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  chapterHeaderCopy: { flex: 1 },
  chapterEyebrow: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  chapterTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900", marginTop: 2 },
  chapterSubtitle: { color: COLORS.muted, fontSize: 10, fontWeight: "600", marginTop: 1 },
  chapterPercent: { alignItems: "flex-end" },
  chapterPercentValue: { fontSize: 20, fontWeight: "900" },
  chapterPercentLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "800" },
  progressTrack: { width: "100%", backgroundColor: "#ECF0F6", overflow: "hidden" },
  progressFill: { backgroundColor: COLORS.purple },
  chapterProgressMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  chapterProgressText: { color: COLORS.muted, fontSize: 9, fontWeight: "700" },
  journeyRail: { marginTop: 12, minHeight: 170, justifyContent: "space-around", position: "relative", paddingVertical: 5, gap: 10 },
  railLine: { position: "absolute", width: 4, top: 8, bottom: 8, left: "50%", marginLeft: -2, borderRadius: 2 },
  levelRow: { minHeight: 74, width: "100%", flexDirection: "row", alignItems: "center", gap: 10, zIndex: 1 },
  levelRowLeft: { justifyContent: "flex-start", paddingRight: 8 },
  levelRowRight: { justifyContent: "flex-end", paddingLeft: 8 },
  nodeCircle: { width: 58, height: 58, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: COLORS.white, shadowColor: "#B7C3D5", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  nodeCircleNext: { borderColor: "#E4DFFF", shadowColor: COLORS.purple, shadowOpacity: 0.35, shadowRadius: 14 },
  xpBadge: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, marginTop: -7, borderWidth: 2, borderColor: COLORS.white },
  xpBadgeText: { color: COLORS.white, fontSize: 8, fontWeight: "900" },
  levelInfo: { flex: 1, minHeight: 68, backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 16, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.8)" },
  levelInfoLocked: { opacity: 0.75 },
  levelInfoTop: { flexDirection: "row", alignItems: "center", gap: 5 },
  levelNumber: { fontSize: 8, fontWeight: "900", letterSpacing: 0.8, flex: 1 },
  nextPill: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  nextPillText: { color: COLORS.white, fontSize: 7, fontWeight: "900" },
  levelTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "900", marginTop: 3 },
  levelTitleLocked: { color: COLORS.muted },
  levelSubtitle: { color: COLORS.muted, fontSize: 9, fontWeight: "600", marginTop: 1 },
  levelMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
  levelMetaText: { color: COLORS.muted, fontSize: 8, fontWeight: "700" },
  loadingCard: { minHeight: 170, backgroundColor: COLORS.white, borderRadius: 24, alignItems: "center", justifyContent: "center", gap: 11, borderWidth: 1, borderColor: COLORS.line },
  loadingText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  endCard: { alignItems: "center", backgroundColor: COLORS.softPurple, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: "#E3DEFF" },
  endIcon: { width: 52, height: 52, borderRadius: 19, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  endTitle: { color: COLORS.ink, fontSize: 14, fontWeight: "900" },
  endBody: { color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 4, maxWidth: 230 },
  detailScroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, gap: 15 },
  detailTopbar: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { width: 40, height: 40, borderRadius: 15, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, alignItems: "center", justifyContent: "center" },
  detailBreadcrumb: { flex: 1 },
  detailKicker: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  detailHeading: { color: COLORS.ink, fontSize: 16, fontWeight: "900", marginTop: 2 },
  detailReward: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 13 },
  detailRewardText: { color: COLORS.ink, fontSize: 11, fontWeight: "900" },
  detailHero: { borderRadius: 27, padding: 21, overflow: "hidden" },
  detailHeroOrb: { width: 62, height: 62, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.24)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  detailHeroEyebrow: { color: "rgba(255,255,255,0.76)", fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  detailHeroTitle: { color: COLORS.white, fontSize: 27, fontWeight: "900", marginTop: 4 },
  detailHeroBody: { color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 18, marginTop: 6 },
  detailProgressMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, marginBottom: 6 },
  detailProgressLabel: { color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: "800" },
  lockedCard: { alignItems: "center", backgroundColor: COLORS.white, borderRadius: 23, padding: 27, borderWidth: 1, borderColor: COLORS.line },
  lockedIcon: { width: 58, height: 58, borderRadius: 21, backgroundColor: COLORS.canvas, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  lockedTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900" },
  lockedBody: { color: COLORS.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 6, maxWidth: 250 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  scorePill: { backgroundColor: COLORS.purple, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12 },
  scorePillText: { color: COLORS.white, fontSize: 11, fontWeight: "900" },
  activityList: { gap: 10 },
  activityCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: COLORS.white, padding: 13, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line },
  activityIcon: { width: 45, height: 45, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  activityCopy: { flex: 1 },
  activityType: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  activityTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "900", marginTop: 2 },
  activityMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  activityMetaText: { color: COLORS.muted, fontSize: 9, fontWeight: "700" },
  activityArrow: { width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tipCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.softOrange, borderRadius: 19, borderWidth: 1, borderColor: "#FFE0CB", padding: 14 },
  tipIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  tipTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "900" },
  tipBody: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  secondaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "#D9D3FF", backgroundColor: COLORS.softPurple, borderRadius: 16, paddingVertical: 13 },
  secondaryButtonText: { color: COLORS.purple, fontSize: 11, fontWeight: "900" },
});
