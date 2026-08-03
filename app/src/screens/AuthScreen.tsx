import React, { useState } from "react";
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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

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

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!firstName.trim() || !lastName.trim()) {
          setError("First and last name are required.");
          setLoading(false);
          return;
        }
        await register(firstName, lastName, email, password, selectedRole);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(
        err.message || "Authentication failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const devToken = `google_token_${Date.now()}`;
      await loginWithGoogle(
        devToken,
        firstName || "Google",
        lastName || "User",
      );
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Feather name="layers" size={18} color="#ffffff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.brandName}>PSP LUMORA</Text>
              <Text style={styles.brandTagline}>
                Academic Intelligence Platform
              </Text>
            </View>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveChipText}>LIVE</Text>
            </View>
          </View>

          {/* Sign In / Sign Up Card */}
          <View style={styles.authCard}>
            {/* Tab Switcher */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, !isSignUp && styles.activeTab]}
                onPress={() => {
                  setIsSignUp(false);
                  setError("");
                }}
              >
                <Feather
                  name="log-in"
                  size={13}
                  color={!isSignUp ? "#111111" : "#71717a"}
                />
                <Text
                  style={[styles.tabText, !isSignUp && styles.activeTabText]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, isSignUp && styles.activeTab]}
                onPress={() => {
                  setIsSignUp(true);
                  setError("");
                }}
              >
                <Feather
                  name="user-plus"
                  size={13}
                  color={isSignUp ? "#111111" : "#71717a"}
                />
                <Text
                  style={[styles.tabText, isSignUp && styles.activeTabText]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardHeading}>
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Text>
            <Text style={styles.cardSubheading}>
              {isSignUp
                ? "Join PSP Lumora as a student, teacher, or admin."
                : "Sign in to access your personalized dashboard."}
            </Text>

            {/* Error Banner */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={13} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Name Fields (Sign Up Only) */}
            {isSignUp && (
              <>
                <View style={styles.fieldRow}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>FIRST NAME</Text>
                    <View style={styles.inputWrapper}>
                      <Feather
                        name="user"
                        size={14}
                        color="#71717a"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Hanna"
                        placeholderTextColor="#a1a1aa"
                      />
                    </View>
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>LAST NAME</Text>
                    <View style={styles.inputWrapper}>
                      <Feather
                        name="user"
                        size={14}
                        color="#71717a"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Vance"
                        placeholderTextColor="#a1a1aa"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>PLATFORM ROLE</Text>
                  <View style={styles.roleRow}>
                    {(["STUDENT", "TEACHER", "ADMIN"] as UserRole[]).map(
                      (r) => (
                        <TouchableOpacity
                          key={r}
                          style={[
                            styles.roleBtn,
                            selectedRole === r && styles.roleBtnActive,
                          ]}
                          onPress={() => setSelectedRole(r)}
                        >
                          <Feather
                            name={
                              r === "STUDENT"
                                ? "book-open"
                                : r === "TEACHER"
                                  ? "briefcase"
                                  : "shield"
                            }
                            size={12}
                            color={selectedRole === r ? "#ffffff" : "#71717a"}
                          />
                          <Text
                            style={[
                              styles.roleBtnText,
                              selectedRole === r && styles.roleBtnTextActive,
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

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="mail"
                  size={14}
                  color="#71717a"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="hanna@lumora.edu"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="lock"
                  size={14}
                  color="#71717a"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={14}
                    color="#71717a"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {isSignUp ? "Create Account" : "Sign In to Dashboard"}
                  </Text>
                  <Feather name="arrow-right" size={14} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>

            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.googleIconCircle}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? "Already registered? Sign in"
                  : "New to PSP Lumora? Create account"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Access */}
          <View style={styles.demoSection}>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerLabel}>QUICK DEMO ACCESS</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.demoRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => loginAsDemo("STUDENT")}
                activeOpacity={0.8}
              >
                <Feather name="book-open" size={14} color="#111111" />
                <Text style={styles.demoBtnText}>Student</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => loginAsDemo("TEACHER")}
                activeOpacity={0.8}
              >
                <Feather name="briefcase" size={14} color="#111111" />
                <Text style={styles.demoBtnText}>Teacher</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => loginAsDemo("ADMIN")}
                activeOpacity={0.8}
              >
                <Feather name="shield" size={14} color="#111111" />
                <Text style={styles.demoBtnText}>Admin</Text>
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
    backgroundColor: "#F4F4F6",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 11,
    color: "#71717a",
    fontWeight: "500",
    marginTop: 1,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#111111",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  liveChipText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Auth Card
  authCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#f4f4f6",
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  activeTabText: {
    color: "#111111",
    fontWeight: "700",
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
    marginTop: 4,
  },
  cardSubheading: {
    fontSize: 12,
    color: "#71717a",
    lineHeight: 17,
    marginTop: -6,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 10,
  },
  fieldGroup: {
    gap: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#71717a",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  inputIcon: {
    // no extra style needed
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111111",
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 2,
  },
  roleRow: {
    flexDirection: "row",
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    backgroundColor: "#f4f4f6",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  roleBtnActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  roleBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#71717a",
  },
  roleBtnTextActive: {
    color: "#ffffff",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111111",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  googleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  googleG: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  googleBtnText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "600",
  },
  toggleRow: {
    alignItems: "center",
    paddingTop: 4,
  },
  toggleText: {
    color: "#71717a",
    fontSize: 12,
    textDecorationLine: "underline",
  },

  // Demo Section
  demoSection: {
    gap: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e4e4e7",
  },
  dividerLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#a1a1aa",
    letterSpacing: 0.8,
  },
  demoRow: {
    flexDirection: "row",
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },
});
