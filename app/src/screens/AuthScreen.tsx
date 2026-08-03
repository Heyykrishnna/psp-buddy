import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export function AuthScreen() {
  const { login, sendVerificationCode, register, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Email Confirmation Code state
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Animated values for smooth transitions
  const tabAnim = useRef(new Animated.Value(0)).current;
  const formFadeAnim = useRef(new Animated.Value(1)).current;

  const switchTab = (signUp: boolean) => {
    if (signUp === isSignUp) return;

    setError("");
    setInfoMessage("");

    // Smooth fade out -> switch -> fade in transition
    Animated.timing(formFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setIsSignUp(signUp);
      setCodeSent(false);

      Animated.spring(tabAnim, {
        toValue: signUp ? 1 : 0,
        useNativeDriver: true,
        stiffness: 280,
        damping: 22,
      }).start();

      Animated.timing(formFadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }
    setError("");
    setInfoMessage("");
    setLoading(true);
    try {
      const res = await sendVerificationCode(email.trim());
      setCodeSent(true);
      if (res.verificationCode) {
        setVerificationCode(res.verificationCode);
        setInfoMessage(`Code sent! (Code: ${res.verificationCode})`);
      } else {
        setInfoMessage("Confirmation code sent to your email!");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError("");
    setInfoMessage("");
    setLoading(true);
    try {
      if (isSignUp) {
        if (!firstName.trim() || !lastName.trim()) {
          setError("First and Last name are required.");
          setLoading(false);
          return;
        }
        if (!codeSent || !verificationCode.trim()) {
          setError("Please request and enter your confirmation code first.");
          setLoading(false);
          return;
        }
        await register(
          firstName.trim(),
          lastName.trim(),
          email.trim(),
          password,
          verificationCode.trim(),
        );
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const tabTranslateX = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (width - 40) / 2],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Wordmark Header */}
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmark}>PSP LUMORA</Text>
          </View>

          {/* Large Hero Heading */}
          <View style={styles.heroSection}>
            <Text style={styles.heroHeading}>
              {isSignUp ? "CREATE\nACCOUNT" : "SIGN IN"}
            </Text>
            <Text style={styles.heroSub}>
              {isSignUp
                ? "Verify your email with a confirmation code to get started."
                : "Access your personalised learning dashboard."}
            </Text>
          </View>

          {/* Animated Tab Switcher */}
          <View style={styles.tabContainer}>
            <Animated.View
              style={[
                styles.tabIndicator,
                { transform: [{ translateX: tabTranslateX }] },
              ]}
            />
            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => switchTab(false)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.tabLabel, !isSignUp && styles.tabLabelActive]}
              >
                SIGN IN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => switchTab(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.tabLabel, isSignUp && styles.tabLabelActive]}
              >
                REGISTER
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Messages */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {!!infoMessage && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>📧 {infoMessage}</Text>
            </View>
          )}

          {/* Form Card with Fade Animation */}
          <Animated.View style={[styles.formCard, { opacity: formFadeAnim }]}>
            {isSignUp && (
              <View style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>FIRST NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Jane"
                    placeholderTextColor="#71717a"
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>LAST NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    placeholderTextColor="#71717a"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              {isSignUp ? (
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="jane@lumora.edu"
                    placeholderTextColor="#71717a"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={handleSendCode}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnText}>
                      {codeSent ? "RESEND" : "GET CODE"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="jane@lumora.edu"
                  placeholderTextColor="#71717a"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            </View>

            {isSignUp && codeSent && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>CONFIRMATION CODE</Text>
                <TextInput
                  style={styles.input}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#71717a"
                  keyboardType="number-pad"
                />
              </View>
            )}

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#71717a"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.togglePasswordBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.togglePasswordText}>
                    {showPassword ? "HIDE" : "SHOW"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isSignUp ? "VERIFY & CREATE ACCOUNT" : "SIGN IN"}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Switch Tab Hint */}
          <TouchableOpacity
            onPress={() => switchTab(!isSignUp)}
            style={styles.toggleRow}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </Text>
          </TouchableOpacity>

          {/* Quick Demo Access Bar */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>QUICK ACCESS</Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={[styles.demoChip, { backgroundColor: "#5451FF" }]}
                onPress={() => loginAsDemo("STUDENT")}
                activeOpacity={0.85}
              >
                <Text style={styles.demoChipText}>STUDENT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoChip, { backgroundColor: "#FF5745" }]}
                onPress={() => loginAsDemo("TEACHER")}
                activeOpacity={0.85}
              >
                <Text style={styles.demoChipText}>TEACHER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoChip, { backgroundColor: "#121316" }]}
                onPress={() => loginAsDemo("ADMIN")}
                activeOpacity={0.85}
              >
                <Text style={styles.demoChipText}>ADMIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#B8C6B6",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 18,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  wordmark: {
    fontSize: 17,
    fontWeight: "900",
    color: "#121316",
    letterSpacing: 1,
  },
  heroSection: {
    paddingTop: 8,
    gap: 8,
  },
  heroHeading: {
    fontSize: 54,
    fontWeight: "900",
    color: "#121316",
    lineHeight: 56,
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 13,
    color: "#4A5248",
    lineHeight: 19,
    fontWeight: "500",
    maxWidth: 280,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#a8b6a5",
    borderRadius: 14,
    padding: 4,
    position: "relative",
    overflow: "hidden",
  },
  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: "50%",
    height: "100%",
    backgroundColor: "#121316",
    borderRadius: 11,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4A5248",
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: "#ffffff",
  },
  errorBox: {
    backgroundColor: "#FF5745",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  infoBox: {
    backgroundColor: "#121316",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoText: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "700",
  },

  // Form Card Layout & Field Precision
  formCard: {
    backgroundColor: "#121316",
    borderRadius: 28,
    padding: 22,
    gap: 16,
  },
  fieldContainer: {
    width: "100%",
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#71717a",
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  input: {
    backgroundColor: "#1f2024",
    color: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    width: "100%",
  },
  actionBtn: {
    backgroundColor: "#5451FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  togglePasswordBtn: {
    backgroundColor: "#1f2024",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    minWidth: 62,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  togglePasswordText: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  submitBtn: {
    backgroundColor: "#5451FF",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  toggleRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  toggleText: {
    color: "#4A5248",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  demoSection: {
    gap: 10,
  },
  demoLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#4A5248",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  demoRow: {
    flexDirection: "row",
    gap: 8,
  },
  demoChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  demoChipText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
