import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export function AuthScreen() {
  const { login, loginWithGoogle, register, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState(
    'PSP LUMORA authentication system is active. Select your login method or use a quick role preset to proceed.'
  );

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await register(firstName, lastName, email, password, selectedRole);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const devGoogleIdToken = `google_token_${Date.now()}`;
      await loginWithGoogle(devGoogleIdToken, firstName || 'GoogleUser', lastName || 'PSP');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Scrollable Container */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>PSP</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>PSP LUMORA</Text>
              <Text style={styles.brandSubtitle}>SYNCHRONIZED MOBILE AUTH</Text>
            </View>
          </View>

          <View style={styles.syncChip}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.syncChipText}>PORT 4000</Text>
          </View>
        </View>

        {/* Card 1: AI OPERATIONS LEAD (Charcoal Black Card) */}
        <View style={styles.aiCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.aiAvatarRow}>
              <View style={styles.aiAvatar}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
              <View>
                <Text style={styles.aiTitle}>AI OPERATIONS LEAD</Text>
                <Text style={styles.aiSubtitle}>AUTH BOT v2.4</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.arrowCircleSmall}
              onPress={() => setAiMessage('Google OAuth Token validation ready. Press "CONTINUE WITH GOOGLE AUTH" on the main card.')}
            >
              <Text style={styles.arrowTextSmall}>↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chatBubble}>
            <Text style={styles.chatBubbleText}>{aiMessage}</Text>
          </View>

          {/* Quick Action Chips */}
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: '#5451FF' }]}
              onPress={() => loginAsDemo('STUDENT')}
            >
              <Text style={styles.actionChipText}>🎓 Student Access</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: '#FF5745' }]}
              onPress={() => loginAsDemo('TEACHER')}
            >
              <Text style={styles.actionChipText}>👩‍🏫 Teacher Desk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: '#F4C463' }]}
              onPress={() => loginAsDemo('ADMIN')}
            >
              <Text style={[styles.actionChipText, { color: '#121316' }]}>🛡️ Admin</Text>
            </TouchableOpacity>
          </View>

          {/* Voice Input Bar */}
          <View style={styles.voiceBar}>
            <TouchableOpacity 
              style={styles.plusCircle}
              onPress={() => setAiMessage('Enter your email and password in the card below to create or log into your profile.')}
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.voiceBarPlaceholder}>Ask AI Assistant to assist with login...</Text>
            <Text style={styles.waveText}>|||</Text>
          </View>
        </View>

        {/* Card 2: MAIN AUTHENTICATION CARD (Royal Indigo Card) */}
        <View style={styles.mainAuthCard}>
          <View style={styles.authCardHeader}>
            <View>
              <Text style={styles.authTag}>AUTHENTICATION GATEWAY</Text>
              <Text style={styles.authMainHeading}>
                {isSignUp ? 'REGISTER ACCOUNT' : 'USER SIGN IN'}
              </Text>
            </View>

            {/* Toggle Pills */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, !isSignUp && styles.activeTabButton]}
                onPress={() => {
                  setIsSignUp(false);
                  setError('');
                }}
              >
                <Text style={[styles.tabText, !isSignUp && styles.activeTabText]}>SIGN IN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, isSignUp && styles.activeTabButton]}
                onPress={() => {
                  setIsSignUp(true);
                  setError('');
                }}
              >
                <Text style={[styles.tabText, isSignUp && styles.activeTabText]}>SIGN UP</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <View style={styles.googleLeftRow}>
              <View style={styles.googleIconCircle}>
                <Text style={{ fontSize: 14, fontWeight: 'bold' }}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE AUTH</Text>
            </View>
            <View style={styles.arrowCircleBlack}>
              <Text style={styles.arrowTextWhite}>↗</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR EMAIL AUTHENTICATION</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {isSignUp && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>FIRST NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Hanna"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>LAST NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Vance"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>SELECT PLATFORM ROLE</Text>
                  <View style={styles.roleRow}>
                    {(['STUDENT', 'TEACHER', 'ADMIN'] as UserRole[]).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.roleButton,
                          selectedRole === r && styles.activeRoleButton,
                        ]}
                        onPress={() => setSelectedRole(r)}
                      >
                        <Text
                          style={[
                            styles.roleButtonText,
                            selectedRole === r && styles.activeRoleButtonText,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="hanna@lumora.edu"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'CREATE ACCOUNT & ONBOARD' : 'SIGN IN TO DASHBOARD'}
                  </Text>
                  <View style={styles.arrowCircleCoral}>
                    <Text style={styles.arrowTextWhite}>↗</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle Hint */}
          <TouchableOpacity
            style={styles.toggleHintRow}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.toggleHintText}>
              {isSignUp ? 'ALREADY REGISTERED? SIGN IN HERE' : "NEW TO PSP LUMORA? CREATE AN ACCOUNT"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card 3: SECURITY METRICS CARD (Coral Red Card) */}
        <View style={styles.metricsCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.metricsTitle}>← SECURITY METRICS</Text>
            <View style={styles.metricsTagRow}>
              <View style={styles.metricsChip}><Text style={styles.chipText}>JWT AUTH ∨</Text></View>
              <View style={styles.metricsChip}><Text style={styles.chipText}>PASSPORT ∨</Text></View>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>ACTIVE SESSIONS</Text>
              <Text style={styles.metricBoxValue}>$156,900.67</Text>
              <Text style={styles.metricBoxSub}>Synced across 12 nodes</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>TOKEN EXPIRY</Text>
              <Text style={styles.metricBoxValue}>15 Mins</Text>
              <Text style={styles.metricBoxSub}>Auto-refresh strategy</Text>
            </View>
          </View>

          {/* Bar Chart Representation */}
          <View style={styles.chartContainer}>
            {['Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <View key={day} style={styles.chartCol}>
                <View
                  style={[
                    styles.chartBar,
                    { height: 25 + ((idx * 11) % 45) },
                    idx === 3 && styles.highlightChartBar,
                  ]}
                />
                <Text style={[styles.chartDayText, idx === 3 && styles.highlightDayText]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation Dock */}
      <View style={styles.floatingDock}>
        <TouchableOpacity
          style={[styles.dockItem, !isSignUp && styles.activeDockItem]}
          onPress={() => setIsSignUp(false)}
        >
          <Text style={styles.dockIcon}>🏠</Text>
          <Text style={[styles.dockText, !isSignUp && styles.activeDockText]}>AUTH</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dockItem, isSignUp && styles.activeDockItem]}
          onPress={() => setIsSignUp(true)}
        >
          <Text style={styles.dockIcon}>📈</Text>
          <Text style={[styles.dockText, isSignUp && styles.activeDockText]}>REGISTER</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => loginAsDemo('STUDENT')}
        >
          <Text style={styles.dockIcon}>🎓</Text>
          <Text style={styles.dockText}>STUDENT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => loginAsDemo('TEACHER')}
        >
          <Text style={styles.dockIcon}>⚙️</Text>
          <Text style={styles.dockText}>TEACHER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#B8C6B6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 18,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#121316',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4A5248',
  },
  syncChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121316',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  syncChipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Platform',
  },
  // AI Operations Lead Card
  aiCard: {
    backgroundColor: '#121316',
    borderRadius: 28,
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  aiSubtitle: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600',
  },
  arrowCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowTextSmall: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatBubble: {
    backgroundColor: '#1f2024',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chatBubbleText: {
    color: '#e4e4e7',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  actionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  voiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090a0c',
    borderRadius: 24,
    padding: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  plusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF5745',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  voiceBarPlaceholder: {
    flex: 1,
    color: '#71717a',
    fontSize: 11,
  },
  waveText: {
    color: '#71717a',
    fontSize: 11,
    marginRight: 8,
    fontWeight: 'bold',
  },
  // Main Auth Card
  mainAuthCard: {
    backgroundColor: '#5451FF',
    borderRadius: 32,
    padding: 22,
  },
  authCardHeader: {
    flexDirection: 'column',
    gap: 14,
    marginBottom: 18,
  },
  authTag: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  authMainHeading: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#3E3BE0',
    borderRadius: 20,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  activeTabText: {
    color: '#5451FF',
  },
  errorBox: {
    backgroundColor: '#FF5745',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  googleLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#121316',
    fontSize: 11,
    fontWeight: '900',
  },
  arrowCircleBlack: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#121316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircleCoral: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF5745',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowTextWhite: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formContainer: {
    gap: 12,
  },
  fieldGroup: {
    gap: 4,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#3E3BE0',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    fontSize: 13,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#3E3BE0',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  activeRoleButton: {
    backgroundColor: '#121316',
    borderColor: '#ffffff',
  },
  roleButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
  },
  activeRoleButtonText: {
    color: '#ffffff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121316',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  toggleHintRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  toggleHintText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  // Metrics Card
  metricsCard: {
    backgroundColor: '#FF5745',
    borderRadius: 32,
    padding: 20,
  },
  metricsTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricsTagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metricsChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 16,
  },
  metricBoxLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '800',
  },
  metricBoxValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  metricBoxSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  chartCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  chartBar: {
    width: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  highlightChartBar: {
    backgroundColor: '#121316',
  },
  chartDayText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontWeight: '800',
  },
  highlightDayText: {
    color: '#121316',
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  // Floating Dock
  floatingDock: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#121316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeDockItem: {
    backgroundColor: '#ffffff',
  },
  dockIcon: {
    fontSize: 12,
  },
  dockText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
  },
  activeDockText: {
    color: '#121316',
  },
});
