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

export function OnboardingScreen() {
  const { user, onboard } = useAuth();

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN';

  const [studentRegistrationNo, setStudentRegistrationNo] = useState('');
  const [gradeLevel, setGradeLevel] = useState('1st Sem');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Computer Science');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await onboard({
        studentRegistrationNo: isTeacher || isAdmin ? undefined : studentRegistrationNo,
        gradeLevel: isTeacher || isAdmin ? undefined : gradeLevel,
        employeeId: isTeacher || isAdmin ? employeeId : undefined,
        department: isTeacher || isAdmin ? department : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.badgeText}>STEP 2 OF 2: PROFILE ONBOARDING</Text>
          <Text style={styles.title}>COMPLETE YOUR PROFILE</Text>
          <Text style={styles.subtitle}>
            Welcome, {user?.firstName}! Set your credentials to access the mobile portal.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxLabel}>ASSIGNED ROLE</Text>
            <Text style={styles.infoBoxValue}>{String(user?.role || 'STUDENT')}</Text>
          </View>

          {!isTeacher && !isAdmin ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>STUDENT REGISTRATION NUMBER</Text>
                <TextInput
                  style={styles.input}
                  value={studentRegistrationNo}
                  onChangeText={setStudentRegistrationNo}
                  placeholder="e.g. STU-2026-8941"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>GRADE / LEVEL</Text>
                <TextInput
                  style={styles.input}
                  value={gradeLevel}
                  onChangeText={setGradeLevel}
                  placeholder="1st Sem"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>EMPLOYEE / STAFF ID</Text>
                <TextInput
                  style={styles.input}
                  value={employeeId}
                  onChangeText={setEmployeeId}
                  placeholder="e.g. EMP-1042"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>DEPARTMENT</Text>
                <TextInput
                  style={styles.input}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="Computer Science"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>
            </>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>ENTER MOBILE DASHBOARD</Text>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>↗</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#B8C6B6',
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#5451FF',
    borderRadius: 32,
    padding: 24,
    gap: 14,
  },
  badgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: '#FF5745',
    padding: 12,
    borderRadius: 14,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#3E3BE0',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  infoBoxLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '800',
  },
  infoBoxValue: {
    color: '#F4C463',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  fieldGroup: {
    gap: 4,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#3E3BE0',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121316',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF5745',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
