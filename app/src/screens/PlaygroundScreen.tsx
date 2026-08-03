import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
} from "react-native";

interface PlaygroundScreenProps {
  onBackToDashboard: () => void;
  initialProblemId?: string;
}

export function PlaygroundScreen({ onBackToDashboard }: PlaygroundScreenProps) {
  const handleOpenWeb = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = "/student/playground";
      return;
    }
    Linking.openURL("http://localhost:3000/student/playground").catch(() => {
      // Fallback
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToDashboard} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Code IDE</Text>
      </View>

      {/* Web Only Block Card */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>💻</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>RESTRICTED TO WEB PLATFORM</Text>
          </View>

          <Text style={styles.title}>Code Playground is Web Only</Text>

          <Text style={styles.description}>
            Writing, compiling, and executing code using the Monaco Code IDE is
            optimized for desktop keyboard & screen displays.
          </Text>

          <Text style={styles.subDescription}>
            Please log in to PSP Lumora on your laptop or desktop browser to use
            the Code Playground and pass test cases.
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={onBackToDashboard}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>
                Return to Mobile Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
    backgroundColor: "#18181b",
  },
  backBtn: {
    paddingRight: 12,
  },
  backBtnText: {
    color: "#5451FF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 14,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(84, 81, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(84, 81, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 32,
  },
  badge: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#F87171",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 20,
  },
  subDescription: {
    fontSize: 12,
    color: "#71717a",
    textAlign: "center",
    lineHeight: 18,
  },
  buttonGroup: {
    width: "100%",
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#5451FF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryBtn: {
    width: "100%",
    backgroundColor: "#27272a",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "600",
  },
});
