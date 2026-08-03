import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

interface AiTutorScreenProps {
  onBackToDashboard: () => void;
}

export function AiTutorScreen({ onBackToDashboard }: AiTutorScreenProps) {
  const { apiClient: client } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Tutor. Ask me any question about programming logic, data structures, algorithms, or code debugging!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const updatedHistory = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      if (client) {
        const res = await client.chatTutor({
          message: userMsg,
          conversationHistory: updatedHistory,
        });

        if (res && res.message) {
          setMessages((prev) => [...prev, { role: 'assistant', content: res.message }]);
          return;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Here is a hint: try using a Hash Map to store seen elements for O(N) time complexity.',
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'AI Tutor service unavailable right now. Try again in a moment!' },
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
        <Text style={styles.headerTitle}>AI Tutor Chat</Text>
      </View>

      {/* Messages */}
      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatPadding}>
        {messages.map((m, idx) => (
          <View
            key={idx}
            style={[
              styles.bubble,
              m.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                m.role === 'user' ? styles.userBubbleText : styles.aiBubbleText,
              ]}
            >
              {m.content}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#0066FF" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask AI Tutor a question..."
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={loading || !input.trim()}
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },

  chatArea: { flex: 1 },
  chatPadding: { padding: 16, gap: 12 },

  bubble: { maxWidth: '82%', padding: 12, borderRadius: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0066FF', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 13, lineHeight: 18 },
  userBubbleText: { color: '#FFF' },
  aiBubbleText: { color: '#111' },

  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  loadingText: { fontSize: 12, color: '#666', fontStyle: 'italic' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 13,
    color: '#111',
  },
  sendBtn: { backgroundColor: '#0066FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
