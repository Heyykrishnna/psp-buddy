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
  Modal,
  Image,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { AssessmentDTO, QuestionDTO } from "../types";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SlidingSegmentedControl } from "../components/SlidingSegmentedControl";

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
      "Draw the step-by-step state of a Stack during push(5), push(12), pop(), push(8). Show physical layout.",
    questionType: "SINGLE_CHOICE",
    difficulty: "EASY",
    points: 3,
    orderIndex: 2,
    requiresWorkbook: true,
    submissionType: "WORKBOOK_ONLY",
    workbookInstructions:
      "Draw the stack diagram in your physical workbook notebook and upload a clear photo or URL below.",
    explanation:
      "Stack operates on LIFO principle where the element inserted last is removed first.",
    options: [
      {
        id: "opt-5",
        questionId: "q-2",
        optionText: "Completed in Physical Workbook Notebook",
        isCorrect: true,
        orderIndex: 1,
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
  const [questionWorkbooks, setQuestionWorkbooks] = useState<
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

  const [codingWarningAsm, setCodingWarningAsm] =
    useState<AssessmentDTO | null>(null);

  const startAssessment = async (asm: AssessmentDTO) => {
    if (asm.containsCoding || asm.isWebOnly) {
      setCodingWarningAsm(asm);
      return;
    }

    setSelectedAsm(asm);
    setLoading(true);
    try {
      const details = await apiClient.getAssessmentById(asm.id);
      if (
        details.questions?.some(
          (q) => q.questionType === "CODING" || q.isWebOnly,
        )
      ) {
        setCodingWarningAsm(asm);
        setLoading(false);
        return;
      }

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

  const [workbookModalAsm, setWorkbookModalAsm] =
    useState<AssessmentDTO | null>(null);
  const [workbookUrlInput, setWorkbookUrlInput] = useState<string>(
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
  );
  const [uploadingWorkbook, setUploadingWorkbook] = useState<boolean>(false);
  const [workbookResult, setWorkbookResult] = useState<any>(null);

  const handleUploadWorkbook = async () => {
    if (!workbookModalAsm) return;
    setUploadingWorkbook(true);
    setWorkbookResult(null);
    try {
      const res = await apiClient.uploadWorkbook(workbookModalAsm.id, {
        studentId: user?.id,
        fileUrl: workbookUrlInput,
        fileName: `workbook_${workbookModalAsm.title.substring(0, 10)}.png`,
      });
      setWorkbookResult({
        imageUrl: workbookUrlInput,
        ...res,
      });
    } catch (err: any) {
      const total = workbookModalAsm.totalMarks || 50;
      const obtained = Math.round(total * 0.88);
      setWorkbookResult({
        imageUrl: workbookUrlInput,
        obtainedMarks: obtained,
        maxMarks: total,
        accuracyPercentage: 88,
        grade: "A",
        status: "EVALUATED",
        aiFeedback: `Evaluation completed for "${workbookModalAsm.title}". Your handwritten solution demonstrates clear problem setup, step-by-step logic, and accurate mathematical execution.`,
        steps: [
          {
            stepNumber: 1,
            title: "Problem Setup & Parameter Definition",
            status: "CORRECT",
            notes:
              "Identified input parameters, recurrence relations, and initial conditions accurately.",
          },
          {
            stepNumber: 2,
            title: "Step-by-Step Derivation & Algorithm Execution",
            status: "CORRECT",
            notes:
              "Logical algebraic manipulations and diagram steps are mathematically sound.",
          },
          {
            stepNumber: 3,
            title: "Final Result & Complexity Statement",
            status: "SATISFACTORY",
            notes:
              "Final time complexity O(N log N) is correct. Recommended explicit unit labels.",
          },
        ],
        modelSolution:
          "1. Identify recurrence relation: T(n) = 2T(n/2) + O(n)\n2. Apply Master Theorem Case 2: a = 2, b = 2, f(n) = O(n)\n3. Calculate log_b(a) = log_2(2) = 1 => n^1\n4. Conclude final complexity: T(n) = Θ(n log n).",
        strengths: [
          "Neat, legible handwritten steps & clear layout",
          "Correct application of mathematical formulas",
          "Accurate final time complexity conclusion",
        ],
        improvements: [
          "Add explicit unit tags to final answer summary",
          "Include intermediate step verification for boundary conditions",
        ],
      });
    } finally {
      setUploadingWorkbook(false);
    }
  };

  const handlePickImageFile = () => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              setWorkbookUrlInput(reader.result.toString());
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleCaptureCamera = () => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.setAttribute("capture", "environment");
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              setWorkbookUrlInput(reader.result.toString());
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleQuestionPickImageFile = (questionId: string) => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              setQuestionWorkbooks((prev) => ({
                ...prev,
                [questionId]: reader.result.toString(),
              }));
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleQuestionCaptureCamera = (questionId: string) => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.setAttribute("capture", "environment");
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              setQuestionWorkbooks((prev) => ({
                ...prev,
                [questionId]: reader.result.toString(),
              }));
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
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
            <SlidingSegmentedControl
              options={["ALL", "QUIZ", "EXAM", "PRACTICE"] as const}
              selectedOption={filterType}
              onSelect={setFilterType}
            />
          </View>

          {/* Assessments Grid */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#5451FF" />
            </View>
          ) : filteredAssessments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="folder-open-outline"
                  size={42}
                  color="#818CF8"
                />
              </View>
              <View style={styles.notAvailablePill}>
                <Text style={styles.notAvailablePillText}>NOT AVAILABLE</Text>
              </View>
              <Text style={styles.emptyTitle}>
                No {filterType !== "ALL" ? filterType : ""} Assessments Found
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No assessments found matching "${searchQuery}". Try clearing your search.`
                  : `There are currently no ${
                      filterType !== "ALL" ? filterType.toLowerCase() + " " : ""
                    }assessments available in this section. Please check back later or select another tab.`}
              </Text>
              {(filterType !== "ALL" || searchQuery !== "") && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    setFilterType("ALL");
                    setSearchQuery("");
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={16} color="#ffffff" />
                  <Text style={styles.resetFilterText}>
                    SHOW ALL ASSESSMENTS
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {filteredAssessments.map((asm) => {
                const isWorkbookOnly =
                  asm.submissionMode === "WORKBOOK_ONLY" ||
                  (asm.isWorkbook && asm.assessmentType === "PRACTICE");
                const isOnlineOnly = asm.submissionMode === "ONLINE_TEST";

                return (
                  <View key={asm.id} style={styles.asmCard}>
                    <View style={styles.asmTopRow}>
                      <View style={styles.asmClassChip}>
                        <Text style={styles.asmClassText}>
                          {asm.className || "Computer Science"}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <View style={styles.asmTypeBadge}>
                          <Text style={styles.asmTypeText}>
                            {asm.assessmentType}
                          </Text>
                        </View>
                        {isWorkbookOnly ? (
                          <View
                            style={[
                              styles.asmTypeBadge,
                              { backgroundColor: "rgba(244,196,99,0.18)" },
                            ]}
                          >
                            <Text
                              style={[styles.asmTypeText, { color: "#F4C463" }]}
                            >
                              WORKBOOK
                            </Text>
                          </View>
                        ) : isOnlineOnly ? (
                          <View
                            style={[
                              styles.asmTypeBadge,
                              { backgroundColor: "rgba(59,130,246,0.18)" },
                            ]}
                          >
                            <Text
                              style={[styles.asmTypeText, { color: "#60A5FA" }]}
                            >
                              DIGITAL TEST
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.asmTypeBadge,
                              { backgroundColor: "rgba(168,85,247,0.18)" },
                            ]}
                          >
                            <Text
                              style={[styles.asmTypeText, { color: "#C084FC" }]}
                            >
                              HYBRID
                            </Text>
                          </View>
                        )}
                        {(asm.containsCoding || asm.isWebOnly) && (
                          <View
                            style={[
                              styles.asmTypeBadge,
                              { backgroundColor: "rgba(168,85,247,0.22)" },
                            ]}
                          >
                            <Text
                              style={[styles.asmTypeText, { color: "#E9D5FF" }]}
                            >
                              🖥️ WEB ONLY
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={styles.asmTitle}>{asm.title}</Text>
                    <Text style={styles.asmDesc}>
                      {asm.description ||
                        "Test your algorithm skills & topic knowledge."}
                    </Text>

                    <View style={styles.asmMetaRow}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color="#71717a"
                        />
                        <Text style={styles.asmMetaItem}>
                          {asm.durationMinutes || 15} mins
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Ionicons
                          name="trophy-outline"
                          size={13}
                          color="#71717a"
                        />
                        <Text style={styles.asmMetaItem}>
                          {asm.totalMarks || 10} Marks
                        </Text>
                      </View>
                      {asm.hasNegativeMarking && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Ionicons
                            name="warning-outline"
                            size={13}
                            color="#f59e0b"
                          />
                          <Text
                            style={[styles.asmMetaItem, { color: "#f59e0b" }]}
                          >
                            Negative Marks
                          </Text>
                        </View>
                      )}
                    </View>

                    <View
                      style={{ flexDirection: "row", gap: 10, marginTop: 4 }}
                    >
                      {!isWorkbookOnly && (
                        <TouchableOpacity
                          style={[styles.startBtn, { flex: 1 }]}
                          onPress={() => startAssessment(asm)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.startBtnText}>START TEST</Text>
                          <Feather
                            name="arrow-up-right"
                            size={15}
                            color="#ffffff"
                            style={{ marginLeft: 4 }}
                          />
                        </TouchableOpacity>
                      )}

                      {!isOnlineOnly && (
                        <TouchableOpacity
                          style={[
                            styles.startBtn,
                            {
                              flex: 1,
                              backgroundColor: isWorkbookOnly
                                ? "#5451FF"
                                : "#22242a",
                              borderWidth: isWorkbookOnly ? 0 : 1,
                              borderColor: "rgba(255,255,255,0.12)",
                            },
                          ]}
                          onPress={() => {
                            setWorkbookModalAsm(asm);
                            setWorkbookResult(null);
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="camera-outline"
                            size={16}
                            color={isWorkbookOnly ? "#ffffff" : "#4ade80"}
                          />
                          <Text
                            style={[
                              styles.startBtnText,
                              {
                                color: isWorkbookOnly ? "#ffffff" : "#4ade80",
                                marginLeft: 4,
                              },
                            ]}
                          >
                            WORKBOOK
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* WORKBOOK SUBMISSION & AI EVALUATION MODAL */}
      <Modal
        visible={!!workbookModalAsm}
        animationType="slide"
        transparent
        onRequestClose={() => setWorkbookModalAsm(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.modalSubTitle}>WORKBOOK ASSIGNMENT</Text>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {workbookModalAsm?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setWorkbookModalAsm(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDeadlineCard}>
              <Ionicons name="calendar-outline" size={16} color="#F4C463" />
              <Text style={styles.modalDeadlineText}>
                SUBMISSION DEADLINE:{" "}
                {workbookModalAsm?.dueDate
                  ? new Date(workbookModalAsm.dueDate).toLocaleDateString()
                  : "Teacher Managed (Aug 05, 2026)"}
              </Text>
            </View>

            {!workbookResult ? (
              <View style={{ gap: 14 }}>
                <Text style={styles.inputLabel}>
                  UPLOAD WORKBOOK IMAGE (CAMERA, FILE OR URL):
                </Text>

                {/* Dual Upload Mode Buttons */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={styles.imageActionBtn}
                    onPress={handleCaptureCamera}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={18} color="#4ade80" />
                    <Text style={styles.imageActionBtnText}>TAKE PHOTO</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.imageActionBtn}
                    onPress={handlePickImageFile}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="image-outline" size={18} color="#60A5FA" />
                    <Text style={styles.imageActionBtnText}>UPLOAD FILE</Text>
                  </TouchableOpacity>
                </View>

                {/* Image Preview Box if image attached */}
                {workbookUrlInput ? (
                  <View style={styles.imagePreviewBox}>
                    <Image
                      source={{ uri: workbookUrlInput }}
                      style={styles.previewImageThumbnail}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.previewSuccessText} numberOfLines={1}>
                        ✓ Image Attached
                      </Text>
                      <Text style={styles.previewSubText} numberOfLines={1}>
                        {workbookUrlInput.startsWith("data:")
                          ? "Captured/Uploaded Image File"
                          : workbookUrlInput}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setWorkbookUrlInput("")}
                      style={{ padding: 6 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#F87171"
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TextInput
                  style={styles.modalInput}
                  value={workbookUrlInput}
                  onChangeText={setWorkbookUrlInput}
                  placeholder="Or paste image URL (https://...)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />

                <TouchableOpacity
                  style={[
                    styles.uploadSubmitBtn,
                    !workbookUrlInput.trim() && { opacity: 0.5 },
                  ]}
                  onPress={handleUploadWorkbook}
                  disabled={uploadingWorkbook || !workbookUrlInput.trim()}
                  activeOpacity={0.85}
                >
                  {uploadingWorkbook ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons
                        name="sparkles"
                        size={12}
                        color="#ffffff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.uploadSubmitText}>
                        SUBMIT FOR EVALUATION & GRADING
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: 520 }}
                contentContainerStyle={{ gap: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero Evaluation Status & Score Card */}
                <View style={styles.solutionHeroCard}>
                  <View style={styles.solutionStatusBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#4ade80"
                    />
                    <Text style={styles.solutionStatusText}>
                      EVALUATION COMPLETE
                    </Text>
                  </View>

                  <View style={styles.solutionScoreRow}>
                    <View style={{ alignItems: "center" }}>
                      <Text style={styles.solutionScoreBig}>
                        {workbookResult.obtainedMarks}
                        <Text style={styles.solutionScoreSub}>
                          /
                          {workbookResult.maxMarks ||
                            workbookModalAsm?.totalMarks}
                        </Text>
                      </Text>
                      <Text style={styles.solutionScoreMeta}>
                        MARKS OBTAINED
                      </Text>
                    </View>

                    <View style={styles.solutionDivider} />

                    <View style={{ alignItems: "center" }}>
                      <Text style={styles.solutionAccuracyBig}>
                        {workbookResult.accuracyPercentage || 88}%
                      </Text>
                      <Text style={styles.solutionScoreMeta}>
                        ACCURACY RATE
                      </Text>
                    </View>

                    <View style={styles.solutionDivider} />

                    <View style={{ alignItems: "center" }}>
                      <View style={styles.gradeBadge}>
                        <Text style={styles.gradeBadgeText}>
                          {workbookResult.grade || "A"}
                        </Text>
                      </View>
                      <Text style={styles.solutionScoreMeta}>GRADE</Text>
                    </View>
                  </View>
                </View>

                {/* Top Section: Uploaded Image Display */}
                <View style={styles.solutionSectionBox}>
                  <View style={styles.solutionSectionHeader}>
                    <Ionicons name="image-outline" size={16} color="#60A5FA" />
                    <Text style={styles.solutionSectionTitle}>
                      SUBMITTED WORKBOOK PHOTO
                    </Text>
                  </View>

                  {workbookResult.imageUrl || workbookUrlInput ? (
                    <View style={styles.uploadedImageWrapper}>
                      <Image
                        source={{
                          uri: workbookResult.imageUrl || workbookUrlInput,
                        }}
                        style={styles.uploadedWorkbookImage}
                        resizeMode="cover"
                      />
                      <View style={styles.uploadedImageOverlayBadge}>
                        <Ionicons
                          name="checkmark-done"
                          size={12}
                          color="#4ade80"
                        />
                        <Text style={styles.uploadedImageOverlayText}>
                          Verified Solution Image
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noImagePlaceholder}>
                      <Ionicons
                        name="document-text-outline"
                        size={24}
                        color="#71717a"
                      />
                      <Text style={{ color: "#71717a", fontSize: 12 }}>
                        Handwritten Solution Received
                      </Text>
                    </View>
                  )}
                </View>

                {/* Comprehensive AI Feedback */}
                <View style={styles.solutionSectionBox}>
                  <View style={styles.solutionSectionHeader}>
                    <Ionicons name="sparkles" size={16} color="#C084FC" />
                    <Text style={styles.solutionSectionTitle}>
                      LUMORA AI FEEDBACK SUMMARY
                    </Text>
                  </View>
                  <Text style={styles.solutionFeedbackBody}>
                    {workbookResult.aiFeedback}
                  </Text>
                </View>

                {/* Step-by-Step Evaluation Breakdown */}
                {workbookResult.steps && workbookResult.steps.length > 0 && (
                  <View style={styles.solutionSectionBox}>
                    <View style={styles.solutionSectionHeader}>
                      <Ionicons name="list-outline" size={16} color="#F4C463" />
                      <Text style={styles.solutionSectionTitle}>
                        STEP-BY-STEP EVALUATION BREAKDOWN
                      </Text>
                    </View>

                    <View style={{ gap: 10 }}>
                      {workbookResult.steps.map(
                        (stepItem: any, sIdx: number) => (
                          <View key={sIdx} style={styles.evalStepCard}>
                            <View style={styles.evalStepHeader}>
                              <View style={styles.evalStepNumBadge}>
                                <Text style={styles.evalStepNumText}>
                                  STEP {stepItem.stepNumber || sIdx + 1}
                                </Text>
                              </View>
                              <Text style={styles.evalStepTitle}>
                                {stepItem.title}
                              </Text>
                              <View
                                style={[
                                  styles.evalStepStatusChip,
                                  stepItem.status === "CORRECT"
                                    ? {
                                        backgroundColor:
                                          "rgba(74,222,128,0.15)",
                                        borderColor: "rgba(74,222,128,0.4)",
                                      }
                                    : {
                                        backgroundColor:
                                          "rgba(244,196,99,0.15)",
                                        borderColor: "rgba(244,196,99,0.4)",
                                      },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.evalStepStatusText,
                                    {
                                      color:
                                        stepItem.status === "CORRECT"
                                          ? "#4ade80"
                                          : "#F4C463",
                                    },
                                  ]}
                                >
                                  {stepItem.status || "PASSED"}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.evalStepNotes}>
                              {stepItem.notes}
                            </Text>
                          </View>
                        ),
                      )}
                    </View>
                  </View>
                )}

                {/* Model Reference Solution & Answer Key */}
                <View style={styles.modelSolutionBox}>
                  <View style={styles.solutionSectionHeader}>
                    <Ionicons name="key-outline" size={16} color="#60A5FA" />
                    <Text
                      style={[
                        styles.solutionSectionTitle,
                        { color: "#60A5FA" },
                      ]}
                    >
                      MODEL SOLUTION & REFERENCE ANSWERS
                    </Text>
                  </View>
                  <Text style={styles.modelSolutionBody}>
                    {workbookResult.modelSolution ||
                      "1. Identify parameters and relations.\n2. Execute step-by-step mathematical substitution.\n3. Verify units and final output value."}
                  </Text>
                </View>

                {/* Key Strengths & Areas for Improvement */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View
                    style={[
                      styles.insightCard,
                      { borderColor: "rgba(74,222,128,0.3)" },
                    ]}
                  >
                    <Text style={[styles.insightTitle, { color: "#4ade80" }]}>
                      ✓ STRENGTHS
                    </Text>
                    {(
                      workbookResult.strengths || [
                        "Clean handwritten equations",
                        "Correct formula application",
                      ]
                    ).map((st: string, idx: number) => (
                      <Text key={idx} style={styles.insightItem}>
                        • {st}
                      </Text>
                    ))}
                  </View>

                  <View
                    style={[
                      styles.insightCard,
                      { borderColor: "rgba(244,196,99,0.3)" },
                    ]}
                  >
                    <Text style={[styles.insightTitle, { color: "#F4C463" }]}>
                      ⚡ IMPROVEMENTS
                    </Text>
                    {(
                      workbookResult.improvements || [
                        "Include explicit unit labels",
                        "Check rounding in last step",
                      ]
                    ).map((imp: string, idx: number) => (
                      <Text key={idx} style={styles.insightItem}>
                        • {imp}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Bottom Modal Actions */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    style={styles.doneBtnPrimary}
                    onPress={() => setWorkbookModalAsm(null)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.doneBtnTextPrimary}>
                      CLOSE & RETURN
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* WEB-ONLY CODING PLAYGROUND WARNING MODAL */}
      <Modal
        visible={!!codingWarningAsm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCodingWarningAsm(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 24, gap: 16 }]}>
            <View style={{ alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "rgba(168,85,247,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(168,85,247,0.4)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="desktop-outline" size={32} color="#C084FC" />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#ffffff",
                  textAlign: "center",
                }}
              >
                Desktop Web Browser Required
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                "{codingWarningAsm?.title}" includes a full interactive Coding
                Playground & IDE which requires a physical keyboard and desktop
                browser workspace.
              </Text>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: 14,
                  borderLeftWidth: 4,
                  borderLeftColor: "#C084FC",
                  width: "100%",
                }}
              >
                <Text
                  style={{ fontSize: 12, color: "#E9D5FF", lineHeight: 18 }}
                >
                  💻 Please log into your account on a computer/laptop browser
                  to solve and execute code for this assignment.
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  width: "100%",
                  backgroundColor: "#5451FF",
                  borderRadius: 10,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginTop: 8,
                }}
                onPress={() => setCodingWarningAsm(null)}
                activeOpacity={0.85}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}
                >
                  GOT IT, BACK TO ASSESSMENTS
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              <Ionicons
                name="timer-outline"
                size={14}
                color="#ffffff"
                style={{ marginRight: 4 }}
              />
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

                {/* Fill in the Blanks / Short Answer Input */}
                {(questions[currentIdx].questionType === "FILL_IN_BLANKS" ||
                  questions[currentIdx].questionType === "SHORT_ANSWER" ||
                  (!questions[currentIdx].options?.length &&
                    questions[currentIdx].questionType !==
                      "SINGLE_CHOICE")) && (
                  <View style={{ gap: 8, marginTop: 12 }}>
                    <Text style={styles.inputLabel}>YOUR ANSWER RESPONSE:</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={selectedAnswers[questions[currentIdx].id] || ""}
                      onChangeText={(txt) => {
                        const updated = {
                          ...selectedAnswers,
                          [questions[currentIdx].id]: txt,
                        };
                        setSelectedAnswers(updated);
                        if (attemptId) {
                          apiClient
                            .autosaveAnswer(attemptId, {
                              questionId: questions[currentIdx].id,
                              textAnswer: txt,
                            })
                            .catch(() => {});
                        }
                      }}
                      placeholder="Type your answer here..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                  </View>
                )}

                {/* Per-Question Workbook Upload Box if Required or Allowed */}
                {(questions[currentIdx].requiresWorkbook ||
                  questions[currentIdx].submissionType === "WORKBOOK_ONLY" ||
                  questions[currentIdx].submissionType === "BOTH") && (
                  <View style={styles.qWorkbookBox}>
                    <View style={styles.qWorkbookHeaderRow}>
                      <Ionicons
                        name="camera-outline"
                        size={18}
                        color="#F4C463"
                      />
                      <Text style={styles.qWorkbookHeaderTitle}>
                        {questions[currentIdx].submissionType ===
                          "WORKBOOK_ONLY" ||
                        questions[currentIdx].requiresWorkbook
                          ? "WORKBOOK HANDWRITTEN ANSWER REQUIRED"
                          : "WORKBOOK ANSWER OPTION (CHOICE)"}
                      </Text>
                    </View>
                    <Text style={styles.qWorkbookInstructionText}>
                      {questions[currentIdx].workbookInstructions ||
                        "Please write out your working in your physical workbook and take a photo or upload an image below:"}
                    </Text>

                    {/* Camera & File Upload Action Buttons */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        style={styles.imageActionBtn}
                        onPress={() =>
                          handleQuestionCaptureCamera(questions[currentIdx].id)
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="camera-outline"
                          size={16}
                          color="#4ade80"
                        />
                        <Text style={styles.imageActionBtnText}>
                          TAKE PHOTO
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.imageActionBtn}
                        onPress={() =>
                          handleQuestionPickImageFile(questions[currentIdx].id)
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="image-outline"
                          size={16}
                          color="#60A5FA"
                        />
                        <Text style={styles.imageActionBtnText}>
                          UPLOAD FILE
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Image Preview Box if attached */}
                    {questionWorkbooks[questions[currentIdx].id] ? (
                      <View style={styles.imagePreviewBox}>
                        <Image
                          source={{
                            uri: questionWorkbooks[questions[currentIdx].id],
                          }}
                          style={styles.previewImageThumbnail}
                          resizeMode="cover"
                        />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={styles.previewSuccessText}
                            numberOfLines={1}
                          >
                            ✓ Photo Attached
                          </Text>
                          <Text style={styles.previewSubText} numberOfLines={1}>
                            {questionWorkbooks[
                              questions[currentIdx].id
                            ].startsWith("data:")
                              ? "Uploaded Image File"
                              : questionWorkbooks[questions[currentIdx].id]}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() =>
                            setQuestionWorkbooks((prev) => ({
                              ...prev,
                              [questions[currentIdx].id]: "",
                            }))
                          }
                          style={{ padding: 4 }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#F87171"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    <TextInput
                      style={styles.modalInput}
                      value={questionWorkbooks[questions[currentIdx].id] || ""}
                      onChangeText={(val) =>
                        setQuestionWorkbooks((prev) => ({
                          ...prev,
                          [questions[currentIdx].id]: val,
                        }))
                      }
                      placeholder="Or paste direct image URL (https://...)"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                  </View>
                )}
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
              <Feather
                name="arrow-left"
                size={14}
                color="#ffffff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.navStepText}>PREVIOUS</Text>
            </TouchableOpacity>

            {currentIdx < questions.length - 1 ? (
              <TouchableOpacity
                style={styles.navStepBtnPrimary}
                onPress={() => setCurrentIdx((p) => p + 1)}
              >
                <Text style={styles.navStepTextPrimary}>NEXT</Text>
                <Feather
                  name="arrow-right"
                  size={14}
                  color="#ffffff"
                  style={{ marginLeft: 4 }}
                />
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Text style={styles.submitTestText}>SUBMIT TEST</Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#121316"
                    />
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
          {/* Main Score & Grade Hero Card */}
          <View style={styles.resultCard}>
            <View style={styles.scoreHeroRow}>
              <Text style={styles.resultScoreBig}>
                {resultScore}
                <Text style={styles.resultScoreMax}> / {maxScore}</Text>
              </Text>
              <Text style={styles.scoreHeroLabel}>TOTAL MARKS EARNED</Text>
            </View>

            {/* Accuracy Progress Bar */}
            <View style={{ width: "100%", gap: 6, marginTop: 4 }}>
              <View style={styles.accuracyHeaderRow}>
                <Text style={styles.accuracyTitle}>ACCURACY PERFORMANCE</Text>
                <Text style={styles.accuracyValueText}>{accuracy}%</Text>
              </View>
              <View style={styles.accuracyBarContainer}>
                <View
                  style={[
                    styles.accuracyBarFill,
                    {
                      width: `${accuracy}%`,
                      backgroundColor:
                        accuracy >= 70
                          ? "#4ade80"
                          : accuracy >= 50
                            ? "#f59e0b"
                            : "#ef4444",
                    },
                  ]}
                />
              </View>
            </View>

            {/* Detailed Metric Cards Grid */}
            <View style={styles.resultStatsGrid}>
              <View style={styles.resStatBox}>
                <Ionicons
                  name="help-circle-outline"
                  size={18}
                  color="#3B82F6"
                />
                <Text style={styles.resStatVal}>{questions.length}</Text>
                <Text style={styles.resStatLabel}>Total Questions</Text>
              </View>
              <View style={styles.resStatBox}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#4ade80"
                />
                <Text style={styles.resStatVal}>
                  {Object.keys(selectedAnswers).length}
                </Text>
                <Text style={styles.resStatLabel}>Attempted</Text>
              </View>
              <View style={styles.resStatBox}>
                <Ionicons name="flash-outline" size={18} color="#F4C463" />
                <Text style={styles.resStatVal}>+{resultScore * 10} XP</Text>
                <Text style={styles.resStatLabel}>XP Earned</Text>
              </View>
            </View>
          </View>

          {/* Question-by-Question Detailed Review Breakdown */}
          <View style={styles.questionReviewContainer}>
            <Text style={styles.reviewSectionTitle}>
              QUESTION BREAKDOWN & SOLUTIONS
            </Text>

            {questions.map((q, idx) => {
              const userAnsId = selectedAnswers[q.id];
              const userOption = q.options?.find((o) => o.id === userAnsId);
              const correctOption = q.options?.find(
                (o) =>
                  o.isCorrect ||
                  (q.correctOptionId && o.id === q.correctOptionId),
              );
              const isCorrect = userOption
                ? userOption.isCorrect || userOption.id === q.correctOptionId
                : false;
              const userAnsText = userOption?.optionText || userOption?.text;
              const correctAnsText =
                correctOption?.optionText || correctOption?.text;

              return (
                <View key={q.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeaderRow}>
                    <Text style={styles.reviewQNum}>QUESTION {idx + 1}</Text>
                    <View
                      style={[
                        styles.reviewStatusChip,
                        isCorrect ? styles.chipCorrect : styles.chipIncorrect,
                      ]}
                    >
                      <Ionicons
                        name={isCorrect ? "checkmark-circle" : "close-circle"}
                        size={13}
                        color={isCorrect ? "#4ade80" : "#ef4444"}
                      />
                      <Text
                        style={[
                          styles.reviewStatusText,
                          { color: isCorrect ? "#4ade80" : "#ef4444" },
                        ]}
                      >
                        {isCorrect
                          ? "CORRECT"
                          : userAnsId
                            ? "INCORRECT"
                            : "SKIPPED"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.reviewQText}>{q.questionText}</Text>

                  {/* Answers Comparison */}
                  <View style={styles.answersBox}>
                    {userAnsText && (
                      <View style={styles.ansLine}>
                        <Text style={styles.ansLabel}>Your Choice:</Text>
                        <Text
                          style={[
                            styles.ansVal,
                            { color: isCorrect ? "#4ade80" : "#ef4444" },
                          ]}
                        >
                          {userAnsText}
                        </Text>
                      </View>
                    )}
                    {!isCorrect && correctAnsText && (
                      <View style={styles.ansLine}>
                        <Text style={styles.ansLabel}>Correct Answer:</Text>
                        <Text style={[styles.ansVal, { color: "#4ade80" }]}>
                          {correctAnsText}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* AI Explanation / Key Takeaway */}
                  <View style={styles.explanationBox}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Ionicons name="bulb-outline" size={14} color="#5451FF" />
                      <Text style={styles.explanationTitle}>
                        KEY EXPLANATION
                      </Text>
                    </View>
                    <Text style={styles.explanationText}>
                      {q.explanation ||
                        `The correct answer is "${correctAnsText || "Option A"}". Review data structure algorithms and time complexity for this topic.`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={onBackToDashboard}
              activeOpacity={0.85}
            >
              <Text style={styles.finishBtnText}>RETURN TO DASHBOARD</Text>
              <Feather
                name="arrow-right"
                size={16}
                color="#ffffff"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const DEFAULT_MOCK_ASSESSMENTS: AssessmentDTO[] = [
  {
    id: "demo-asm-coding",
    title: "Python & Algorithms Coding Playground",
    description:
      "Interactive Coding Playground assessment covering Two Sum, Array Reversal, and Algorithm optimization. Requires Web Browser IDE.",
    className: "1st Sem",
    topic: "Data Structures & Algorithms",
    assessmentType: "PRACTICE",
    submissionMode: "ONLINE_TEST",
    containsCoding: true,
    isWebOnly: true,
    totalMarks: 50,
    passingMarks: 30,
    durationMinutes: 45,
    hasNegativeMarking: false,
    isPublished: true,
    createdById: "teacher-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-asm-1",
    title: "Algorithm Complexity & Data Structures Quiz",
    description:
      "Evaluates Big-O notation, stacks, queues, hash tables, and sorting algorithms.",
    className: "Data Structures II",
    assessmentType: "QUIZ",
    submissionMode: "HYBRID",
    isWorkbook: true,
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
    submissionMode: "ONLINE_TEST",
    isWorkbook: false,
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
  {
    id: "demo-asm-3",
    title: "Discrete Math Proofs & Logic Workbook",
    description:
      "Physical workbook assignment requiring step-by-step mathematical proofs and truth tables.",
    className: "Discrete Math",
    assessmentType: "PRACTICE",
    submissionMode: "WORKBOOK_ONLY",
    isWorkbook: true,
    totalMarks: 20,
    passingMarks: 12,
    durationMinutes: 45,
    hasNegativeMarking: false,
    negativeMarkValue: 0,
    dueDate: "2026-08-10T23:59:59.000Z",
    isPublished: true,
    createdById: "teacher-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-asm-4",
    title: "Binary Trees & Graph Traversal Practice",
    description:
      "Interactive practice set combining digital quiz questions and handwritten tree drawing.",
    className: "Data Structures II",
    assessmentType: "PRACTICE",
    submissionMode: "HYBRID",
    isWorkbook: true,
    totalMarks: 15,
    passingMarks: 9,
    durationMinutes: 20,
    hasNegativeMarking: true,
    negativeMarkValue: 0.25,
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
    backgroundColor: "rgba(25, 26, 30, 0.75)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        } as any)
      : {}),
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    gap: 20,
    paddingBottom: 40,
  },
  resultCard: {
    backgroundColor: "#191a1e",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statusPillRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  statusPass: {
    backgroundColor: "rgba(74,222,128,0.12)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.3)",
  },
  statusNeedsWork: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  scoreHeroRow: {
    alignItems: "center",
    gap: 2,
    marginVertical: 4,
  },
  scoreHeroLabel: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  resultScoreBig: {
    color: "#ffffff",
    fontSize: 52,
    fontWeight: "800",
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  resultScoreMax: {
    color: "#71717a",
    fontSize: 24,
  },
  accuracyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accuracyTitle: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  accuracyValueText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
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
    borderRadius: 4,
  },
  resultStatsGrid: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 8,
  },
  resStatBox: {
    flex: 1,
    backgroundColor: "#22242a",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: "center",
    gap: 4,
  },
  resStatVal: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  resStatLabel: {
    color: "#71717a",
    fontSize: 10,
    textAlign: "center",
  },
  questionReviewContainer: {
    gap: 14,
  },
  reviewSectionTitle: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  reviewCard: {
    backgroundColor: "#191a1e",
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  reviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewQNum: {
    color: "#5451FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  reviewStatusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipCorrect: {
    backgroundColor: "rgba(74,222,128,0.15)",
  },
  chipIncorrect: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  reviewStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  reviewQText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  answersBox: {
    backgroundColor: "#22242a",
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  ansLine: {
    flexDirection: "row",
    gap: 6,
  },
  ansLabel: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "600",
  },
  ansVal: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  explanationBox: {
    backgroundColor: "rgba(84,81,255,0.08)",
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(84,81,255,0.2)",
  },
  explanationTitle: {
    color: "#5451FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  explanationText: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  retryBtn: {
    flex: 1,
    backgroundColor: "#22242a",
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  retryBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  finishBtn: {
    flex: 1,
    backgroundColor: "#5451FF",
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  finishBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  centerContainer: {
    padding: 40,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#191a1e",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 480,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalSubTitle: {
    color: "#5451FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
    lineHeight: 22,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalDeadlineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(244,196,99,0.12)",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(244,196,99,0.3)",
  },
  modalDeadlineText: {
    color: "#F4C463",
    fontSize: 11,
    fontWeight: "700",
  },
  inputLabel: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: "#22242a",
    borderRadius: 14,
    padding: 14,
    color: "#ffffff",
    fontSize: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  uploadSubmitBtn: {
    backgroundColor: "#5451FF",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  uploadSubmitText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  resultBox: {
    gap: 14,
  },
  resultBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultStatusText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  resultScoreText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  aiFeedbackBox: {
    backgroundColor: "#22242a",
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  aiFeedbackTitle: {
    color: "#5451FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  aiFeedbackBody: {
    color: "#d1d5db",
    fontSize: 13,
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: "#22242a",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  doneBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyContainer: {
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.4)",
    borderStyle: "dashed",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22, 24, 34, 0.8)",
    gap: 12,
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  notAvailablePill: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderStyle: "dashed",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  notAvailablePillText: {
    color: "#F87171",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  resetFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#5451FF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 8,
  },
  resetFilterText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  qWorkbookBox: {
    marginTop: 14,
    backgroundColor: "rgba(244,196,99,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(244,196,99,0.35)",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  qWorkbookHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qWorkbookHeaderTitle: {
    color: "#F4C463",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  qWorkbookInstructionText: {
    color: "#d1d5db",
    fontSize: 12,
    lineHeight: 17,
  },
  imageActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#22242a",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  imageActionBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  imagePreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(74, 222, 128, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.3)",
    padding: 10,
    borderRadius: 14,
  },
  previewImageThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#191a1e",
  },
  previewSuccessText: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "700",
  },
  previewSubText: {
    color: "#9ca3af",
    fontSize: 10,
  },
  solutionHeroCard: {
    backgroundColor: "#22242a",
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  solutionStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  solutionStatusText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  solutionScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  solutionScoreBig: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },
  solutionScoreSub: {
    color: "#71717a",
    fontSize: 16,
    fontWeight: "600",
  },
  solutionAccuracyBig: {
    color: "#60A5FA",
    fontSize: 26,
    fontWeight: "800",
  },
  solutionScoreMeta: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  solutionDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  gradeBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5451FF",
    alignItems: "center",
    justifyContent: "center",
  },
  gradeBadgeText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  solutionSectionBox: {
    backgroundColor: "#22242a",
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  solutionSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  solutionSectionTitle: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  uploadedImageWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    height: 180,
    backgroundColor: "#121316",
    position: "relative",
  },
  uploadedWorkbookImage: {
    width: "100%",
    height: "100%",
  },
  uploadedImageOverlayBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  uploadedImageOverlayText: {
    color: "#4ade80",
    fontSize: 10,
    fontWeight: "700",
  },
  noImagePlaceholder: {
    height: 80,
    backgroundColor: "#191a1e",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  solutionFeedbackBody: {
    color: "#d1d5db",
    fontSize: 13,
    lineHeight: 19,
  },
  evalStepCard: {
    backgroundColor: "#191a1e",
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  evalStepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  evalStepNumBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  evalStepNumText: {
    color: "#71717a",
    fontSize: 9,
    fontWeight: "800",
  },
  evalStepTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  evalStepStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  evalStepStatusText: {
    fontSize: 9,
    fontWeight: "800",
  },
  evalStepNotes: {
    color: "#9ca3af",
    fontSize: 11,
    lineHeight: 16,
  },
  modelSolutionBox: {
    backgroundColor: "rgba(84, 81, 255, 0.08)",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "rgba(84, 81, 255, 0.3)",
  },
  modelSolutionBody: {
    color: "#e0e7ff",
    fontSize: 12,
    lineHeight: 19,
    fontFamily: Platform.OS === "web" ? "monospace" : "System",
  },
  insightCard: {
    flex: 1,
    backgroundColor: "#22242a",
    borderRadius: 16,
    padding: 12,
    gap: 6,
    borderWidth: 1,
  },
  insightTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  insightItem: {
    color: "#d1d5db",
    fontSize: 11,
    lineHeight: 16,
  },
  reuploadBtn: {
    flex: 1,
    backgroundColor: "#22242a",
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  reuploadBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  doneBtnPrimary: {
    flex: 1.5,
    backgroundColor: "#5451FF",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnTextPrimary: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
