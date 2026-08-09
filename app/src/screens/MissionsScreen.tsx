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

const C = {
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

const ICON_MAP: Record<string, any> = {
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
  checkmark: "checkmark",
  "arrow-back": "arrow-back",
  "arrow-forward": "arrow-forward",
  "chevron-forward": "chevron-forward",
  "chevron-down": "chevron-down-outline",
  "chevron-up": "chevron-up-outline",
};

function Ico({ name, size = 20, color = C.ink }: { name: string; size?: number; color?: string }) {
  return <Ionicons name={(ICON_MAP[name] || name) as any} size={size} color={color} />;
}

function fallbackPath(): LearningPathDTO {
  const fa = (id: string, title: string, type: "QUIZ" | "WORKSHEET", oi: number) => ({
    id: `${id}-${type.toLowerCase()}`,
    type,
    orderIndex: oi,
    assessment: {
      id,
      title,
      description: type === "QUIZ" ? "A quick knowledge check" : "Guided practice worksheet",
      className: "1st Sem",
      topic: "Learning Path",
      assessmentType: (type === "QUIZ" ? "QUIZ" : "PRACTICE") as any,
      totalMarks: 10,
      passingMarks: 7,
      durationMinutes: 15,
      isPublished: true,
    } as AssessmentDTO,
    progress: { assessmentId: id, type, score: 0, completed: false, source: "NONE" as const },
  });
  const lvls = [
    { id: "dl-1", key: "complexity-quest", title: "Complexity Quest", subtitle: "Read the hidden cost", description: "Spot Big-O patterns and make smart choices.", icon: "compass", color: C.blue, orderIndex: 1, xpReward: 120, passPercent: 70, status: "UNLOCKED" as const, bestPercent: 0, xpAwarded: 0, activities: [fa("da-1", "Algorithm Complexity Quiz", "QUIZ", 1), fa("da-4", "Logic Worksheet", "WORKSHEET", 2)] },
    { id: "dl-2", key: "systems-station", title: "Systems Station", subtitle: "Keep the machine moving", description: "Explore processes, memory, and system choices.", icon: "hardware", color: C.orange, orderIndex: 2, xpReward: 150, passPercent: 70, status: "LOCKED" as const, bestPercent: 0, xpAwarded: 0, activities: [fa("da-2", "Systems Quiz", "QUIZ", 1), fa("da-coding", "Build Lab Worksheet", "WORKSHEET", 2)] },
    { id: "dl-3", key: "data-quest", title: "Data Quest", subtitle: "Sort the chaos", description: "Choose structures wisely and trace algorithms.", icon: "database", color: C.green, orderIndex: 3, xpReward: 130, passPercent: 70, status: "LOCKED" as const, bestPercent: 0, xpAwarded: 0, activities: [fa("da-3", "Data Structures Quiz", "QUIZ", 1)] },
  ];
  return {
    student: { id: "demo", userId: "demo", name: "Learner" },
    chapters: [
      { id: "dc-1", key: "algorithm-academy", title: "Algorithm Academy", subtitle: "Train your logic muscles", description: "Build foundations of algorithms, complexity, and problem solving.", icon: "layers", color: C.purple, orderIndex: 1, levels: lvls },
      { id: "dc-2", key: "builder-bay", title: "Builder Bay", subtitle: "Turn ideas into code", description: "Practice object thinking and ship solutions.", icon: "cube", color: C.pink, orderIndex: 2, levels: [{ ...lvls[0], id: "dl-4", key: "object-town", title: "Object Town", status: "LOCKED" as const, color: C.yellow, icon: "cube" }, { ...lvls[1], id: "dl-5", key: "branching-grove", title: "Branching Grove", status: "LOCKED" as const, color: C.green, icon: "git" }] },
      { id: "dc-3", key: "data-dock", title: "Data Dock", subtitle: "Organize the moving parts", description: "Practice choosing and tracing the structures behind reliable programs.", icon: "database", color: C.blue, orderIndex: 3, levels: [{ ...lvls[0], id: "dl-6", key: "structure-harbor", title: "Structure Harbor", status: "LOCKED" as const, color: C.green, icon: "layers" }, { ...lvls[1], id: "dl-7", key: "debugger-den", title: "Debugger Den", status: "LOCKED" as const, color: C.orange, icon: "bulb" }] },
    ],
  };
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: Math.max(0, Math.min(100, percent)), duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [percent]);
  const width = grow.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });
  return (
    <View style={ss.progressTrack}>
      <Animated.View style={[ss.progressFill, { width, backgroundColor: color }]} />
    </View>
  );
}

function LevelPill({ level, isNext, onPress }: { level: LearningLevelDTO; isNext: boolean; onPress: () => void }) {
  const locked = level.status === "LOCKED";
  const complete = level.status === "COMPLETED";
  const pulseBorder = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isNext) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseBorder, { toValue: 1.04, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseBorder, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isNext]);

  const completedCount = level.activities.filter((a) => a.progress.completed).length;
  const totalCount = level.activities.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Animated.View style={{ transform: [{ scale: isNext ? pulseBorder : 1 }] }}>
      <TouchableOpacity
        disabled={locked}
        activeOpacity={0.82}
        onPress={onPress}
        style={[ss.levelPill, { borderLeftColor: locked ? "#D8E0EE" : level.color }, isNext && ss.levelPillNext]}
      >
        <View style={[ss.levelIconBubble, { backgroundColor: locked ? "#EDF1F8" : level.color + "22" }]}>
          <Ico name={locked ? "lock" : complete ? "trophy" : level.icon} size={20} color={locked ? C.muted : complete ? C.green : level.color} />
        </View>
        <View style={ss.levelCopy}>
          <View style={ss.levelTitleRow}>
            <Text style={[ss.levelTitle, locked && { color: "#AAB4C5" }]} numberOfLines={1}>{level.title}</Text>
            {complete && <View style={[ss.levelBadge, { backgroundColor: C.green + "22" }]}><Text style={[ss.levelBadgeText, { color: C.green }]}>Cleared</Text></View>}
            {isNext && !complete && <View style={[ss.levelBadge, { backgroundColor: C.purple + "22" }]}><Text style={[ss.levelBadgeText, { color: C.purple }]}>Up Next</Text></View>}
            {locked && <View style={[ss.levelBadge, { backgroundColor: "#EDF1F8" }]}><Text style={[ss.levelBadgeText, { color: "#AAB4C5" }]}>Locked</Text></View>}
          </View>
          <Text style={[ss.levelSubtitle, locked && { color: "#C0C9D8" }]} numberOfLines={1}>{level.subtitle || `${totalCount} challenge${totalCount !== 1 ? "s" : ""}`}</Text>
          {!locked && (
            <View style={ss.levelProgressRow}>
              <ProgressBar percent={pct} color={level.color} />
              <Text style={[ss.levelPct, { color: level.color }]}>{pct}%</Text>
            </View>
          )}
        </View>
        <View style={ss.levelRight}>
          {!locked && (
            <View style={[ss.xpTag, { backgroundColor: level.color + "18" }]}>
              <Ico name="flash" size={10} color={level.color} />
              <Text style={[ss.xpTagText, { color: level.color }]}>{level.xpReward}</Text>
            </View>
          )}
          {!locked && <Ico name="chevron-forward" size={16} color={C.muted} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ChapterCard({ chapter, nextLevel, defaultOpen, onSelectLevel }: { chapter: LearningChapterDTO; nextLevel?: LearningLevelDTO; defaultOpen: boolean; onSelectLevel: (id: string) => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const completedLevels = chapter.levels.filter((l) => l.status === "COMPLETED").length;
  const totalLevels = chapter.levels.length;
  const chapterPct = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

  return (
    <View style={ss.chapterCard}>
      <TouchableOpacity style={[ss.chapterHeader, { backgroundColor: chapter.color }]} onPress={() => setOpen(!open)} activeOpacity={0.88}>
        <View style={[ss.chapterIconBox, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
          <Ico name={chapter.icon} size={22} color={C.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ss.chapterKicker}>CHAPTER {chapter.orderIndex}</Text>
          <Text style={ss.chapterTitle}>{chapter.title}</Text>
          <Text style={ss.chapterSubtitle} numberOfLines={1}>{chapter.subtitle}</Text>
        </View>
        <View style={ss.chapterBadge}>
          <Text style={ss.chapterBadgeText}>{completedLevels}/{totalLevels}</Text>
        </View>
        <Ico name={open ? "chevron-up" : "chevron-down"} size={18} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>

      <View style={ss.chapterProgressBar}>
        <View style={[ss.chapterProgressFill, { backgroundColor: chapter.color, width: `${chapterPct}%` }]} />
      </View>

      {open && (
        <View style={ss.levelsContainer}>
          {chapter.levels.map((level, idx) => (
            <View key={level.id}>
              {idx > 0 && (
                <View style={ss.connector}>
                  <View style={[ss.connectorLine, { backgroundColor: level.status === "COMPLETED" ? chapter.color : "#DDE5F2" }]} />
                </View>
              )}
              <LevelPill level={level} isNext={nextLevel?.id === level.id} onPress={() => onSelectLevel(level.id)} />
            </View>
          ))}
          <Text style={ss.chapterDesc}>{chapter.description}</Text>
        </View>
      )}
    </View>
  );
}

function LevelDetailView({ level, chapter, onBack, onOpenAssessment }: { level: LearningLevelDTO; chapter?: LearningChapterDTO; onBack: () => void; onOpenAssessment: (asm: AssessmentDTO) => void }) {
  const locked = level.status === "LOCKED";
  const completedActs = level.activities.filter((a) => a.progress.completed).length;
  return (
    <SafeAreaView style={ss.safeArea}>
      <ScrollView contentContainerStyle={ss.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={ss.detailTopbar}>
          <TouchableOpacity style={ss.backBtn} onPress={onBack}>
            <Ico name="arrow-back" size={18} color={C.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={ss.breadcrumbChapter}>{chapter?.title || "Missions"}</Text>
            <Text style={ss.breadcrumbLevel}>Level {level.orderIndex} — {level.title}</Text>
          </View>
        </View>

        <View style={[ss.detailHero, { backgroundColor: level.color }]}>
          <View style={ss.heroOrb}><Ico name={level.icon} size={30} color={C.white} /></View>
          <Text style={ss.heroEyebrow}>LEVEL {level.orderIndex}  ·  {level.xpReward} XP</Text>
          <Text style={ss.heroTitle}>{level.title}</Text>
          <Text style={ss.heroSubtitle}>{level.description}</Text>
          <View style={ss.heroProgressRow}>
            <View style={ss.heroProgressTrack}>
              <View style={[ss.heroProgressFill, { width: `${level.bestPercent}%` }]} />
            </View>
            <Text style={ss.heroProgressLabel}>{level.bestPercent}% / {level.passPercent}% needed</Text>
          </View>
        </View>

        {locked ? (
          <View style={ss.lockedPanel}>
            <View style={ss.lockedIcon}><Ico name="lock" size={26} color={C.muted} /></View>
            <Text style={ss.lockedTitle}>Level Locked</Text>
            <Text style={ss.lockedBody}>Clear the previous level to unlock this checkpoint.</Text>
          </View>
        ) : (
          <>
            <View style={ss.sectionHeader}>
              <View>
                <Text style={ss.sectionKicker}>YOUR CHECKPOINTS</Text>
                <Text style={ss.sectionTitle}>Clear the trail</Text>
              </View>
              <View style={ss.scorePill}>
                <Text style={ss.scorePillText}>{completedActs}/{level.activities.length}</Text>
              </View>
            </View>

            {level.activities.map((act) => {
              const done = act.progress.completed;
              const isQuiz = act.type === "QUIZ";
              return (
                <TouchableOpacity key={act.id} style={ss.actCard} activeOpacity={0.85} onPress={() => onOpenAssessment(act.assessment)}>
                  <View style={[ss.actIcon, { backgroundColor: isQuiz ? "#E5F6FF" : "#FFF0E7" }]}>
                    <Ico name={isQuiz ? "quiz" : "worksheet"} size={19} color={isQuiz ? C.blue : C.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ss.actType}>{isQuiz ? "QUIZ" : "ASSIGNMENT"}</Text>
                    <Text style={ss.actTitle} numberOfLines={2}>{act.assessment.title}</Text>
                    <Text style={ss.actMeta}>{done ? `Completed · ${act.progress.score}%` : `${act.assessment.durationMinutes} min`}</Text>
                  </View>
                  <View style={[ss.actArrow, done && { backgroundColor: C.green }]}>
                    <Ico name={done ? "checkmark" : "arrow-forward"} size={15} color={C.white} />
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={ss.tipCard}>
              <View style={ss.tipIcon}><Ico name="bulb" size={18} color={C.orange} /></View>
              <View style={{ flex: 1 }}>
                <Text style={ss.tipTitle}>Small steps count</Text>
                <Text style={ss.tipBody}>Finish each activity, then reach the score target to unlock the next level.</Text>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity style={ss.backButton} onPress={onBack}>
          <Text style={ss.backButtonText}>← Back to Missions</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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
      const nextPath = await apiClient.getLearningPath(user?.id);
      if (nextPath?.chapters?.length) setPath(nextPath);
    } catch { /* keep fallback */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPath(); }, [apiClient, user?.id]);
  useEffect(() => {
    return apiClient.subscribeSync(SyncEventType.LEVEL_PROGRESS_UPDATED, () => { loadPath(); });
  }, [apiClient]);

  const allLevels = useMemo(() => path.chapters.flatMap((c) => c.levels), [path]);
  const nextLevel = allLevels.find((l) => l.status === "UNLOCKED" || l.status === "IN_PROGRESS");
  const completedLevels = allLevels.filter((l) => l.status === "COMPLETED").length;

  if (selectedLevelId) {
    const selectedLevel = allLevels.find((l) => l.id === selectedLevelId);
    const chapter = path.chapters.find((c) => c.levels.some((l) => l.id === selectedLevelId));
    if (selectedLevel) {
      return (
        <LevelDetailView
          level={selectedLevel}
          chapter={chapter}
          onBack={() => setSelectedLevelId(null)}
          onOpenAssessment={(asm) => onOpenAssessment?.(asm.id)}
        />
      );
    }
  }

  return (
    <SafeAreaView style={ss.safeArea}>
      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>
        <View style={ss.header}>
          <View>
            <Text style={ss.headerKicker}>YOUR MISSIONS</Text>
            <Text style={ss.headerTitle}>Adventure Map</Text>
          </View>
          <View style={[ss.statBubble]}>
            <Ico name="trophy" size={13} color={C.yellow} />
            <Text style={ss.statBubbleText}>{completedLevels} cleared</Text>
          </View>
        </View>

        <View style={ss.overviewCard}>
          <View style={ss.overviewRow}>
            {path.chapters.map((ch) => {
              const done = ch.levels.filter((l) => l.status === "COMPLETED").length;
              const total = ch.levels.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <View key={ch.id} style={ss.overviewItem}>
                  <View style={[ss.overviewIconBox, { backgroundColor: ch.color + "22" }]}>
                    <Ico name={ch.icon} size={16} color={ch.color} />
                  </View>
                  <Text style={[ss.overviewPct, { color: ch.color }]}>{pct}%</Text>
                  <Text style={ss.overviewLabel} numberOfLines={1}>{ch.title.split(" ")[0]}</Text>
                </View>
              );
            })}
          </View>
          {nextLevel && (
            <TouchableOpacity
              style={[ss.continueBtn, { backgroundColor: C.purple }]}
              onPress={() => setSelectedLevelId(nextLevel.id)}
              activeOpacity={0.88}
            >
              <Ico name="flash" size={15} color={C.white} />
              <Text style={ss.continueBtnText}>Continue: {nextLevel.title}</Text>
              <Ico name="arrow-forward" size={15} color={C.white} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={ss.loadingBox}>
            <ActivityIndicator color={C.purple} />
            <Text style={ss.loadingText}>Syncing missions...</Text>
          </View>
        ) : (
          path.chapters.map((chapter, idx) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              nextLevel={nextLevel}
              defaultOpen={idx === 0 || chapter.levels.some((l) => l.status === "UNLOCKED" || l.status === "IN_PROGRESS")}
              onSelectLevel={setSelectedLevelId}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.canvas },
  scroll: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 36, gap: 14 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerKicker: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  headerTitle: { color: C.ink, fontSize: 26, fontWeight: "900", marginTop: 2 },
  statBubble: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginTop: 4 },
  statBubbleText: { color: C.ink, fontSize: 11, fontWeight: "800" },
  overviewCard: { backgroundColor: C.white, borderRadius: 22, padding: 16, gap: 14, shadowColor: "#C9D4E7", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  overviewRow: { flexDirection: "row", justifyContent: "space-around" },
  overviewItem: { alignItems: "center", gap: 4 },
  overviewIconBox: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  overviewPct: { fontSize: 14, fontWeight: "900" },
  overviewLabel: { color: C.muted, fontSize: 9, fontWeight: "700", maxWidth: 58, textAlign: "center" },
  continueBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 18 },
  continueBtnText: { color: C.white, fontSize: 13, fontWeight: "900", flex: 1, textAlign: "center" },
  chapterCard: { backgroundColor: C.white, borderRadius: 24, overflow: "hidden", shadowColor: "#C9D4E7", shadowOpacity: 0.32, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  chapterHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  chapterIconBox: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  chapterKicker: { color: "rgba(255,255,255,0.75)", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  chapterTitle: { color: C.white, fontSize: 18, fontWeight: "900", marginTop: 1 },
  chapterSubtitle: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "700", marginTop: 1 },
  chapterBadge: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginRight: 6 },
  chapterBadgeText: { color: C.white, fontSize: 11, fontWeight: "900" },
  chapterProgressBar: { height: 3, backgroundColor: "#EDF1F8" },
  chapterProgressFill: { height: 3 },
  chapterDesc: { color: C.muted, fontSize: 11, lineHeight: 16, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  levelsContainer: { paddingHorizontal: 14, paddingTop: 12, gap: 0 },
  connector: { alignItems: "center", height: 18, justifyContent: "center" },
  connectorLine: { width: 2, height: 14, borderRadius: 1 },
  levelPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#F7F9FC", borderRadius: 18, padding: 12, gap: 11, borderLeftWidth: 3 },
  levelPillNext: { backgroundColor: "#F0EDFF", shadowColor: C.purple, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  levelIconBubble: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  levelCopy: { flex: 1, gap: 3 },
  levelTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  levelTitle: { color: C.ink, fontSize: 13, fontWeight: "900", flex: 1 },
  levelSubtitle: { color: C.muted, fontSize: 10, fontWeight: "600" },
  levelProgressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  levelBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  levelBadgeText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  levelRight: { alignItems: "flex-end", gap: 6 },
  xpTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8 },
  xpTagText: { fontSize: 10, fontWeight: "900" },
  progressTrack: { flex: 1, height: 5, backgroundColor: "#E8EDF6", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  levelPct: { fontSize: 9, fontWeight: "800", minWidth: 28, textAlign: "right" },
  loadingBox: { height: 100, backgroundColor: C.white, borderRadius: 20, justifyContent: "center", alignItems: "center", gap: 8 },
  loadingText: { color: C.muted, fontSize: 11, fontWeight: "700" },
  detailScroll: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36, gap: 14 },
  detailTopbar: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 38, height: 38, backgroundColor: C.white, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  breadcrumbChapter: { color: C.muted, fontSize: 10, fontWeight: "700" },
  breadcrumbLevel: { color: C.ink, fontSize: 14, fontWeight: "900", marginTop: 1 },
  detailHero: { borderRadius: 26, padding: 22, overflow: "hidden" },
  heroOrb: { width: 56, height: 56, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.24)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  heroEyebrow: { color: "rgba(255,255,255,0.78)", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  heroTitle: { color: C.white, fontSize: 27, fontWeight: "900", marginTop: 4 },
  heroSubtitle: { color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 18, marginTop: 7 },
  heroProgressRow: { marginTop: 16, gap: 6 },
  heroProgressTrack: { height: 7, backgroundColor: "rgba(255,255,255,0.26)", borderRadius: 4, overflow: "hidden" },
  heroProgressFill: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.9)" },
  heroProgressLabel: { color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: "700" },
  lockedPanel: { backgroundColor: C.white, borderRadius: 22, alignItems: "center", padding: 28, gap: 8 },
  lockedIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: "#EFF3F8", alignItems: "center", justifyContent: "center" },
  lockedTitle: { color: C.ink, fontSize: 16, fontWeight: "900" },
  lockedBody: { color: C.muted, fontSize: 11, textAlign: "center", lineHeight: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionKicker: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  sectionTitle: { color: C.ink, fontSize: 19, fontWeight: "900", marginTop: 2 },
  scorePill: { backgroundColor: C.ink, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12 },
  scorePillText: { color: C.white, fontSize: 11, fontWeight: "900" },
  actCard: { backgroundColor: C.white, borderRadius: 20, padding: 13, flexDirection: "row", alignItems: "center", gap: 11 },
  actIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actType: { color: C.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  actTitle: { color: C.ink, fontSize: 13, fontWeight: "900", marginTop: 2 },
  actMeta: { color: C.muted, fontSize: 9, fontWeight: "600", marginTop: 3 },
  actArrow: { width: 30, height: 30, borderRadius: 11, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  tipCard: { backgroundColor: "#E8F8FF", borderRadius: 18, padding: 14, flexDirection: "row", gap: 10, alignItems: "center" },
  tipIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  tipTitle: { color: C.ink, fontSize: 12, fontWeight: "900" },
  tipBody: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  backButton: { borderWidth: 1, borderColor: "#D8E0EE", borderRadius: 16, paddingVertical: 12, alignItems: "center" },
  backButtonText: { color: C.ink, fontSize: 11, fontWeight: "900" },
});
