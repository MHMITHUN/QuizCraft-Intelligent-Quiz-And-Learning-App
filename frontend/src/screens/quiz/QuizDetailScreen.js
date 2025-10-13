import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Share, Animated, ScrollView } from 'react-native';
import { quizAPI } from '../../services/api';
import { useI18n } from '../../i18n';

export default function QuizDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { t } = useI18n();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const res = await quizAPI.getById(id);
        setQuiz(res?.data?.data?.quiz || null);
      } finally {
        setLoading(false);
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    })();
  }, [id]);

  const startQuiz = () => navigation.navigate('TakeQuiz', { id });
  const shareQuiz = async () => {
    try {
      await Share.share({ message: `Check out this quiz: ${quiz?.title} (ID: ${id})` });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Quiz not found</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{quiz.title}</Text>
        {!!quiz.description && <Text style={styles.desc}>{quiz.description}</Text>}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{t('quiz:category')}: {quiz.category || '-'}</Text>
          <Text style={styles.meta}>{t('quiz:difficulty')}: {quiz.difficulty || '-'}</Text>
          <Text style={styles.meta}>{t('quiz:questions')}: {quiz.questions?.length || 0}</Text>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={startQuiz}>
            <Text style={styles.btnText}>{t('quiz:start')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={shareQuiz}>
            <Text style={styles.btnSecondaryText}>{t('quiz:share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.accent]} onPress={() => navigation.navigate('TeacherDashboard')}>
            <Text style={styles.btnText}>{t('quiz:assign')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#EF4444' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  desc: { color: '#374151', marginTop: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  meta: { marginRight: 12, color: '#6B7280' },
  btnRow: { flexDirection: 'row', marginTop: 20 },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginRight: 10 },
  primary: { backgroundColor: '#4F46E5' },
  accent: { backgroundColor: '#2563EB' },
  secondary: { borderWidth: 1, borderColor: '#4F46E5' },
  btnText: { color: '#FFF', fontWeight: '800' },
  btnSecondaryText: { color: '#4F46E5', fontWeight: '800' }
});
