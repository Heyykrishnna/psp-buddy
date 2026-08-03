import React, { useState, useRef, useEffect } from "react";
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
import { UserRole } from "../types";

const { width } = Dimensions.get("window");

export function AuthScreen() {
  const { login, loginWithGoogle, register, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Animated underline for tab indicator
  const tabAnim = useRef(new Animated.Value(0)).current;

  const switchTab = (signUp: boolean) => {
    setIsSignUp(signUp);
    setError("");
    Animated.spring(tabAnim, {
      toValue: signUp ? 1 : 0,
      useNativeDriver: true,
      stiffness: 260,
      damping: 20,
    }).start();
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        if (!firstName.trim()) {
          setError("First name is required.");
          setLoading(false);
          return;
        }
        await register(firstName, lastName, email, password, selectedRole);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
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
          {/* Wordmark */}
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmark}>PSP LUMORA</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          {/* Large Heading */}
          <View style={styles.heroSection}>
            <Text style={styles.heroHeading}>
              {isSignUp ? "CREATE\nACCOUNT" : "SIGN IN"}
            </Text>
            <Text style={styles.heroSub}>
              {isSignUp
                ? "Join PSP Lumora and start tracking your academic progress."
                : "Access your personalised learning dashboard."}
            </Text>
          </View>

          {/* Tab Switcher */}
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

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={styles.formCard}>
            {isSignUp && (
              <>
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>FIRST NAME</Text>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Hanna"
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
                      placeholder="Vance"
                      placeholderTextColor="#71717a"
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>ROLE</Text>
                  <View style={styles.roleRow}>
                    {(["STUDENT", "TEACHER", "ADMIN"] as UserRole[]).map(
                      (r) => (
                        <TouchableOpacity
                          key={r}
                          style={[
                            styles.roleChip,
                            selectedRole === r && styles.roleChipActive,
                          ]}
                          onPress={() => setSelectedRole(r)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.roleChipText,
                              selectedRole === r && styles.roleChipTextActive,
                            ]}
                          >
                            {r}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                </View>
              </>
            )}

            <View>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="hanna@lumora.edu"
                placeholderTextColor="#71717a"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#71717a"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.showBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.showBtnText}>
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
                  {isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => loginWithGoogle(`google_${Date.now()}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.googleBtnText}>CONTINUE WITH GOOGLE</Text>
            </TouchableOpacity>
          </View>

          {/* Toggle */}
          <TouchableOpacity
            onPress={() => switchTab(!isSignUp)}
            style={styles.toggleRow}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </Text>
          </TouchableOpacity>

          {/* Quick Demo Access */}
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

  // Wordmark Row
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
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#121316",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  liveText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  // Hero
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

  // Tab Switcher
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

  // Error
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

  // Form Card
  formCard: {
    backgroundColor: "#121316",
    borderRadius: 28,
    padding: 22,
    gap: 16,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#71717a",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1f2024",
    color: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 0,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  showBtn: {
    backgroundColor: "#1f2024",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  showBtnText: {
    color: "#71717a",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1f2024",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  roleChipActive: {
    backgroundColor: "#5451FF",
    borderColor: "#5451FF",
  },
  roleChipText: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  roleChipTextActive: {
    color: "#ffffff",
  },
  submitBtn: {
    backgroundColor: "#5451FF",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  googleBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  googleBtnText: {
    color: "#121316",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // Toggle
  toggleRow: {
    alignItems: "center",
  },
  toggleText: {
    color: "#4A5248",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // Demo
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
