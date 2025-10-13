import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, Animated, Dimensions } from 'react-native';
import { quizAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import { Ionicons } from '@expo/vector-icons';
import ProgressIndicator from '../../components/quiz/ProgressIndicator';
import QuizButton from '../../components/quiz/QuizButton';
import LoadingIndicator from '../../components/quiz/LoadingIndicator';

const { width: screenWidth } = Dimensions.get('window');

export default function TakeQuizScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { t } = useI18n();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    (async () => {
      try {
        const res = await quizAPI.getById(id);
        const q = res?.data?.data?.quiz;
        setQuiz(q);
        setAnswers(new Array(q?.questions?.length || 0).fill(null));
        
        // Start entrance animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        ]).start();
      } catch (e) {
        Alert.alert('Error', 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (quiz?.questions?.length) {
      const progress = (Object.values(answers).filter(a => a !== null).length) / quiz.questions.length;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [answers, quiz]);

  const submit = async () => {
    const unanswered = answers.some(a => a === null);
    if (unanswered) {
      Alert.alert('Incomplete Quiz', 'Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await quizAPI.submit(id, answers, 0);
      const historyId = res?.data?.data?.historyId;
      navigation.replace('QuizResult', { historyId });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectAnswer = (questionIndex, answer) => {
    const copy = [...answers];
    copy[questionIndex] = answer;
    setAnswers(copy);
    
    // Add a small animation feedback
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.02, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const renderQuestion = (item, index) => {
    const isAnswered = answers[index] !== null;
    const selectedAnswer = answers[index];

    return (
      <View key={index} style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionNumber}>
            <Text style={styles.questionNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.questionStatus}>
            {isAnswered ? (
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            ) : (
              <Ionicons name="radio-button-off" size={24} color="#D1D5DB" />
            )}
          </View>
        </View>
        
        <Text style={styles.questionText}>{item.questionText}</Text>
        
        <View style={styles.optionsContainer}>
          {Array.isArray(item.options) && item.options.map((opt, i) => {
            const isSelected = selectedAnswer === opt.text;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  Platform.OS === 'web' && styles.webOption
                ]}
                onPress={() => selectAnswer(index, opt.text)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionCircle,
                    isSelected && styles.optionCircleSelected
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {opt.text}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const totalCount = quiz?.questions?.length || 0;
  const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator 
          message="Loading Quiz..." 
          type="quiz" 
          size="large" 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>{quiz?.title}</Text>
          <ProgressIndicator 
            currentStep={currentQuestionIndex}
            totalSteps={totalCount}
            answeredCount={answeredCount}
            progressAnim={progressAnim}
            showDetails={false}
          />
        </View>
      </View>

      {/* Main content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {quiz?.questions?.map((question, index) => renderQuestion(question, index))}
          
          <View style={styles.submitSection}>
            <QuizButton
              title="Submit Quiz"
              onPress={submit}
              disabled={answeredCount !== totalCount}
              loading={submitting}
              variant={answeredCount === totalCount ? "primary" : "secondary"}
              size="large"
              icon="arrow-forward"
              iconPosition="right"
              style={styles.submitButton}
            />
            
            {answeredCount < totalCount && (
              <Text style={styles.submitHint}>
                Answer {totalCount - answeredCount} more question{totalCount - answeredCount !== 1 ? 's' : ''} to submit
              </Text>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }
    }),
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
      }
    }),
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionStatus: {
    // Status indicator space
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }
    }),
  },
  optionCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F0F0FF',
  },
  webOption: {
    // Web-specific hover effects handled by CSS
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCircleSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  submitSection: {
    marginTop: 32,
    marginBottom: 20,
    alignItems: 'center',
  },
  submitButton: {
    minWidth: 200,
  },
  submitHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
