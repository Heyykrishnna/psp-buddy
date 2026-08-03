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
  Image,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export function AuthScreen() {
  const { login, sendVerificationCode, register } = useAuth();

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

  // Animated value for form transitions
  const formFadeAnim = useRef(new Animated.Value(1)).current;

  const switchTab = (signUp: boolean) => {
    if (signUp === isSignUp) return;

    setError("");
    setInfoMessage("");

    Animated.timing(formFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setIsSignUp(signUp);
      setCodeSent(false);

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
      await sendVerificationCode(email.trim());
      setCodeSent(true);
      setInfoMessage("Confirmation code sent to your email address!");
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
          {/* Top Illustration Banner */}
          <View style={styles.headerIllustrationContainer}>
            <Image
              source={require("../../assets/image.png")}
              style={styles.headerIllustration}
              resizeMode="cover"
            />
          </View>

          {/* Form Content Area */}
          <View style={styles.contentSection}>
            {/* Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>
                {isSignUp
                  ? "Create your account"
                  : "Your learning, all in\none place"}
              </Text>
              <Text style={styles.subTitle}>
                {isSignUp
                  ? "Sign up with your email to get started"
                  : "Sign up or sign in with your email address"}
              </Text>
            </View>

            {/* Error / Info Messages */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!!infoMessage && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{infoMessage}</Text>
              </View>
            )}

            {/* Form Fields Container */}
            <Animated.View
              style={[styles.formContainer, { opacity: formFadeAnim }]}
            >
              {isSignUp && (
                <View style={styles.fieldRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@lumora.edu"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {isSignUp && (
                  <TouchableOpacity
                    style={styles.codeInlineBtn}
                    onPress={handleSendCode}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.codeInlineBtnText}>
                      {codeSent ? "Resend" : "Get Code"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {isSignUp && codeSent && (
                <TextInput
                  style={styles.input}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              )}

              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.showPasswordBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? "HIDE" : "SHOW"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Primary Action Pill Button */}
              <TouchableOpacity
                style={styles.primaryPillBtn}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryPillBtnText}>
                    {isSignUp
                      ? "Continue with email →"
                      : "Continue with email →"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Toggle Sign In / Sign Up */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => switchTab(!isSignUp)}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {isSignUp ? (
                    <>
                      Already have an account?{" "}
                      <Text style={styles.toggleHighlight}>Sign in</Text>
                    </>
                  ) : (
                    <>
                      New here?{" "}
                      <Text style={styles.toggleHighlight}>
                        Create an account
                      </Text>
                    </>
                  )}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer Disclaimer */}
            <View style={styles.termsFooter}>
              <Text style={styles.termsText}>
                By registering your email, you agree to{"\n"}our{" "}
                <Text style={styles.termsLink}>Terms & Conditions</Text>.
              </Text>
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
    backgroundColor: "#EBF5FF",
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
  },
  headerIllustrationContainer: {
    backgroundColor: "#EBF5FF",
    height: 250,
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerIllustration: {
    width: "100%",
    height: "100%",
  },
  contentSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  titleSection: {
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily:
      Platform.OS === "web"
        ? "'Space Grotesk', sans-serif"
        : "SpaceGrotesk_600SemiBold",
    color: "#111827",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
    marginTop: 6,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#991B1B",
    fontSize: 12,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  infoBox: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#6EE7B7",
  },
  infoText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  formContainer: {
    gap: 12,
    marginTop: 4,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    backgroundColor: "#F3F4F6",
    color: "#111827",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 14,
    fontWeight: "500",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
    width: "100%",
  },
  codeInlineBtn: {
    position: "absolute",
    right: 8,
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  codeInlineBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  showPasswordBtn: {
    position: "absolute",
    right: 14,
  },
  showPasswordText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
    letterSpacing: 0.5,
  },
  primaryPillBtn: {
    backgroundColor: "#3B82F6",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryPillBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  toggleRow: {
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 4,
  },
  toggleText: {
    color: "#6B7280",
    fontSize: 13,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_500Medium",
  },
  toggleHighlight: {
    color: "#2563EB",
    fontWeight: "600",
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_600SemiBold",
  },
  termsFooter: {
    marginTop: 16,
    alignItems: "center",
  },
  termsText: {
    color: "#9CA3AF",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    fontFamily:
      Platform.OS === "web" ? "Poppins, sans-serif" : "Poppins_400Regular",
  },
  termsLink: {
    color: "#6B7280",
    textDecorationLine: "underline",
  },
});
