import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';

export default function SignupScreen({ navigation }) {
  const { t, setLang, lang } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const { register } = useAuth();

  const handleSignup = async () => {
    // Coerce and sanitize inputs to avoid undefined access
    const safeName = (name ?? '').toString().trim();
    const safeEmail = (email ?? '').toString().trim();
    const safePassword = (password ?? '').toString();
    const safeConfirm = (confirmPassword ?? '').toString();
    const safeRole = (role ?? 'student').toString();

    if (!safeName || !safeEmail || !safePassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (safePassword !== safeConfirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (safePassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLocalLoading(true);
    try {
      console.log('[Signup] Starting registration...');
      const result = await register(safeName, safeEmail, safePassword, safeRole);
      console.log('[Signup] Registration result:', JSON.stringify(result));
      
      if (!result.success) {
        console.error('[Signup] Registration failed:', result.error);
        setLocalLoading(false);
        Alert.alert('Signup Failed', result.error ?? 'Unknown error');
        return;
      }
      
      // Registration successful, navigate to OTP screen immediately
      console.log('[Signup] Success! Navigating to VerifyEmail...');
      setLocalLoading(false);
      
      // Use setTimeout to ensure navigation happens after state update
      setTimeout(() => {
        navigation.replace('VerifyEmail', { email: safeEmail });
      }, 50);
    } catch (e) {
      console.error('[Signup] Unexpected error:', e);
      setLocalLoading(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2', '#f093fb']} style={styles.gradient}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🚀</Text>
            <Text style={styles.title}>{t('login:signup')}</Text>
            <Text style={styles.subtitle}>{t('login:joinToday') || 'Join QuizCraft today'}</Text>
            <View style={styles.langRow}>
              <TouchableOpacity 
                onPress={() => setLang('en')} 
                style={[styles.langBtn, styles.langLeft, lang === 'en' && styles.langBtnActive]}
              >
                <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setLang('bn')} 
                style={[styles.langBtn, styles.langRight, lang === 'bn' && styles.langBtnActive]}
              >
                <Text style={[styles.langBtnText, lang === 'bn' && styles.langBtnTextActive]}>বাংলা</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login:fullName') || 'Full Name'}
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                editable={!localLoading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login:email')}
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!localLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login:password')}
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!localLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔐</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login:confirmPassword') || 'Confirm Password'}
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!localLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Text style={styles.eyeIconText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>{t('login:iAmA') || 'I am a:'}</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'student' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('student')}
                  disabled={localLoading}
                >
                  <Text
                    style={[
                      styles.roleText,
                      role === 'student' && styles.roleTextActive,
                    ]}
                  >
                    🎓 {t('login:student') || 'Student'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'teacher' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('teacher')}
                  disabled={localLoading}
                >
                  <Text
                    style={[
                      styles.roleText,
                      role === 'teacher' && styles.roleTextActive,
                    ]}
                  >
                    👨‍🏫 {t('login:teacher') || 'Teacher'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.button, localLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={localLoading}
            >
              <LinearGradient
                colors={
                  localLoading ? ['#9CA3AF', '#6B7280'] : ['#667eea', '#764ba2']
                }
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {localLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>{t('login:signup')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('login:alreadyHaveAccount') || 'Already have an account?'} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>{t('login:signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  langRow: { flexDirection: 'row', marginTop: 8 },
  langBtn: { borderWidth: 1, borderColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4 },
  langBtnActive: { backgroundColor: '#FFF' },
  langLeft: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  langRight: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  langBtnText: { color: '#FFF', fontWeight: '700' },
  langBtnTextActive: { color: '#667eea' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconText: {
    fontSize: 20,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#667eea',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  roleTextActive: {
    color: '#667eea',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  link: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
});
