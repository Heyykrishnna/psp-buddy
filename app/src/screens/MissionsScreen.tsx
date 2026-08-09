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
  SyncEventType,
} from "../types";

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  ink: "#1A1F3D",
  muted: "#7D879F",
  white: "#FFFFFF",
  sky1: "#A8D8F0",
  sky2: "#C5E8FA",
  sky3: "#E8F5FD",
  blue: "#4DAADC",
  purple: "#6C5CE7",
  orange: "#E8803A",
  pink: "#D63384",
  yellow: "#F0B429",
  green: "#27AE60",
  teal: "#00B4D8",
  red: "#E74C3C",
};

// Chapter island themes — each chapter gets its own island color scheme
const ISLAND_THEMES = [
  { bg: "#A8D4A8", shadow: "#5A9E5A", accent: "#7CC47C", water: "#5BA3D9", label: "#2D6A2D" },
  { bg: "#C9A8E8", shadow: "#7A4FBF", accent: "#B080E0", water: "#6CB4F0", label: "#4A1E8A" },
  { bg: "#F0C080", shadow: "#B8862A", accent: "#E8B060", water: "#4DB8E8", label: "#7A4A10" },
  { bg: "#90D8E0", shadow: "#3A8A9E", accent: "#6ECFE0", water: "#3AACDA", label: "#1E5A6A" },
  { bg: "#F0A0B0", shadow: "#B84060", accent: "#E880A0", water: "#70C0E8", label: "#7A1A30" },
];

const ICON_MAP: Record<string, any> = {
  compass: "compass-outline", rocket: "rocket-outline", layers: "layers-outline",
  database: "server-outline", code: "code-slash-outline", hardware: "hardware-chip-outline",
  cube: "cube-outline", git: "git-branch-outline", bulb: "bulb-outline",
  lock: "lock-closed-outline", trophy: "trophy-outline", quiz: "help-circle-outline",
  worksheet: "document-text-outline", sparkles: "sparkles-outline", flame: "flame-outline",
  flash: "flash-outline", checkmark: "checkmark", star: "star",
  "arrow-back": "arrow-back", "arrow-forward": "arrow-forward",
  "chevron-forward": "chevron-forward", "chevron-down": "chevron-down-outline",
  "chevron-up": "chevron-up-outline", map: "map-outline",
};

function Ico({ name, size = 20, color = C.ink }: { name: string; size?: number; color?: string }) {
  return <Ionicons name={(ICON_MAP[name] || name) as any} size={size} color={color} />;
}

// ─── Fallback data ────────────────────────────────────────────────────────────
function fallbackPath(): LearningPathDTO {
  const fa = (id: string, title: string, type: "QUIZ" | "WORKSHEET", oi: number) => ({
    id: `${id}-${type.toLowerCase()}`, type, orderIndex: oi,
    assessment: { id, title, description: "A quick check", className: "1st Sem", topic: "Learning Path", assessmentType: (type === "QUIZ" ? "QUIZ" : "PRACTICE") as any, totalMarks: 10, passingMarks: 7, durationMinutes: 15, isPublished: true } as AssessmentDTO,
    progress: { assessmentId: id, type, score: 0, completed: false, source: "NONE" as const },
  });
  const lvls = [
    { id: "dl-1", key: "cq", title: "Complexity Quest", subtitle: "Read the hidden cost", description: "Spot Big-O patterns and make smart choices.", icon: "compass", color: C.purple, orderIndex: 1, xpReward: 120, passPercent: 70, status: "UNLOCKED" as const, bestPercent: 0, xpAwarded: 0, activities: [fa("da-1", "Algorithm Complexity Quiz", "QUIZ", 1), fa("da-4", "Logic Worksheet", "WORKSHEET", 2)] },
    { id: "dl-2", key: "ss", title: "Systems Station", subtitle: "Keep the machine moving", description: "Explore processes and memory.", icon: "hardware", color: C.orange, orderIndex: 2, xpReward: 150, passPercent: 70, status: "LOCKED" as const, bestPercent: 0, xpAwarded: 0, activities: [fa("da-2", "Systems Quiz", "QUIZ", 1)] },
    { id: "dl-3", key: "dq", title: "Data Quest", subtitle: "Sort the chaos", description: "Choose structures wisely.", icon: "database", color: C.teal, orderIndex: 3, xpReward: 130, passPercent: 70, status: "LOCKED" as const, bestPercent: 0, xpAwarded: 0, activities: [fa("da-3", "Data Structures Quiz", "QUIZ", 1)] },
  ];
  return {
    student: { id: "demo", userId: "demo", name: "Learner" },
    chapters: [
      { id: "dc-1", key: "algorithm-academy", title: "Algorithm Academy", subtitle: "Train your logic muscles", description: "Build foundations of algorithms, complexity, and problem solving.", icon: "layers", color: C.purple, orderIndex: 1, levels: lvls },
      { id: "dc-2", key: "builder-bay", title: "Builder Bay", subtitle: "Turn ideas into code", description: "Practice object thinking and ship solutions.", icon: "cube", color: C.orange, orderIndex: 2, levels: [{ ...lvls[0], id: "dl-4", title: "Object Town", status: "LOCKED" as const, color: C.yellow, icon: "cube" }, { ...lvls[1], id: "dl-5", title: "Branching Grove", status: "LOCKED" as const, color: C.green, icon: "git" }] },
      { id: "dc-3", key: "data-dock", title: "Data Dock", subtitle: "Organize the moving parts", description: "Practice choosing and tracing the structures behind reliable programs.", icon: "database", color: C.teal, orderIndex: 3, levels: [{ ...lvls[0], id: "dl-6", title: "Structure Harbor", status: "LOCKED" as const, color: C.teal, icon: "layers" }, { ...lvls[1], id: "dl-7", title: "Debugger Den", status: "LOCKED" as const, color: C.red, icon: "bulb" }] },
    ],
  };
}

// ─── Animated pulse glow ───────────────────────────────────────────────────────
function PulseGlow({ color, size }: { color: string; size: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  return (
    <Animated.View style={{
      position: "absolute", width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, transform: [{ scale }], opacity
    }} />
  );
}

// ─── Floating cloud decoration ─────────────────────────────────────────────────
function Cloud({ x, y, scale = 1, opacity = 0.7 }: { x: number; y: number; scale?: number; opacity?: number }) {
  return (
    <View style={{ position: "absolute", left: x, top: y, opacity, transform: [{ scale }] }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <View style={{ width: 32, height: 20, borderRadius: 16, backgroundColor: C.white }} />
        <View style={{ width: 46, height: 30, borderRadius: 23, backgroundColor: C.white, marginLeft: -12 }} />
        <View style={{ width: 32, height: 20, borderRadius: 16, backgroundColor: C.white, marginLeft: -10 }} />
      </View>
    </View>
  );
}

// ─── Island shape (floating) ───────────────────────────────────────────────────
function IslandShape({ theme, width = 160 }: { theme: typeof ISLAND_THEMES[number]; width?: number }) {
  const h = Math.round(width * 0.42);
  const sh = Math.round(width * 0.2);
  return (
    <View style={{ alignItems: "center" }}>
      {/* Island top surface */}
      <View style={{
        width, height: h, borderRadius: width * 0.3,
        backgroundColor: theme.bg,
        borderTopWidth: 4, borderColor: theme.accent,
        overflow: "hidden",
      }}>
        {/* Grass texture dots */}
        <View style={{ position: "absolute", top: 6, left: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent, opacity: 0.6 }} />
        <View style={{ position: "absolute", top: 4, right: 24, width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent, opacity: 0.5 }} />
        <View style={{ position: "absolute", top: 10, left: "45%", width: 10, height: 10, borderRadius: 5, backgroundColor: theme.accent, opacity: 0.4 }} />
        {/* Water stream */}
        <View style={{ position: "absolute", right: "20%", top: 0, width: 6, height: h, backgroundColor: theme.water, opacity: 0.3 }} />
      </View>
      {/* Island shadow / base */}
      <View style={{
        width: width * 0.75, height: sh, borderRadius: width * 0.2,
        backgroundColor: theme.shadow,
        marginTop: -6, opacity: 0.85,
      }} />
    </View>
  );
}

// ─── Level node on island ──────────────────────────────────────────────────────
function LevelNode({
  level, isNext, chapterColor, onPress, index,
}: {
  level: LearningLevelDTO; isNext: boolean; chapterColor: string; onPress: () => void; index: number;
}) {
  const locked = level.status === "LOCKED";
  const complete = level.status === "COMPLETED";
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNext) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isNext]);
  const btnScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  const bgColor = locked ? "#C5CDD8" : complete ? C.green : level.color;

  return (
    <View style={[
      ss.levelNodeWrap,
      index % 2 === 0 ? { alignSelf: "flex-start", marginLeft: 20 } : { alignSelf: "flex-end", marginRight: 20 },
    ]}>
      <TouchableOpacity disabled={locked} onPress={onPress} activeOpacity={0.82} style={{ alignItems: "center" }}>
        {/* Glow ring for active */}
        {isNext && !locked && (
          <View style={[ss.nodeGlowRing, { borderColor: level.color }]}>
            <PulseGlow color={level.color} size={70} />
          </View>
        )}
        {/* Node circle */}
        <Animated.View style={[
          ss.nodeCircle,
          { backgroundColor: bgColor },
          isNext && { transform: [{ scale: btnScale }] },
        ]}>
          <Ico
            name={locked ? "lock" : complete ? "trophy" : level.icon}
            size={22}
            color={C.white}
          />
        </Animated.View>
        {/* XP badge */}
        {!locked && (
          <View style={[ss.nodeXpBadge, { backgroundColor: bgColor }]}>
            <Ico name="flash" size={8} color={C.white} />
            <Text style={ss.nodeXpText}>{level.xpReward}</Text>
          </View>
        )}
        {/* Label */}
        <View style={[ss.nodeLabelBox, { borderColor: locked ? "#C5CDD8" : bgColor }]}>
          <Text style={[ss.nodeLabelText, { color: locked ? C.muted : bgColor }]} numberOfLines={1}>{level.title}</Text>
          {isNext && !locked && (
            <View style={[ss.upNextTag, { backgroundColor: level.color }]}>
              <Text style={ss.upNextText}>NEXT</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Chapter island card ───────────────────────────────────────────────────────
function ChapterIsland({
  chapter, nextLevel, onSelectLevel, themeIdx,
}: {
  chapter: LearningChapterDTO; nextLevel?: LearningLevelDTO; onSelectLevel: (id: string) => void; themeIdx: number;
}) {
  const theme = ISLAND_THEMES[themeIdx % ISLAND_THEMES.length];
  const completedCount = chapter.levels.filter((l) => l.status === "COMPLETED").length;
  const totalCount = chapter.levels.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={[ss.islandWrap, { marginLeft: themeIdx % 2 === 0 ? 0 : 28 }]}>
      {/* Chapter banner */}
      <View style={[ss.chapterBanner, { backgroundColor: chapter.color }]}>
        <View style={[ss.chapterBannerIcon, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
          <Ico name={chapter.icon} size={18} color={C.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ss.chapterKicker}>CHAPTER {chapter.orderIndex}</Text>
          <Text style={ss.chapterBannerTitle}>{chapter.title}</Text>
        </View>
        <View style={[ss.chapterProgressChip, { borderColor: "rgba(255,255,255,0.5)" }]}>
          <Text style={ss.chapterProgressText}>{pct}%</Text>
        </View>
      </View>

      {/* Island visual + level nodes */}
      <View style={ss.islandBody}>
        {/* Decorative island terrain */}
        <View style={ss.islandTerrain}>
          <IslandShape theme={theme} width={300} />
          {/* Island label */}
          <Text style={[ss.islandNameLabel, { color: theme.label }]}>{chapter.title.toUpperCase()}</Text>
        </View>

        {/* Level path nodes */}
        <View style={ss.levelPath}>
          {chapter.levels.map((level, idx) => (
            <View key={level.id} style={{ alignItems: "stretch" }}>
              {/* Winding path connector */}
              {idx > 0 && (
                <View style={[
                  ss.pathConnector,
                  idx % 2 === 0
                    ? { alignSelf: "flex-start", marginLeft: 52 }
                    : { alignSelf: "flex-end", marginRight: 52 },
                ]}>
                  {/* dashed vertical line */}
                  {[0, 1, 2, 3, 4].map((d) => (
                    <View
                      key={d}
                      style={{
                        width: 3, height: 8, borderRadius: 2, marginVertical: 2,
                        backgroundColor: level.status === "COMPLETED" ? chapter.color : "#B8C8DA",
                      }}
                    />
                  ))}
                </View>
              )}
              <LevelNode
                level={level}
                isNext={nextLevel?.id === level.id}
                chapterColor={chapter.color}
                onPress={() => onSelectLevel(level.id)}
                index={idx}
              />
            </View>
          ))}
        </View>

        {/* Chapter progress bar */}
        <View style={ss.chapterProgressBar}>
          <View style={[ss.chapterProgressFill, { width: `${pct}%`, backgroundColor: chapter.color }]} />
        </View>
        <Text style={ss.chapterProgressLabel}>{completedCount}/{totalCount} levels cleared</Text>
      </View>
    </View>
  );
}

// ─── Path connector between chapters ──────────────────────────────────────────
function ChapterConnector({ fromColor, toColor }: { fromColor: string; toColor: string }) {
  return (
    <View style={ss.chapterConnectorWrap}>
      <View style={ss.chapterConnectorRoad}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "center", marginVertical: 3 }}>
            <View style={[ss.chapterConnectorDot, { backgroundColor: i < 3 ? fromColor : toColor, opacity: 0.7 - i * 0.05 }]} />
          </View>
        ))}
      </View>
      <Text style={ss.chapterConnectorLabel}>→</Text>
    </View>
  );
}

// ─── Level detail overlay ──────────────────────────────────────────────────────
function LevelDetailView({
  level, chapter, onBack, onOpenAssessment,
}: {
  level: LearningLevelDTO; chapter?: LearningChapterDTO; onBack: () => void; onOpenAssessment: (asm: AssessmentDTO) => void;
}) {
  const locked = level.status === "LOCKED";
  const completedActs = level.activities.filter((a) => a.progress.completed).length;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[ss.safeArea, { backgroundColor: "#0D1B2E" }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView contentContainerStyle={ss.detailScroll} showsVerticalScrollIndicator={false}>
          {/* Topbar */}
          <View style={ss.detailTopbar}>
            <TouchableOpacity style={[ss.backBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]} onPress={onBack}>
              <Ico name="arrow-back" size={18} color={C.white} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[ss.breadcrumbChapter, { color: "rgba(255,255,255,0.6)" }]}>{chapter?.title || "Missions"}</Text>
              <Text style={[ss.breadcrumbLevel, { color: C.white }]}>Level {level.orderIndex} — {level.title}</Text>
            </View>
          </View>

          {/* Hero */}
          <View style={[ss.detailHero, { backgroundColor: level.color }]}>
            <View style={ss.heroOrbLarge}>
              <Ico name={level.icon} size={34} color={C.white} />
            </View>
            <Text style={ss.heroEyebrow}>LEVEL {level.orderIndex}  ·  {level.xpReward} XP</Text>
            <Text style={ss.heroTitle}>{level.title}</Text>
            <Text style={ss.heroSubtitle}>{level.description}</Text>
            <View style={ss.heroProgressRow}>
              <View style={ss.heroProgressTrack}>
                <View style={[ss.heroProgressFill, { width: `${level.bestPercent}%` }]} />
              </View>
              <Text style={ss.heroProgressLabel}>{level.bestPercent}% / {level.passPercent}% to pass</Text>
            </View>
          </View>

          {locked ? (
            <View style={[ss.lockedPanel, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
              <View style={[ss.lockedIcon, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                <Ico name="lock" size={28} color="rgba(255,255,255,0.5)" />
              </View>
              <Text style={[ss.lockedTitle, { color: C.white }]}>Level Locked</Text>
              <Text style={[ss.lockedBody, { color: "rgba(255,255,255,0.55)" }]}>Clear the previous level to unlock this checkpoint.</Text>
            </View>
          ) : (
            <>
              <View style={ss.sectionHeader}>
                <View>
                  <Text style={[ss.sectionKicker, { color: "rgba(255,255,255,0.5)" }]}>YOUR CHECKPOINTS</Text>
                  <Text style={[ss.sectionTitle, { color: C.white }]}>Clear the trail</Text>
                </View>
                <View style={[ss.scorePill, { backgroundColor: level.color }]}>
                  <Text style={ss.scorePillText}>{completedActs}/{level.activities.length}</Text>
                </View>
              </View>

              {level.activities.map((act) => {
                const done = act.progress.completed;
                const isQuiz = act.type === "QUIZ";
                return (
                  <TouchableOpacity key={act.id}
                    style={[ss.actCard, { backgroundColor: "rgba(255,255,255,0.08)" }]}
                    activeOpacity={0.85} onPress={() => onOpenAssessment(act.assessment)}>
                    <View style={[ss.actIcon, { backgroundColor: done ? C.green + "33" : isQuiz ? "#4DAADC33" : "#E8803A33" }]}>
                      <Ico name={isQuiz ? "quiz" : "worksheet"} size={19} color={done ? C.green : isQuiz ? C.blue : C.orange} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[ss.actType, { color: "rgba(255,255,255,0.45)" }]}>{isQuiz ? "QUIZ" : "ASSIGNMENT"}</Text>
                      <Text style={[ss.actTitle, { color: C.white }]} numberOfLines={2}>{act.assessment.title}</Text>
                      <Text style={[ss.actMeta, { color: "rgba(255,255,255,0.5)" }]}>{done ? `Completed · ${act.progress.score}%` : `${act.assessment.durationMinutes} min`}</Text>
                    </View>
                    <View style={[ss.actArrow, { backgroundColor: done ? C.green : level.color }]}>
                      <Ico name={done ? "checkmark" : "arrow-forward"} size={15} color={C.white} />
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={[ss.tipCard, { backgroundColor: "rgba(255,184,0,0.12)", borderColor: "rgba(255,184,0,0.25)", borderWidth: 1 }]}>
                <View style={[ss.tipIcon, { backgroundColor: "rgba(255,184,0,0.2)" }]}><Ico name="bulb" size={18} color={C.yellow} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[ss.tipTitle, { color: C.white }]}>Small steps count</Text>
                  <Text style={[ss.tipBody, { color: "rgba(255,255,255,0.55)" }]}>Finish each activity to unlock the next level.</Text>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity style={[ss.backButton, { borderColor: "rgba(255,255,255,0.18)" }]} onPress={onBack}>
            <Text style={[ss.backButtonText, { color: "rgba(255,255,255,0.7)" }]}>← Back to Adventure Map</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export interface MissionsScreenProps {
  onOpenAssessment?: (asmId?: string) => void;
}

export function MissionsScreen({ onOpenAssessment }: MissionsScreenProps) {
  const { user, apiClient } = useAuth();
  const [path, setPath] = useState<LearningPathDTO>(() => fallbackPath());
  const [loading, setLoading] = useState(true);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  const loadPath = async () => {
    try {
      const p = await apiClient.getLearningPath(user?.id);
      if (p?.chapters?.length) setPath(p);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPath(); }, [apiClient, user?.id]);
  useEffect(() => {
    return apiClient.subscribeSync(SyncEventType.LEVEL_PROGRESS_UPDATED, () => loadPath());
  }, [apiClient]);

  const allLevels = useMemo(() => path.chapters.flatMap((c) => c.levels), [path]);
  const nextLevel = allLevels.find((l) => l.status === "UNLOCKED" || l.status === "IN_PROGRESS");
  const completedLevels = allLevels.filter((l) => l.status === "COMPLETED").length;

  // Level detail
  if (selectedLevelId) {
    const sel = allLevels.find((l) => l.id === selectedLevelId);
    const chap = path.chapters.find((c) => c.levels.some((l) => l.id === selectedLevelId));
    if (sel) {
      return (
        <LevelDetailView
          level={sel} chapter={chap}
          onBack={() => setSelectedLevelId(null)}
          onOpenAssessment={(asm) => onOpenAssessment?.(asm.id)}
        />
      );
    }
  }

  return (
    <View style={ss.root}>
      {/* Sky gradient background */}
      <View style={ss.skyBg}>
        <View style={ss.skyTop} />
        <View style={ss.skyMid} />
        <View style={ss.skyBottom} />
      </View>

      <SafeAreaView style={ss.safeArea}>
        {/* Header */}
        <View style={ss.topHeader}>
          <View style={ss.headerLeft}>
            <View style={ss.headerIconBox}>
              <Ico name="map" size={18} color={C.white} />
            </View>
            <View>
              <Text style={ss.headerKicker}>ADVENTURE MAP</Text>
              <Text style={ss.headerTitle}>World Chapters</Text>
            </View>
          </View>
          <View style={ss.headerRight}>
            <View style={ss.xpPill}>
              <Ico name="trophy" size={13} color={C.yellow} />
              <Text style={ss.xpPillText}>{completedLevels} cleared</Text>
            </View>
          </View>
        </View>

        {/* Continue banner */}
        {nextLevel && (
          <TouchableOpacity
            style={ss.continueBanner}
            onPress={() => setSelectedLevelId(nextLevel.id)}
            activeOpacity={0.88}
          >
            <View style={[ss.continueBannerIcon, { backgroundColor: nextLevel.color }]}>
              <Ico name="flash" size={14} color={C.white} />
            </View>
            <Text style={ss.continueBannerText} numberOfLines={1}>
              Continue → <Text style={{ color: nextLevel.color, fontWeight: "900" }}>{nextLevel.title}</Text>
            </Text>
            <Ico name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        )}

        <ScrollView
          contentContainerStyle={ss.mapScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Clouds decoration */}
          <Cloud x={-10} y={0} scale={0.8} opacity={0.8} />
          <Cloud x={220} y={20} scale={0.6} opacity={0.6} />
          <Cloud x={60} y={60} scale={0.5} opacity={0.5} />

          {loading ? (
            <View style={ss.loadingBox}>
              <ActivityIndicator color={C.white} size="large" />
              <Text style={ss.loadingText}>Loading your adventure...</Text>
            </View>
          ) : (
            path.chapters.map((chapter, idx) => (
              <View key={chapter.id}>
                {/* Chapter island */}
                <ChapterIsland
                  chapter={chapter}
                  nextLevel={nextLevel}
                  onSelectLevel={setSelectedLevelId}
                  themeIdx={idx}
                />

                {/* Connector between chapters */}
                {idx < path.chapters.length - 1 && (
                  <ChapterConnector
                    fromColor={chapter.color}
                    toColor={path.chapters[idx + 1].color}
                  />
                )}
              </View>
            ))
          )}

          {/* End of map */}
          {!loading && (
            <View style={ss.mapEnd}>
              <View style={ss.mapEndIcon}>
                <Ico name="star" size={24} color={C.yellow} />
              </View>
              <Text style={ss.mapEndText}>More worlds coming soon...</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1 },

  // Sky background
  skyBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  skyTop: { flex: 0.35, backgroundColor: "#1A3A5C" },
  skyMid: { flex: 0.4, backgroundColor: "#1E4D72" },
  skyBottom: { flex: 0.25, backgroundColor: "#215A84" },

  safeArea: { flex: 1, backgroundColor: "transparent" },

  // Header
  topHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBox: {
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  headerKicker: { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  headerTitle: { color: C.white, fontSize: 20, fontWeight: "900", marginTop: 1 },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  xpPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  xpPillText: { color: C.white, fontSize: 12, fontWeight: "800" },

  // Continue banner
  continueBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 18, marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  continueBannerIcon: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  continueBannerText: { flex: 1, color: C.white, fontSize: 12, fontWeight: "700" },

  // Map scroll
  mapScroll: { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 8 },

  // Island wrap
  islandWrap: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 28, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 6,
  },

  // Chapter banner
  chapterBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  chapterBannerIcon: {
    width: 38, height: 38, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  chapterKicker: { color: "rgba(255,255,255,0.7)", fontSize: 8, fontWeight: "900", letterSpacing: 1.4 },
  chapterBannerTitle: { color: C.white, fontSize: 16, fontWeight: "900", marginTop: 1 },
  chapterProgressChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.5,
  },
  chapterProgressText: { color: C.white, fontSize: 11, fontWeight: "900" },

  // Island body
  islandBody: { paddingHorizontal: 14, paddingBottom: 16 },
  islandTerrain: { alignItems: "center", marginBottom: -10, zIndex: 1 },
  islandNameLabel: { position: "absolute", bottom: 14, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, opacity: 0.8 },

  // Level path
  levelPath: { gap: 0, paddingTop: 8 },

  // Path connector (dashes between levels)
  pathConnector: { alignItems: "center", paddingVertical: 2 },

  // Level node
  levelNodeWrap: { marginVertical: 4 },
  nodeGlowRing: {
    position: "absolute", width: 74, height: 74, borderRadius: 37,
    borderWidth: 2, top: -5, left: -5,
    alignItems: "center", justifyContent: "center",
    overflow: "visible",
  },
  nodeCircle: {
    width: 64, height: 64, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.35)",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  nodeXpBadge: {
    flexDirection: "row", alignItems: "center", gap: 2,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    marginTop: -8, zIndex: 2,
  },
  nodeXpText: { color: C.white, fontSize: 8, fontWeight: "900" },
  nodeLabelBox: {
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1,
    flexDirection: "row", alignItems: "center", gap: 4,
    maxWidth: 130,
  },
  nodeLabelText: { fontSize: 10, fontWeight: "800", flexShrink: 1 },
  upNextTag: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  upNextText: { color: C.white, fontSize: 7, fontWeight: "900", letterSpacing: 0.5 },

  // Chapter progress
  chapterProgressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 2, marginTop: 10, overflow: "hidden" },
  chapterProgressFill: { height: 4, borderRadius: 2 },
  chapterProgressLabel: { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "700", marginTop: 5, textAlign: "center" },

  // Chapter connector
  chapterConnectorWrap: { alignItems: "center", paddingVertical: 8 },
  chapterConnectorRoad: { alignItems: "center" },
  chapterConnectorDot: { width: 5, height: 5, borderRadius: 3 },
  chapterConnectorLabel: { color: "rgba(255,255,255,0.4)", fontSize: 18, fontWeight: "900", marginTop: 4 },

  // Loading
  loadingBox: { height: 200, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "700" },

  // Map end
  mapEnd: { alignItems: "center", paddingVertical: 24, gap: 8 },
  mapEndIcon: {
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  mapEndText: { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700" },

  // ── Detail view ────────────────────────────────────────────────────────────
  detailScroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40, gap: 16 },
  detailTopbar: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  breadcrumbChapter: { fontSize: 10, fontWeight: "700" },
  breadcrumbLevel: { fontSize: 15, fontWeight: "900", marginTop: 1 },
  detailHero: { borderRadius: 26, padding: 22, overflow: "hidden" },
  heroOrbLarge: { width: 62, height: 62, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  heroEyebrow: { color: "rgba(255,255,255,0.75)", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  heroTitle: { color: C.white, fontSize: 28, fontWeight: "900", marginTop: 4 },
  heroSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 18, marginTop: 7 },
  heroProgressRow: { marginTop: 16, gap: 6 },
  heroProgressTrack: { height: 7, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden" },
  heroProgressFill: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.9)" },
  heroProgressLabel: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "700" },
  lockedPanel: { borderRadius: 22, alignItems: "center", padding: 28, gap: 8 },
  lockedIcon: { width: 58, height: 58, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  lockedTitle: { fontSize: 17, fontWeight: "900" },
  lockedBody: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionKicker: { fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  sectionTitle: { fontSize: 20, fontWeight: "900", marginTop: 2 },
  scorePill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12 },
  scorePillText: { color: C.white, fontSize: 11, fontWeight: "900" },
  actCard: { borderRadius: 20, padding: 14, flexDirection: "row", alignItems: "center", gap: 11 },
  actIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  actType: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  actTitle: { fontSize: 13, fontWeight: "900", marginTop: 2 },
  actMeta: { fontSize: 9, fontWeight: "600", marginTop: 3 },
  actArrow: { width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tipCard: { borderRadius: 18, padding: 14, flexDirection: "row", gap: 10, alignItems: "center" },
  tipIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  tipTitle: { fontSize: 12, fontWeight: "900" },
  tipBody: { fontSize: 10, lineHeight: 15, marginTop: 2 },
  backButton: { borderWidth: 1, borderRadius: 16, paddingVertical: 13, alignItems: "center" },
  backButtonText: { fontSize: 11, fontWeight: "900" },
});
