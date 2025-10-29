import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

const TRIAL_DURATION_MS = 10 * 60 * 1000;

const formatTime = (milliseconds) => {
  const safeMs = Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const GuestTrialBanner = () => {
  const { user, guestTrialRemaining, logout } = useAuth();
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const shouldShow = useMemo(() => {
    return Boolean(user) && user.role === 'guest' && guestTrialRemaining !== null;
  }, [user, guestTrialRemaining]);

  useEffect(() => {
    if (!shouldShow) {
      pulseAnim.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [shouldShow, pulseAnim]);

  if (!shouldShow) {
    return null;
  }

  const remainingLabel = formatTime(guestTrialRemaining);
  const progress = Math.min(
    1,
    Math.max(0, 1 - guestTrialRemaining / TRIAL_DURATION_MS)
  );

  const handleCreateAccount = () => {
    logout('Create a full account to keep your progress.')
      .catch((err) => console.error('Guest trial logout error:', err));
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <LinearGradient
        colors={
          theme === 'light'
            ? ['#4F46E5', '#7C3AED']
            : ['#312E81', '#1E1B4B']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.container,
          theme === 'light' ? styles.shadowLight : styles.shadowDark,
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.iconBadge}>
            <Ionicons
              name="time-outline"
              size={18}
              color={theme === 'light' ? '#F0F4FF' : '#C7D2FE'}
            />
          </View>
          <Text style={styles.headline}>Guest Access</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{remainingLabel}</Text>
          </View>
        </View>

        <Text style={styles.message}>
          You’re exploring QuizCraft in guest mode. Create a free account to keep your progress and unlock more features.
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreateAccount}>
          <Text style={styles.buttonText}>Upgrade For Free</Text>
          <Ionicons name="arrow-forward" size={18} color="#111827" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
  },
  container: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  shadowLight: {
    shadowColor: '#4F46E5',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
  },
  shadowDark: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headline: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: 0.3,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  chipText: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(249, 250, 251, 0.85)',
    marginBottom: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
  },
  button: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  buttonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default GuestTrialBanner;
