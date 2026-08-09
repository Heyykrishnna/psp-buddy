import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
} from "react-native";
import { Loader } from "../components/Loader";
import { useAuth } from "../context/AuthContext";

interface AiTutorScreenProps {
  onBackToDashboard: () => void;
}

const QUICK_PROMPTS = [
  "Explain Two Sum Hash Map",
  "Master Theorem Complexity",
  "Array Reversal Algorithm",
  "How to debug infinite loop",
];

export function AiTutorScreen({ onBackToDashboard }: AiTutorScreenProps) {
  const { apiClient: client, user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Hello! I am your AI Tutor. Ask me any question about programming logic, data structures, algorithm complexities, or code debugging!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const studentId = user?.id;

  // Load chat history from DB on mount
  useEffect(() => {
    async function loadChatHistory() {
      if (!client) {
        setLoadingHistory(false);
        return;
      }
      try {
        const sessions = await client.getChatSessions(studentId);
        if (sessions && Array.isArray(sessions) && sessions.length > 0) {
          const latestSession = sessions[0];
          setActiveSessionId(latestSession.id);
          const historyMsgs = await client.getChatMessages(
            latestSession.id,
            studentId,
          );
          if (
            historyMsgs &&
            Array.isArray(historyMsgs) &&
            historyMsgs.length > 0
          ) {
            setMessages(
              historyMsgs.map((m: any) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content,
              })),
            );
          }
        }
      } catch {
        // Keep default greeting
      } finally {
        setLoadingHistory(false);
      }
    }
    loadChatHistory();
  }, [client, studentId]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || loading) return;

    setInput("");
    const userMsgObj = { role: "user" as const, content: query };
    setMessages((prev) => [...prev, userMsgObj]);
    setLoading(true);

    try {
      if (client) {
        let currentSId = activeSessionId;
        if (!currentSId) {
          const newSession = await client.createChatSession(
            "General CS",
            studentId,
          );
          if (newSession && newSession.id) {
            currentSId = newSession.id;
            setActiveSessionId(newSession.id);
          }
        }

        const res = await client.chatTutor({
          message: query,
          sessionId: currentSId || undefined,
          userId: studentId,
        });

        if (res && res.sessionId && !activeSessionId) {
          setActiveSessionId(res.sessionId);
        }

        const reply = res?.reply || res?.message;
        if (reply) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: reply },
          ]);
          return;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Here is a hint: use a Hash Map (dictionary) to store seen element indices. As you iterate, check if `target - current_element` exists in the map for O(N) time complexity.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "AI Tutor service is momentarily offline. Please try sending your prompt again!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToDashboard} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI TUTOR CHAT</Text>
      </View>

      {/* Suggested Quick Prompts */}
      <View style={styles.promptsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptsScroll}
        >
          {QUICK_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSend(prompt)}
              style={styles.promptChip}
              activeOpacity={0.8}
            >
              <Text style={styles.promptChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Messages List */}
      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={styles.chatPadding}
      >
        {loadingHistory ? (
          <View style={styles.loadingContainer}>
            <Loader size="small" color="#5451FF" />
            <Text style={styles.loadingText}>SYNCING CHAT HISTORY...</Text>
          </View>
        ) : (
          messages.map((m, idx) => (
            <View
              key={idx}
              style={[
                styles.bubbleContainer,
                m.role === "user"
                  ? styles.userBubbleContainer
                  : styles.aiBubbleContainer,
              ]}
            >
              {m.role === "assistant" && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI TUTOR</Text>
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  m.role === "user" ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    m.role === "user"
                      ? styles.userBubbleText
                      : styles.aiBubbleText,
                  ]}
                >
                  {m.content}
                </Text>
              </View>
            </View>
          ))
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <Loader size="small" color="#5451FF" />
            <Text style={styles.loadingText}>AI TUTOR IS THINKING...</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask AI Tutor a question..."
          placeholderTextColor="#71717a"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={loading || !input.trim()}
          style={[
            styles.sendBtn,
            (!input.trim() || loading) && styles.sendBtnDisabled,
          ]}
          activeOpacity={0.85}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5FB",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E3EAF4",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    paddingRight: 12,
  },
  backBtnText: {
    color: "#7366E8",
    fontSize: 16,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#20253D",
    letterSpacing: 1,
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  promptsContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E3EAF4",
  },
  promptsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  promptChip: {
    backgroundColor: "#F2F5F9",
    borderColor: "#DCE4EF",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  promptChipText: {
    color: "#59657C",
    fontSize: 11,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  chatArea: {
    flex: 1,
  },
  chatPadding: {
    padding: 16,
    gap: 16,
  },
  bubbleContainer: {
    maxWidth: "85%",
  },
  userBubbleContainer: {
    alignSelf: "flex-end",
  },
  aiBubbleContainer: {
    alignSelf: "flex-start",
  },
  aiBadge: {
    backgroundColor: "#F0EEFF",
    borderColor: "#D9D3FF",
    borderWidth: 1,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  aiBadgeText: {
    color: "#818cf8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  bubble: {
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#7366E8",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3EAF4",
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
  userBubbleText: {
    color: "#ffffff",
  },
  aiBubbleText: {
    color: "#4B5872",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  loadingText: {
    fontSize: 10,
    color: "#71717a",
    letterSpacing: 1,
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E3EAF4",
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F2F5F9",
    borderColor: "#DCE4EF",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 13,
    color: "#20253D",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
  sendBtn: {
    backgroundColor: "#7366E8",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_700Bold",
  },
});
