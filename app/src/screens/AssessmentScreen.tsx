import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Platform,
  Animated,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { AssessmentDTO, QuestionDTO } from "../types";
import { Ionicons, Feather } from "@expo/vector-icons";

interface AssessmentScreenProps {
  onBackToDashboard: () => void;
  selectedAssessmentId?: string | null;
}

const DEMO_QUESTIONS: QuestionDTO[] = [
  {
    id: "q-1",
    assessmentId: "demo-asm-1",
    questionText: "What is the average time complexity of QuickSort?",
    questionType: "SINGLE_CHOICE",
    difficulty: "MEDIUM",
    points: 2,
    orderIndex: 1,
    explanation:
      "QuickSort has an average-case time complexity of O(n log n) when partitioning divides the array reasonably well.",
    options: [
      {
        id: "opt-1",
        questionId: "q-1",
        optionText: "O(n²)",
        isCorrect: false,
        orderIndex: 1,
      },
      {
        id: "opt-2",
        questionId: "q-1",
        optionText: "O(n log n)",
        isCorrect: true,
        orderIndex: 2,
      },
      {
        id: "opt-3",
        questionId: "q-1",
        optionText: "O(n)",
        isCorrect: false,
        orderIndex: 3,
      },
      {
        id: "opt-4",
        questionId: "q-1",
        optionText: "O(log n)",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    id: "q-2",
    assessmentId: "demo-asm-1",
    questionText:
      "Which data structure follows the LIFO (Last In First Out) principle?",
    questionType: "SINGLE_CHOICE",
    difficulty: "EASY",
    points: 1,
    orderIndex: 2,
    explanation:
      "Stack operates on LIFO principle where the element inserted last is removed first.",
    options: [
      {
        id: "opt-5",
        questionId: "q-2",
        optionText: "Queue",
        isCorrect: false,
        orderIndex: 1,
      },
      {
        id: "opt-6",
        questionId: "q-2",
        optionText: "Stack",
        isCorrect: true,
        orderIndex: 2,
      },
      {
        id: "opt-7",
        questionId: "q-2",
        optionText: "Binary Tree",
        isCorrect: false,
        orderIndex: 3,
      },
      {
        id: "opt-8",
        questionId: "q-2",
        optionText: "Linked List",
        isCorrect: false,
        orderIndex: 4,
      },
    ],
  },
  {
    id: "q-3",
    assessmentId: "demo-asm-1",
    questionText:
      "In a Hash Table with open addressing, primary clustering happens when key collisions resolve to adjacent slots.",
    questionType: "SINGLE_CHOICE",
    difficulty: "HARD",
    points: 2,
    orderIndex: 3,
    explanation:
      "Linear probing creates long consecutive occupied blocks called primary clusters.",
    options: [
      {
        id: "opt-9",
        questionId: "q-3",
        optionText: "True",
        isCorrect: true,
        orderIndex: 1,
      },
      {
        id: "opt-10",
        questionId: "q-3",
        optionText: "False",
        isCorrect: false,
        orderIndex: 2,
      },
    ],
  },
];

export function AssessmentScreen({
  onBackToDashboard,
  selectedAssessmentId,
}: AssessmentScreenProps) {
  const { apiClient, user } = useAuth();

  const [mode, setMode] = useState<"LIST" | "RUNNER" | "RESULT">("LIST");
  const [assessments, setAssessments] = useState<AssessmentDTO[]>([]);
  const [selectedAsm, setSelectedAsm] = useState<AssessmentDTO | null>(null);
  const [questions, setQuestions] = useState<QuestionDTO[]>(DEMO_QUESTIONS);

  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Test Runner State
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Test Result State
  const [resultScore, setResultScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);

  // Fetch Assessments list
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await apiClient.getAssessments();
        if (list && list.length > 0) {
          setAssessments(list);
        } else {
          setAssessments(DEFAULT_MOCK_ASSESSMENTS);
        }
      } catch {
        setAssessments(DEFAULT_MOCK_ASSESSMENTS);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle Auto-open if selectedAssessmentId passed
  useEffect(() => {
    if (selectedAssessmentId && assessments.length > 0) {
      const found = assessments.find((a) => a.id === selectedAssessmentId);
      if (found) {
        startAssessment(found);
      }
    }
  }, [selectedAssessmentId, assessments]);

  // Timer logic
  useEffect(() => {
    if (mode !== "RUNNER" || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, timeLeftSeconds]);

  const startAssessment = async (asm: AssessmentDTO) => {
    setSelectedAsm(asm);
    setLoading(true);
    try {
      const details = await apiClient.getAssessmentById(asm.id);
      if (details.questions && details.questions.length > 0) {
        setQuestions(details.questions);
      } else {
        setQuestions(DEMO_QUESTIONS);
      }
      const attempt = await apiClient.startAttempt(
        asm.id,
        user?.id || "student",
      );
      setAttemptId(attempt.id);
    } catch {
      setQuestions(DEMO_QUESTIONS);
      setAttemptId(`attempt-${Date.now()}`);
    } finally {
      setTimeLeftSeconds((asm.durationMinutes || 15) * 60);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setMode("RUNNER");
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    const updated = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(updated);

    if (attemptId) {
      apiClient
        .autosaveAnswer(attemptId, {
          questionId,
          selectedOptionId: optionId,
        })
        .catch(() => {});
    }
  };

  const handleSubmitTest = async () => {
    setSubmitting(true);
    let calculatedScore = 0;
    let totalPossible = 0;

    questions.forEach((q) => {
      totalPossible += q.points || 1;
      const userSelectedOptId = selectedAnswers[q.id];
      const correctOpt = q.options?.find((o) => o.isCorrect);
      if (
        userSelectedOptId &&
        correctOpt &&
        userSelectedOptId === correctOpt.id
      ) {
        calculatedScore += q.points || 1;
      }
    });

    if (attemptId) {
      try {
        await apiClient.submitAttempt(attemptId);
      } catch {}
    }

    setResultScore(calculatedScore);
    setMaxScore(totalPossible);
    setAccuracy(
      totalPossible > 0
        ? Math.round((calculatedScore / totalPossible) * 100)
        : 0,
    );
    setSubmitting(false);
    setMode("RESULT");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.className &&
        a.className.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      filterType === "ALL" || a.assessmentType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Fixed Navigation Header */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBackToDashboard}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#4ade80" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>
          {mode === "LIST"
            ? "ASSESSMENTS"
            : mode === "RUNNER"
              ? "TEST RUNNER"
              : "EVALUATION SUMMARY"}
        </Text>
        <View style={{ width: 80 }} />
      </View>

      {mode === "LIST" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <Text style={styles.bannerTag}>MOBILE ASSESSMENT PORTAL</Text>
            <Text style={styles.bannerTitle}>
              Master your topics with active quizzes & exams.
            </Text>
            <Text style={styles.bannerSub}>
              Real-time score calculation, negative marking & topic insights.
            </Text>
          </View>

          {/* Search & Filter Chips */}
          <View style={styles.filterSection}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by quiz title or topic..."
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {["ALL", "QUIZ", "EXAM", "PRACTICE"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    filterType === type && styles.activeChip,
                  ]}
                  onPress={() => setFilterType(type)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filterType === type && styles.activeChipText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Assessments Grid */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#5451FF" />
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {filteredAssessments.map((asm) => (
                <View key={asm.id} style={styles.asmCard}>
                  <View style={styles.asmTopRow}>
                    <View style={styles.asmClassChip}>
                      <Text style={styles.asmClassText}>
                        {asm.className || "Computer Science"}
                      </Text>
                    </View>
                    <View style={styles.asmTypeBadge}>
                      <Text style={styles.asmTypeText}>
                        {asm.assessmentType}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.asmTitle}>{asm.title}</Text>
                  <Text style={styles.asmDesc}>
                    {asm.description ||
                      "Test your algorithm skills & topic knowledge."}
                  </Text>

                  <View style={styles.asmMetaRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="time-outline" size={13} color="#71717a" />
                      <Text style={styles.asmMetaItem}>
                        {asm.durationMinutes || 15} mins
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="trophy-outline" size={13} color="#71717a" />
                      <Text style={styles.asmMetaItem}>
                        {asm.totalMarks || 10} Marks
                      </Text>
                    </View>
                    {asm.hasNegativeMarking && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="warning-outline" size={13} color="#f59e0b" />
                        <Text style={[styles.asmMetaItem, { color: "#f59e0b" }]}>Negative Marks</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={() => startAssessment(asm)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.startBtnText}>START ASSESSMENT</Text>
                    <Feather name="arrow-up-right" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {mode === "RUNNER" && (
        <View style={styles.runnerContainer}>
          {/* Runner Status Bar */}
          <View style={styles.runnerHeader}>
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>
                QUESTION {currentIdx + 1} OF {questions.length}
              </Text>
            </View>
            <View
              style={[
                styles.timerPill,
                timeLeftSeconds < 180 && styles.timerWarning,
              ]}
            >
              <Ionicons name="timer-outline" size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.timerText}>
                {formatTime(timeLeftSeconds)}
              </Text>
            </View>
          </View>

          {/* Question Card */}
          <ScrollView
            contentContainerStyle={styles.questionScroll}
            showsVerticalScrollIndicator={false}
          >
            {questions[currentIdx] && (
              <View style={styles.questionCard}>
                <View style={styles.qMetaRow}>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>
                      {questions[currentIdx].difficulty || "MEDIUM"}
                    </Text>
                  </View>
                  <Text style={styles.pointsText}>
                    +{questions[currentIdx].points || 1} Points
                  </Text>
                </View>

                <Text style={styles.questionText}>
                  {questions[currentIdx].questionText}
                </Text>

                {/* Options List */}
                <View style={styles.optionsList}>
                  {questions[currentIdx].options?.map((opt) => {
                    const isSelected =
                      selectedAnswers[questions[currentIdx].id] === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.optionItem,
                          isSelected && styles.selectedOption,
                        ]}
                        onPress={() =>
                          handleSelectOption(questions[currentIdx].id, opt.id)
                        }
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleActive,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.selectedOptionText,
                          ]}
                        >
                          {opt.optionText}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.runnerFooter}>
            <TouchableOpacity
              style={[
                styles.navStepBtn,
                currentIdx === 0 && styles.disabledBtn,
              ]}
              disabled={currentIdx === 0}
              onPress={() => setCurrentIdx((p) => p - 1)}
            >
              <Feather name="arrow-left" size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.navStepText}>PREVIOUS</Text>
            </TouchableOpacity>

            {currentIdx < questions.length - 1 ? (
              <TouchableOpacity
                style={styles.navStepBtnPrimary}
                onPress={() => setCurrentIdx((p) => p + 1)}
              >
                <Text style={styles.navStepTextPrimary}>NEXT</Text>
                <Feather name="arrow-right" size={14} color="#ffffff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitTestBtn}
                onPress={handleSubmitTest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={styles.submitTestText}>SUBMIT TEST</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#121316" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {mode === "RESULT" && (
        <ScrollView
          contentContainerStyle={styles.resultScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultCard}>
            <Text style={styles.resultHeaderTag}>EVALUATION COMPLETE</Text>
            <Text style={styles.resultScoreBig}>
              {resultScore}{" "}
              <Text style={styles.resultScoreMax}>/ {maxScore}</Text>
            </Text>

            <View style={styles.accuracyBarContainer}>
              <View
                style={[styles.accuracyBarFill, { width: `${accuracy}%` }]}
              />
            </View>
            <Text style={styles.accuracyText}>
              {accuracy}% Overall Accuracy
            </Text>

            <View style={styles.resultStatsGrid}>
              <View style={styles.resStatBox}>
                <Text style={styles.resStatVal}>{questions.length}</Text>
                <Text style={styles.resStatLabel}>Total Questions</Text>
              </View>
              <View style={styles.resStatBox}>
                <Text style={styles.resStatVal}>
                  {Object.keys(selectedAnswers).length}
                </Text>
                <Text style={styles.resStatLabel}>Answered</Text>
              </View>
              <View style={styles.resStatBox}>
                <Text style={styles.resStatVal}>+{resultScore * 10} XP</Text>
                <Text style={styles.resStatLabel}>XP Earned</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.finishBtn}
              onPress={onBackToDashboard}
              activeOpacity={0.85}
            >
              <Text style={styles.finishBtnText}>RETURN TO DASHBOARD →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const DEFAULT_MOCK_ASSESSMENTS: AssessmentDTO[] = [
  {
    id: "demo-asm-1",
    title: "Algorithm Complexity & Data Structures Quiz",
    description:
      "Evaluates Big-O notation, stacks, queues, hash tables, and sorting algorithms.",
    className: "Data Structures II",
    assessmentType: "QUIZ",
    totalMarks: 10,
    passingMarks: 6,
    durationMinutes: 15,
    hasNegativeMarking: true,
    negativeMarkValue: 0.5,
    isPublished: true,
    createdById: "teacher-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-asm-2",
    title: "System Architecture & Operating Systems Exam",
    description:
      "Deep dive into process scheduling, memory allocation, page faults, and threads.",
    className: "Operating Systems",
    assessmentType: "EXAM",
    totalMarks: 25,
    passingMarks: 15,
    durationMinutes: 30,
    hasNegativeMarking: false,
    negativeMarkValue: 0,
    isPublished: true,
    createdById: "teacher-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121316",
  },
  scrollContent: {
    padding: 20,
    gap: 20,
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
  backBtnText: {
    color: "#4ade80",
    fontSize: 13,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  navTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  headerBanner: {
    backgroundColor: "#5451FF",
    borderRadius: 24,
    padding: 22,
    gap: 8,
  },
  bannerTag: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  bannerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  bannerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
  filterSection: {
    gap: 12,
  },
  searchInput: {
    backgroundColor: "#191a1e",
    color: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
  chipRow: {
    gap: 8,
  },
  chip: {
    backgroundColor: "#191a1e",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  activeChip: {
    backgroundColor: "#5451FF",
    borderColor: "#5451FF",
  },
  chipText: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  activeChipText: {
    color: "#ffffff",
  },
  cardsGrid: {
    gap: 16,
  },
  asmCard: {
    backgroundColor: "#191a1e",
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  asmTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  asmClassChip: {
    backgroundColor: "rgba(84,81,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  asmClassText: {
    color: "#5451FF",
    fontSize: 10,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  asmTypeBadge: {
    backgroundColor: "rgba(255,87,69,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  asmTypeText: {
    color: "#FF5745",
    fontSize: 10,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  asmTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  asmDesc: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 18,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_400Regular",
  },
  asmMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  asmMetaItem: {
    color: "#71717a",
    fontSize: 11,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
  startBtn: {
    backgroundColor: "#3B82F6",
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  startBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  runnerContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  runnerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  progressPill: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  timerPill: {
    backgroundColor: "rgba(59,130,246,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerWarning: {
    backgroundColor: "rgba(239,68,68,0.2)",
  },
  timerText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  questionScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  questionCard: {
    backgroundColor: "#191a1e",
    borderRadius: 24,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  qMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  difficultyBadge: {
    backgroundColor: "rgba(74,222,128,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    color: "#4ade80",
    fontSize: 10,
    fontWeight: "600",
  },
  pointsText: {
    color: "#F4C463",
    fontSize: 12,
    fontWeight: "600",
  },
  questionText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  optionsList: {
    gap: 10,
    marginTop: 6,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#22242a",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  selectedOption: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderColor: "#3B82F6",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#71717a",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#3B82F6",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
  },
  optionText: {
    color: "#d1d5db",
    fontSize: 14,
    flex: 1,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
  selectedOptionText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  runnerFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "#191a1e",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  navStepBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#22242a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.4,
  },
  navStepText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  navStepBtnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  navStepTextPrimary: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  submitTestBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#4ade80",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitTestText: {
    color: "#121316",
    fontSize: 12,
    fontWeight: "700",
  },
  resultScroll: {
    padding: 20,
    flexGrow: 1,
    justifyContent: "center",
  },
  resultCard: {
    backgroundColor: "#191a1e",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  resultHeaderTag: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  resultScoreBig: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "700",
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  resultScoreMax: {
    color: "#71717a",
    fontSize: 24,
  },
  accuracyBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#22242a",
    borderRadius: 4,
    overflow: "hidden",
  },
  accuracyBarFill: {
    height: "100%",
    backgroundColor: "#4ade80",
  },
  accuracyText: {
    color: "#9ca3af",
    fontSize: 13,
  },
  resultStatsGrid: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  resStatBox: {
    flex: 1,
    backgroundColor: "#22242a",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  resStatVal: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  resStatLabel: {
    color: "#71717a",
    fontSize: 10,
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: "#3B82F6",
    height: 52,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  finishBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  centerContainer: {
    padding: 40,
    alignItems: "center",
  },
});
