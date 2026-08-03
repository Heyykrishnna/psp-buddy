import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const DEFAULT_PYTHON_STARTER = `def two_sum(nums, target):
    """
    Find two numbers in 'nums' that sum up to 'target'.
    Returns list of indices [index1, index2].
    """
    seen = {}
    for idx, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], idx]
        seen[num] = idx
    return []

# Driver Code
if __name__ == "__main__":
    nums = [2, 7, 11, 15]
    target = 9
    print(two_sum(nums, target))
`;

interface PlaygroundScreenProps {
  onBackToDashboard: () => void;
  initialProblemId?: string;
}

export function PlaygroundScreen({ onBackToDashboard, initialProblemId }: PlaygroundScreenProps) {
  const { apiClient: client, user } = useAuth();
  const [problemId, setProblemId] = useState<string>(initialProblemId || 'two-sum');
  const [problemTitle, setProblemTitle] = useState<string>('Two Sum');
  const [problemDesc, setProblemDesc] = useState<string>(
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.'
  );
  const [language, setLanguage] = useState<'python' | 'javascript' | 'cpp'>('python');
  const [code, setCode] = useState<string>(DEFAULT_PYTHON_STARTER);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Tabs
  const [activeTopTab, setActiveTopTab] = useState<'problem' | 'editor' | 'problems_list'>('editor');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'output' | 'error' | 'tests' | 'result' | 'history'>('output');

  // Execution states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);

  // Problems List & Filter
  const [problemsList, setProblemsList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');

  useEffect(() => {
    loadProblemDetails(problemId);
    loadProblemsList();
  }, [problemId]);

  const loadProblemDetails = async (id: string) => {
    try {
      if (!client) return;
      const data = await client.getProblemById(id, user?.id);
      if (data) {
        setProblemTitle(data.title || id);
        setProblemDesc(data.description || '');
        setIsBookmarked(Boolean(data.isBookmarked));
        if (data.starterCodePython) setCode(data.starterCodePython);
      }
    } catch {
      // Fallback
    }
  };

  const loadProblemsList = async () => {
    try {
      if (!client) return;
      const data = await client.getProblems({
        search: search.trim() || undefined,
        difficulty: filterDifficulty !== 'ALL' ? filterDifficulty : undefined,
        userId: user?.id,
      });
      if (data && Array.isArray(data)) setProblemsList(data);
    } catch {
      // Keep existing
    }
  };

  const handleRunCode = async () => {
    setRunning(true);
    setActiveConsoleTab('output');
    setOutput('Compiling and executing code via Backend Judge API...');
    setErrorMessage(null);
    setTestResults(null);

    try {
      if (client) {
        const res = await client.runProblemCode(problemId, code, language);
        if (res) {
          if (res.status === 'COMPILATION_ERROR') {
            setErrorMessage(res.compileOutput || 'Compilation error.');
            setActiveConsoleTab('error');
            setOutput('');
          } else {
            setOutput(
              res.logs ||
                (res.allPassed
                  ? `All ${res.totalPassed}/${res.totalTests} test cases passed successfully!`
                  : `Passed ${res.totalPassed}/${res.totalTests} test cases.`)
            );
          }
          setTestResults(res.results || []);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Execution error.');
      setActiveConsoleTab('error');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    setSubmitting(true);
    setSubmissionResult(null);
    setActiveConsoleTab('result');

    try {
      if (client) {
        const res = await client.submitProblem(problemId, code, language);
        if (res) {
          setSubmissionResult(res);
          setTestResults(res.judgeResult?.results || []);
          fetchHistory();
        }
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit solution.');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = async () => {
    try {
      if (client) {
        const res = await client.getProblemSubmissions(problemId);
        if (res && Array.isArray(res)) setSubmissionHistory(res);
      }
    } catch {
      // Keep existing
    }
  };

  const handleToggleBookmark = async () => {
    setIsBookmarked((prev) => !prev);
    try {
      if (client) {
        const res = await client.toggleBookmark(problemId, user?.id);
        if (res && res.isBookmarked !== undefined) {
          setIsBookmarked(res.isBookmarked);
        }
      }
    } catch {
      // Rollback on error
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToDashboard} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTopTab('problem')} style={styles.titleBox}>
          <Text style={styles.problemTitleText} numberOfLines={1}>
            {problemTitle}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleToggleBookmark} style={styles.bookmarkBtn}>
          <Text style={styles.bookmarkIcon}>{isBookmarked ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      {/* Top Sub-Nav Tabs */}
      <View style={styles.topTabBar}>
        {(['editor', 'problem', 'problems_list'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => {
              setActiveTopTab(t);
              if (t === 'problems_list') loadProblemsList();
            }}
            style={[styles.topTabItem, activeTopTab === t && styles.topTabItemActive]}
          >
            <Text style={[styles.topTabText, activeTopTab === t && styles.topTabTextActive]}>
              {t === 'editor' ? 'IDE Code' : t === 'problem' ? 'Problem' : 'All Problems'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SCREEN VIEW SWITCH ──────────────────────────────────────────────── */}
      {activeTopTab === 'problem' && (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentPadding}>
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>{problemTitle}</Text>
            <Text style={styles.descText}>{problemDesc}</Text>
          </View>
        </ScrollView>
      )}

      {activeTopTab === 'problems_list' && (
        <View style={styles.flex1}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search problem title..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={(t) => {
                setSearch(t);
                loadProblemsList();
              }}
            />
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentPadding}>
            {problemsList.map((p) => (
              <TouchableOpacity
                key={p.id || p.slug}
                onPress={() => {
                  setProblemId(p.id || p.slug);
                  setActiveTopTab('editor');
                }}
                style={[
                  styles.problemRow,
                  (p.id === problemId || p.slug === problemId) && styles.problemRowActive,
                ]}
              >
                <View style={styles.flex1}>
                  <Text style={styles.problemRowTitle}>{p.title}</Text>
                  <Text style={styles.problemRowDiff}>{p.difficulty}</Text>
                </View>
                {p.isBookmarked && <Text style={styles.bmBadge}>★ Bookmarked</Text>}
                {p.userStatus === 'SOLVED' && <Text style={styles.solvedBadge}>✓ Solved</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {activeTopTab === 'editor' && (
        <View style={styles.flex1}>
          {/* Action Bar */}
          <View style={styles.actionBar}>
            <View style={styles.langPicker}>
              <Text style={styles.langText}>{language.toUpperCase()}</Text>
            </View>

            <View style={styles.actionBtnsRow}>
              <TouchableOpacity
                onPress={handleRunCode}
                disabled={running}
                style={[styles.btnRun, running && styles.btnDisabled]}
              >
                {running ? (
                  <ActivityIndicator size="small" color="#333" />
                ) : (
                  <Text style={styles.btnRunText}>▶ Run</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitCode}
                disabled={submitting}
                style={[styles.btnSubmit, submitting && styles.btnDisabled]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Monospace Code Input */}
          <View style={styles.codeContainer}>
            <TextInput
              style={styles.codeInput}
              multiline
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>

          {/* Bottom Console Panel */}
          <View style={styles.consoleContainer}>
            <ScrollView horizontal style={styles.consoleTabBar} showsHorizontalScrollIndicator={false}>
              {(['output', 'error', 'tests', 'result', 'history'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => {
                    setActiveConsoleTab(tab);
                    if (tab === 'history') fetchHistory();
                  }}
                  style={[styles.consoleTabItem, activeConsoleTab === tab && styles.consoleTabItemActive]}
                >
                  <Text
                    style={[
                      styles.consoleTabText,
                      activeConsoleTab === tab && styles.consoleTabTextActive,
                    ]}
                  >
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.consoleContent}>
              {activeConsoleTab === 'output' && (
                <Text style={styles.consoleOutputText}>
                  {output || 'Click "Run" or "Submit" to execute code.'}
                </Text>
              )}

              {activeConsoleTab === 'error' && (
                <Text style={styles.consoleErrorText}>
                  {errorMessage || 'No compilation/runtime errors.'}
                </Text>
              )}

              {activeConsoleTab === 'tests' && (
                <View>
                  {testResults && testResults.length > 0 ? (
                    testResults.map((tr: any, idx: number) => (
                      <View key={idx} style={styles.testResultRow}>
                        <Text style={styles.testResultTitle}>Test #{idx + 1}</Text>
                        <Text
                          style={[
                            styles.testResultStatus,
                            { color: tr.passed ? '#10B981' : '#EF4444' },
                          ]}
                        >
                          {tr.passed ? 'PASSED' : 'FAILED'}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.consoleOutputText}>No test case evaluations yet.</Text>
                  )}
                </View>
              )}

              {activeConsoleTab === 'result' && (
                <View>
                  {submissionResult ? (
                    <View style={styles.verdictCard}>
                      <Text style={styles.verdictTitle}>
                        {submissionResult.submission?.status || 'COMPLETED'}
                      </Text>
                      <Text style={styles.verdictSub}>
                        {submissionResult.submission?.passedTests} /{' '}
                        {submissionResult.submission?.totalTests} test cases passed
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.consoleOutputText}>Submit your code to view verdict.</Text>
                  )}
                </View>
              )}

              {activeConsoleTab === 'history' && (
                <View>
                  {submissionHistory.map((sub: any, idx: number) => (
                    <View key={sub.id || idx} style={styles.historyRow}>
                      <Text
                        style={[
                          styles.historyStatus,
                          { color: sub.status === 'ACCEPTED' ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        {sub.status}
                      </Text>
                      <Text style={styles.historyMeta}>
                        {sub.runtimeMs} ms · {new Date(sub.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  flex1: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  backBtn: { paddingRight: 12 },
  backBtnText: { color: '#0066FF', fontSize: 16, fontWeight: '600' },
  titleBox: { flex: 1, paddingHorizontal: 8 },
  problemTitleText: { fontSize: 15, fontWeight: '700', color: '#111' },
  bookmarkBtn: { padding: 4 },
  bookmarkIcon: { fontSize: 20, color: '#F59E0B' },

  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topTabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  topTabItemActive: { borderBottomColor: '#0066FF' },
  topTabText: { fontSize: 12, fontWeight: '600', color: '#666' },
  topTabTextActive: { color: '#0066FF' },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1E1E1E',
  },
  langPicker: { backgroundColor: '#2D2D2D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  langText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  actionBtnsRow: { flexDirection: 'row', gap: 8 },
  btnRun: { backgroundColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  btnRunText: { color: '#111', fontSize: 12, fontWeight: '700' },
  btnSubmit: { backgroundColor: '#0066FF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  btnSubmitText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },

  codeContainer: { flex: 1, backgroundColor: '#1E1E1E' },
  codeInput: { flex: 1, color: '#D4D4D4', fontFamily: 'monospace', fontSize: 13, padding: 12, textAlignVertical: 'top' },

  consoleContainer: { height: 180, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  consoleTabBar: { height: 36, backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  consoleTabItem: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  consoleTabItemActive: { borderBottomColor: '#0066FF' },
  consoleTabText: { fontSize: 11, fontWeight: '700', color: '#666' },
  consoleTabTextActive: { color: '#0066FF' },
  consoleContent: { padding: 12 },
  consoleOutputText: { fontSize: 12, fontFamily: 'monospace', color: '#111' },
  consoleErrorText: { fontSize: 12, fontFamily: 'monospace', color: '#EF4444', fontWeight: '700' },

  testResultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  testResultTitle: { fontSize: 12, fontWeight: '600', color: '#333' },
  testResultStatus: { fontSize: 12, fontWeight: '700' },

  verdictCard: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, padding: 12, borderRadius: 8 },
  verdictTitle: { fontSize: 14, fontWeight: '700', color: '#047857' },
  verdictSub: { fontSize: 12, color: '#065F46', marginTop: 2 },

  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyStatus: { fontSize: 12, fontWeight: '700' },
  historyMeta: { fontSize: 11, color: '#666' },

  scrollArea: { flex: 1 },
  contentPadding: { padding: 16 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  descText: { fontSize: 13, color: '#444', lineHeight: 20 },

  searchBar: { padding: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchInput: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontSize: 13, color: '#111' },

  problemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  problemRowActive: { borderColor: '#0066FF', backgroundColor: '#EFF6FF' },
  problemRowTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  problemRowDiff: { fontSize: 11, color: '#666', marginTop: 2 },
  bmBadge: { fontSize: 10, fontWeight: '700', color: '#D97706', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  solvedBadge: { fontSize: 10, fontWeight: '700', color: '#059669', backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
});
