import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { quizAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import StreamingQuizLoader from '../../components/quiz/StreamingQuizLoader';
import { useTheme } from '../../hooks/useTheme';

export default function UploadScreen({ navigation, route }) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const redirectTo = route?.params?.redirectTo;
  const redirectParams = route?.params?.redirectParams || {};

  const [loading, setLoading] = useState(false);
  const [uploadType, setUploadType] = useState('text');
  const [text, setText] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showContentAdded, setShowContentAdded] = useState(false);
  const [contentFeedback, setContentFeedback] = useState('');
  const [timeLimit, setTimeLimit] = useState('30');
  const [passingScore, setPassingScore] = useState('60');

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState('ready');
  const [questionsGenerated, setQuestionsGenerated] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [quizMetadata, setQuizMetadata] = useState(null);
  const [generatedQuizId, setGeneratedQuizId] = useState(null);

  const isLight = theme === 'light';
  const surfaceColor = isLight ? '#FFFFFF' : '#1E1E1E';
  const borderColor = isLight ? '#E5E7EB' : '#272727';
  const textPrimary = isLight ? '#111827' : '#F9FAFB';
  const textSecondary = isLight ? '#6B7280' : '#9CA3AF';
  const mutedBackground = isLight ? '#F3F4F6' : '#1F2937';
  const placeholderColor = isLight ? '#9CA3AF' : '#6B7280';

  const handleNumQuestionsChange = (value) => {
    const digits = (value ?? '').toString().replace(/[^0-9]/g, '');
    setNumQuestions(digits.slice(0, 3));
  };

  const handleTimeLimitChange = (value) => {
    const digits = (value ?? '').toString().replace(/[^0-9]/g, '');
    setTimeLimit(digits.slice(0, 3));
  };

  const handlePassingScoreChange = (value) => {
    const digits = (value ?? '').toString().replace(/[^0-9]/g, '');
    setPassingScore(digits.slice(0, 3));
  };

  const getTimeLimitValue = () => {
    const parsed = Number.parseInt(timeLimit, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 30;
    }
    return Math.min(parsed, 300);
  };

  const getPassingScoreValue = () => {
    const parsed = Number.parseInt(passingScore, 10);
    if (!Number.isFinite(parsed)) {
      return 60;
    }
    return Math.min(Math.max(parsed, 1), 100);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.type === 'cancel') {
        return;
      }

      const file = result.assets?.[0] || result;
      if (!file) return;

      setSelectedFile(file);

      let fileType = 'resource';
      const mimeType = file.mimeType || '';
      const fileName = file.name?.toLowerCase() || '';

      if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
        fileType = 'PDF';
        setContentFeedback('PDF selected. Text will be extracted automatically.');
      } else if (mimeType.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/.test(fileName)) {
        fileType = 'image';
        setContentFeedback('Image selected. OCR will extract key text for the quiz.');
      } else if (mimeType.includes('text') || fileName.endsWith('.txt')) {
        fileType = 'text';
        setContentFeedback('Plain text selected. Perfect for quick quiz generation.');
      } else if (mimeType.includes('word') || fileName.endsWith('.docx')) {
        fileType = 'document';
        setContentFeedback('Word document selected. We will parse the content for questions.');
      } else {
        setContentFeedback('File selected. We will do our best to extract the content.');
      }

      setShowContentAdded(true);
      setTimeout(() => setShowContentAdded(false), 3000);

      Alert.alert(
        t('common:appName'),
        `Great! Your ${fileType} file "${file.name}" is ready for quiz creation.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert(t('common:appName'), 'Failed to select document. Please try again.');
    }
  };

  const navigateAfterCreation = (quizId) => {
    if (!quizId) return;

    if (redirectTo) {
      navigation.navigate(redirectTo, {
        ...redirectParams,
        refreshToken: Date.now(),
        newQuizId: quizId,
      });
    } else {
      navigation.navigate('QuizDetail', { id: quizId });
    }
  };

  const resetStreamingState = () => {
    setIsStreaming(true);
    setLoading(true);
    setStreamStatus('ready');
    setQuestionsGenerated(0);
    setCurrentQuestion(null);
    setQuizMetadata(null);
    setGeneratedQuizId(null);
  };

  const handleStreamComplete = (quizId) => {
    setGeneratedQuizId(quizId);
    setTimeout(() => {
      setIsStreaming(false);
      setLoading(false);
      navigateAfterCreation(quizId);
    }, 1200);
  };

  const handleStreamError = (message) => {
    setIsStreaming(false);
    setLoading(false);
    Alert.alert(t('common:appName'), message || 'Failed to generate quiz');
  };

  const generateFromText = async () => {
    const safeText = (text ?? '').toString();
    if (!safeText || safeText.trim().length < 100) {
      Alert.alert(t('common:appName'), t('upload:enter100'));
      return;
    }

    const safeNum = Number.parseInt(numQuestions, 10) || 5;

    resetStreamingState();

    try {
      await quizAPI.streamFromText(
        {
          text: safeText,
          numQuestions: safeNum,
          quizType: 'mcq',
          difficulty,
          language: 'en',
          timeLimit: getTimeLimitValue(),
          passingScore: getPassingScoreValue(),
        },
        (event) => {
          switch (event.event) {
            case 'ready':
            case 'extracting':
              setStreamStatus('generating');
              break;

            case 'meta':
              setStreamStatus('generating');
              setQuizMetadata({
                title: event.data?.title,
                category: event.data?.category,
                description: event.data?.description,
              });
              break;

            case 'question':
              setStreamStatus('question');
              setQuestionsGenerated(event.received || event.index + 1);
              setCurrentQuestion(event.data);
              break;

            case 'stream-complete':
              setStreamStatus('saving');
              break;

            case 'completed': {
              setStreamStatus('complete');
              const quizId = event.data?.quiz?.id;
              if (quizId) {
                handleStreamComplete(quizId);
              } else {
                handleStreamError('Quiz saved but no identifier returned.');
              }
              break;
            }

            case 'error':
              handleStreamError(event.message);
              break;

            default:
              break;
          }
        }
      );
    } catch (error) {
      console.error('Generate from text error:', error);
      handleStreamError(error?.message);
    }
  };

  const uploadAndGenerate = async () => {
    if (!selectedFile) {
      Alert.alert(t('common:appName'), t('upload:chooseFile'));
      return;
    }

    resetStreamingState();

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      });
      formData.append('numQuestions', String(Number.parseInt(numQuestions, 10) || 5));
      formData.append('quizType', 'mcq');
      formData.append('difficulty', difficulty);
      formData.append('language', 'en');
      formData.append('timeLimit', String(getTimeLimitValue()));
      formData.append('passingScore', String(getPassingScoreValue()));

      await quizAPI.streamUploadAndGenerate(formData, (event) => {
        switch (event.event) {
          case 'ready':
            setStreamStatus('ready');
            break;

          case 'extracting':
            setStreamStatus('extracting');
            break;

          case 'extracted':
            setStreamStatus('generating');
            break;

          case 'meta':
            setStreamStatus('generating');
            setQuizMetadata({
              title: event.data?.title,
              category: event.data?.category,
              description: event.data?.description,
            });
            break;

          case 'question':
            setStreamStatus('question');
            setQuestionsGenerated(event.received || event.index + 1);
            setCurrentQuestion(event.data);
            break;

          case 'stream-complete':
            setStreamStatus('saving');
            break;

          case 'completed': {
            setStreamStatus('complete');
            const quizId = event.data?.quiz?.id;
            if (quizId) {
              handleStreamComplete(quizId);
            } else {
              handleStreamError('Quiz saved but no identifier returned.');
            }
            break;
          }

          case 'error':
            handleStreamError(event.message);
            break;

          default:
            break;
        }
      });
    } catch (error) {
      console.error('Upload and generate error:', error);
      handleStreamError(error?.message);
    }
  };

  const FILE_TYPES = [
    { icon: 'document-text-outline', label: 'PDF' },
    { icon: 'image-outline', label: 'Image' },
    { icon: 'document-attach-outline', label: 'Word' },
    { icon: 'text-outline', label: 'Text' },
  ];

  return (
    <>
      <Modal visible={isStreaming} animationType="slide" presentationStyle="fullScreen">
        <StreamingQuizLoader
          status={streamStatus}
          questionsGenerated={questionsGenerated}
          totalQuestions={Number.parseInt(numQuestions, 10) || 5}
          currentQuestion={currentQuestion}
          metadata={quizMetadata}
        />
      </Modal>

      <LinearGradient
        colors={isLight ? ['#F9FAFB', '#E5E7EB'] : ['#0f172a', '#1f2937']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.headerBadge, { backgroundColor: isLight ? '#EEF2FF' : '#1E1B4B' }]}>
              <Ionicons name="sparkles" size={22} color="#4F46E5" />
            </View>
            <Text style={[styles.title, { color: textPrimary }]}>{t('upload:generateQuiz')}</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{t('upload:aiPowered')}</Text>

            {showContentAdded && contentFeedback ? (
              <View
                style={[
                  styles.contentAddedBanner,
                  { backgroundColor: isLight ? '#F0FDF4' : '#064E3B' },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={isLight ? '#22C55E' : '#6EE7B7'}
                  style={styles.bannerIcon}
                />
                <Text
                  style={[
                    styles.contentAddedText,
                    { color: isLight ? '#166534' : '#ECFDF5' },
                  ]}
                >
                  {contentFeedback}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.constraintsCard,
              { backgroundColor: surfaceColor, borderColor },
            ]}
          >
            <Text style={[styles.constraintsTitle, { color: textPrimary }]}>
              {t('upload:quizSettings') ?? 'Quiz settings'}
            </Text>
            <View style={styles.constraintsGrid}>
              <View style={styles.constraintField}>
                <Text style={[styles.label, { color: textSecondary }]}>
                  {t('upload:timeLimit') ?? 'Time limit (minutes)'}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: mutedBackground, color: textPrimary },
                  ]}
                  keyboardType="number-pad"
                  value={timeLimit}
                  onChangeText={handleTimeLimitChange}
                  placeholder="30"
                  placeholderTextColor={placeholderColor}
                  editable={!loading}
                />
              </View>

              <View style={styles.constraintField}>
                <Text style={[styles.label, { color: textSecondary }]}>
                  {t('upload:passingScore') ?? 'Passing score (%)'}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: mutedBackground, color: textPrimary },
                  ]}
                  keyboardType="number-pad"
                  value={passingScore}
                  onChangeText={handlePassingScoreChange}
                  placeholder="60"
                  placeholderTextColor={placeholderColor}
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          <View
            style={[
              styles.typeSelector,
              {
                backgroundColor: isLight ? '#E5E7EB' : '#1F2937',
                borderColor,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.typeButton,
                uploadType === 'text' && (isLight ? styles.typeButtonActive : styles.typeButtonActiveDark),
              ]}
              onPress={() => setUploadType('text')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="text"
                size={18}
                color={uploadType === 'text' ? (isLight ? '#312E81' : '#F9FAFB') : textSecondary}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  { color: uploadType === 'text' ? (isLight ? '#312E81' : '#F9FAFB') : textSecondary },
                ]}
              >
                {t('upload:textInput')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                uploadType === 'file' && (isLight ? styles.typeButtonActive : styles.typeButtonActiveDark),
              ]}
              onPress={() => setUploadType('file')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={18}
                color={uploadType === 'file' ? (isLight ? '#312E81' : '#F9FAFB') : textSecondary}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  { color: uploadType === 'file' ? (isLight ? '#312E81' : '#F9FAFB') : textSecondary },
                ]}
              >
                {t('upload:fileUpload')}
              </Text>
            </TouchableOpacity>
          </View>

          {uploadType === 'text' ? (
            <View
              style={[
                styles.card,
                { backgroundColor: surfaceColor, borderColor },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="reader-outline" size={18} color="#6366F1" />
                <Text style={[styles.cardTitle, { color: textPrimary }]}>
                  {t('upload:fromText') ?? 'Generate from text'}
                </Text>
              </View>

              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: mutedBackground, color: textPrimary },
                ]}
                multiline
                numberOfLines={8}
                value={text}
                onChangeText={setText}
                placeholder={t('upload:placeholder') ?? 'Paste or write content here (minimum 100 characters)'}
                placeholderTextColor={placeholderColor}
                editable={!loading}
              />

              <Text style={[styles.label, { color: textSecondary }]}>
                {t('upload:numQuestions')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: mutedBackground, color: textPrimary },
                ]}
                keyboardType="number-pad"
                value={numQuestions}
                onChangeText={handleNumQuestionsChange}
                placeholder="5"
                placeholderTextColor={placeholderColor}
                editable={!loading}
              />

              <Text style={[styles.label, { color: textSecondary }]}>
                {t('upload:difficultyLevel')}
              </Text>
              <View style={styles.difficultySelector}>
                {['easy', 'medium', 'hard'].map((level) => {
                  const isActive = difficulty === level;
                  const palette = {
                    easy: '#10B981',
                    medium: '#F59E0B',
                    hard: '#EF4444',
                  };
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyButton,
                        { borderColor },
                        isActive && { borderColor: palette[level] },
                      ]}
                      onPress={() => setDifficulty(level)}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={
                          level === 'easy'
                            ? 'leaf-outline'
                            : level === 'medium'
                            ? 'speedometer-outline'
                            : 'flame-outline'
                        }
                        size={18}
                        color={isActive ? palette[level] : textSecondary}
                        style={styles.difficultyIcon}
                      />
                      <Text
                        style={[
                          styles.difficultyButtonText,
                          {
                            color: isActive ? palette[level] : textSecondary,
                          },
                        ]}
                      >
                        {t(`upload:${level}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={generateFromText}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.primaryButtonGradient}>
                  {loading && isStreaming ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.primaryButtonContent}>
                      <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>{t('upload:generate')}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.card,
                { backgroundColor: surfaceColor, borderColor },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="cloud-upload-outline" size={18} color="#6366F1" />
                <Text style={[styles.cardTitle, { color: textPrimary }]}>
                  {t('upload:fromFile')}
                </Text>
              </View>
              <Text style={[styles.infoText, { color: textSecondary }]}>
                Upload PDF, image, Word, or text files. We will extract the important parts for your quiz.
              </Text>

              <View
                style={[
                  styles.fileTypesRow,
                  { backgroundColor: isLight ? '#F8FAFC' : '#111827' },
                ]}
              >
                {FILE_TYPES.map((type) => (
                  <View key={type.label} style={styles.fileType}>
                    <Ionicons name={type.icon} size={18} color="#6366F1" />
                    <Text style={[styles.fileTypeText, { color: textSecondary }]}>
                      {type.label}
                    </Text>
                  </View>
                ))}
              </View>

              {selectedFile ? (
                <View
                  style={[
                    styles.fileInfo,
                    { backgroundColor: isLight ? '#EEF2FF' : '#1E1B4B' },
                  ]}
                >
                  <View style={styles.fileInfoHeader}>
                    <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
                    <View style={styles.fileInfoBody}>
                      <Text style={[styles.fileName, { color: textPrimary }]} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={[styles.fileMeta, { color: textSecondary }]}>
                        {selectedFile.size ? `${Math.round(selectedFile.size / 1024)} KB` : 'Size unknown'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedFile(null)} activeOpacity={0.8}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  {contentFeedback ? (
                    <Text style={[styles.fileFeedback, { color: isLight ? '#4338CA' : '#C7D2FE' }]}>
                      {contentFeedback}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.secondaryButton, loading && styles.buttonDisabled]}
                onPress={pickDocument}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons name="folder-open-outline" size={18} color="#4F46E5" />
                <Text style={[styles.secondaryButtonText, { color: '#4F46E5' }]}>
                  {t('upload:chooseFile')}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.label, { color: textSecondary }]}>
                {t('upload:numQuestions')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: mutedBackground, color: textPrimary },
                ]}
                keyboardType="number-pad"
                value={numQuestions}
                onChangeText={handleNumQuestionsChange}
                placeholder="5"
                placeholderTextColor={placeholderColor}
                editable={!loading}
              />

              <Text style={[styles.label, { color: textSecondary }]}>
                {t('upload:difficultyLevel')}
              </Text>
              <View style={styles.difficultySelector}>
                {['easy', 'medium', 'hard'].map((level) => {
                  const isActive = difficulty === level;
                  const palette = {
                    easy: '#10B981',
                    medium: '#F59E0B',
                    hard: '#EF4444',
                  };
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyButton,
                        { borderColor },
                        isActive && { borderColor: palette[level] },
                      ]}
                      onPress={() => setDifficulty(level)}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={
                          level === 'easy'
                            ? 'leaf-outline'
                            : level === 'medium'
                            ? 'speedometer-outline'
                            : 'flame-outline'
                        }
                        size={18}
                        color={isActive ? palette[level] : textSecondary}
                        style={styles.difficultyIcon}
                      />
                      <Text
                        style={[
                          styles.difficultyButtonText,
                          { color: isActive ? palette[level] : textSecondary },
                        ]}
                      >
                        {t(`upload:${level}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedFile ? (
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={uploadAndGenerate}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.primaryButtonGradient}>
                    {loading && isStreaming ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={styles.primaryButtonContent}>
                        <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>{t('upload:uploadAndGenerate')}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerBadge: {
    padding: 14,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  contentAddedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  bannerIcon: {
    marginRight: 8,
  },
  contentAddedText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  constraintsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  constraintsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  constraintsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  constraintField: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  typeButtonActiveDark: {
    backgroundColor: '#4F46E5',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  textArea: {
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    minHeight: 160,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  difficultySelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  difficultyButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  difficultyIcon: {
    marginBottom: 2,
  },
  difficultyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoText: {
    fontSize: 13,
    marginBottom: 16,
  },
  fileTypesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  fileType: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  fileTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fileInfo: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  fileInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileInfoBody: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
  },
  fileMeta: {
    fontSize: 12,
  },
  fileFeedback: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});


