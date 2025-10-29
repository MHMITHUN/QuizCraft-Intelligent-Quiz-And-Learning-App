import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { quizAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import StreamingQuizLoader from '../../components/quiz/StreamingQuizLoader';
import { useTheme } from '../../hooks/useTheme';

export default function UploadScreen({ navigation }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('text'); // 'text', 'file'
  const [showContentAdded, setShowContentAdded] = useState(false);
  const [contentFeedback, setContentFeedback] = useState('');
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const { theme } = useTheme();
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState('ready');
  const [questionsGenerated, setQuestionsGenerated] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [quizMetadata, setQuizMetadata] = useState(null);
  const [generatedQuizId, setGeneratedQuizId] = useState(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success' || result.assets?.[0]) {
        const file = result.assets?.[0] || result;
        setSelectedFile(file);
        
        // Determine file type and show feedback
        let fileType = 'unknown';
        const mimeType = file.mimeType || '';
        const fileName = file.name?.toLowerCase() || '';
        
        if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
          fileType = 'PDF';
          setContentFeedback('📄 PDF document selected - text will be extracted for quiz generation');
        } else if (mimeType.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/.test(fileName)) {
          fileType = 'Image';
          setContentFeedback('🖼️ Image selected - text will be extracted using OCR for quiz generation');
        } else if (mimeType.includes('text') || fileName.endsWith('.txt')) {
          fileType = 'Text';
          setContentFeedback('📄 Text file selected - content will be used for quiz generation');
        } else if (mimeType.includes('word') || fileName.endsWith('.docx')) {
          fileType = 'Word';
          setContentFeedback('📄 Word document selected - text will be extracted for quiz generation');
        } else {
          setContentFeedback('📄 File selected - will attempt to extract content for quiz generation');
        }
        
        setShowContentAdded(true);
        setTimeout(() => setShowContentAdded(false), 3000);
        
        // Show success alert
        Alert.alert(
          'File Selected',
          `${fileType} file "${file.name}" has been selected as a resource. The content will be processed to generate quiz questions.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const generateFromText = async () => {
    const safeText = (text ?? '').toString();
    if (!safeText || safeText.trim().length < 100) {
      Alert.alert(t('common:appName'), t('upload:enter100'));
      return;
    }

    const safeNum = Number.parseInt(numQuestions) || 5;

    // Reset streaming state
    setIsStreaming(true);
    setStreamStatus('ready');
    setQuestionsGenerated(0);
    setCurrentQuestion(null);
    setQuizMetadata(null);
    setGeneratedQuizId(null);

    try {
      await quizAPI.streamFromText(
        {
          text: safeText,
          numQuestions: safeNum,
          quizType: 'mcq',
          difficulty: difficulty,
          language: 'en'
        },
        (event) => {
          console.log('Stream event:', event);
          
          switch (event.event) {
            case 'ready':
              setStreamStatus('generating');
              break;
            
            case 'meta':
              setStreamStatus('generating');
              setQuizMetadata({
                title: event.data?.title,
                category: event.data?.category,
                description: event.data?.description
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
            
            case 'completed':
              setStreamStatus('complete');
              const quizId = event.data?.quiz?.id;
              if (quizId) {
                setGeneratedQuizId(quizId);
                setTimeout(() => {
                  setIsStreaming(false);
                  navigation.navigate('QuizDetail', { id: quizId });
                }, 1500);
              }
              break;
            
            case 'error':
              setIsStreaming(false);
              Alert.alert('Error', event.message || 'Failed to generate quiz');
              break;
          }
        }
      );
    } catch (error) {
      console.error('Generate from text error:', error);
      setIsStreaming(false);
      Alert.alert(t('common:appName'), error?.message || 'Failed to generate quiz');
    }
  };

  const uploadAndGenerate = async () => {
    if (!selectedFile) {
      Alert.alert(t('common:appName'), t('upload:chooseFile'));
      return;
    }

    // Reset streaming state
    setIsStreaming(true);
    setStreamStatus('ready');
    setQuestionsGenerated(0);
    setCurrentQuestion(null);
    setQuizMetadata(null);
    setGeneratedQuizId(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      });
      formData.append('numQuestions', Number.parseInt(numQuestions) || 5);
      formData.append('quizType', 'mcq');
      formData.append('difficulty', difficulty);
      formData.append('language', 'en');

      await quizAPI.streamUploadAndGenerate(formData, (event) => {
        console.log('Stream event:', event);
        
        switch (event.event) {
          case 'ready':
            setStreamStatus('ready');
            break;
          
          case 'extracting':
            setStreamStatus('extracting');
            break;
          
          case 'extracted':
            setStreamStatus('extracted');
            setTimeout(() => setStreamStatus('generating'), 500);
            break;
          
          case 'meta':
            setStreamStatus('generating');
            setQuizMetadata({
              title: event.data?.title,
              category: event.data?.category,
              description: event.data?.description
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
          
          case 'completed':
            setStreamStatus('complete');
            const quizId = event.data?.quiz?.id;
            if (quizId) {
              setGeneratedQuizId(quizId);
              setTimeout(() => {
                setIsStreaming(false);
                navigation.navigate('QuizDetail', { id: quizId });
              }, 1500);
            }
            break;
          
          case 'error':
            setIsStreaming(false);
            Alert.alert('Error', event.message || 'Failed to generate quiz');
            break;
        }
      });
    } catch (error) {
      console.error('Upload and generate error:', error);
      setIsStreaming(false);
      Alert.alert(t('common:appName'), error?.message || 'Failed to generate quiz');
    }
  };

  return (
    <>
      {/* Streaming Modal */}
      <Modal
        visible={isStreaming}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <StreamingQuizLoader
          status={streamStatus}
          questionsGenerated={questionsGenerated}
          totalQuestions={Number.parseInt(numQuestions) || 5}
          currentQuestion={currentQuestion}
          metadata={quizMetadata}
        />
      </Modal>

      <LinearGradient colors={theme === 'light' ? ['#F9FAFB', '#E5E7EB'] : ['#121212', '#272727']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🤖</Text>
          <Text style={[styles.title, { color: theme === 'light' ? '#111827' : 'white' }]}>{t('upload:generateQuiz')}</Text>
          <Text style={[styles.subtitle, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>{t('upload:aiPowered')}</Text>
          
          {/* Content Added Feedback */}
          {showContentAdded && (
            <View style={styles.contentAddedBanner}>
              <Text style={styles.contentAddedText}>{contentFeedback}</Text>
            </View>
          )}
        </View>
        
        {/* Content Type Selection */}
        <View style={[styles.typeSelector, { backgroundColor: theme === 'light' ? '#F3F4F6' : '#272727' }]}>
          <TouchableOpacity 
            style={[styles.typeButton, uploadType === 'text' && (theme === 'light' ? styles.typeButtonActive : styles.typeButtonActiveDark)]}
            onPress={() => setUploadType('text')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeButtonText, uploadType === 'text' && (theme === 'light' ? styles.typeButtonTextActive : styles.typeButtonTextActiveDark)]}>
              📝 {t('upload:textInput')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, uploadType === 'file' && (theme === 'light' ? styles.typeButtonActive : styles.typeButtonActiveDark)]}
            onPress={() => setUploadType('file')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeButtonText, uploadType === 'file' && (theme === 'light' ? styles.typeButtonTextActive : styles.typeButtonTextActiveDark)]}>
              📁 {t('upload:fileUpload')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Text Input Section */}
        {uploadType === 'text' && (
        <View style={[styles.card, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e' }]}>
          <Text style={[styles.cardTitle, { color: theme === 'light' ? '#111827' : 'white' }]}>📝 {t('upload:fromText')}</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme === 'light' ? '#F3F4F6' : '#272727', color: theme === 'light' ? '#111827' : 'white' }]}
            placeholder={t('upload:fromText')}
            placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
            multiline
            numberOfLines={8}
            value={text}
            onChangeText={setText}
            editable={!loading}
          />

          <Text style={[styles.label, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>{t('upload:numQuestions')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme === 'light' ? '#F3F4F6' : '#272727', color: theme === 'light' ? '#111827' : 'white' }]}
            placeholder="5"
            placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
            keyboardType="number-pad"
            value={numQuestions}
            onChangeText={setNumQuestions}
            editable={!loading}
          />

          <Text style={[styles.label, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>{t('upload:difficultyLevel')}</Text>
          <View style={styles.difficultySelector}>
            {['easy', 'medium', 'hard'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyButton,
                  { backgroundColor: theme === 'light' ? '#F9FAFB' : '#272727', borderColor: theme === 'light' ? '#E5E7EB' : '#374151' },
                  difficulty === level && styles.difficultyButtonActive,
                  difficulty === level && level === 'easy' && { borderColor: '#10B981', backgroundColor: theme === 'light' ? '#ECFDF5' : '#10B98120' },
                  difficulty === level && level === 'medium' && { borderColor: '#F59E0B', backgroundColor: theme === 'light' ? '#FEF3C7' : '#F59E0B20' },
                  difficulty === level && level === 'hard' && { borderColor: '#EF4444', backgroundColor: theme === 'light' ? '#FEE2E2' : '#EF444420' },
                ]}
                onPress={() => setDifficulty(level)}
                disabled={loading}
              >
                <Text style={[
                  styles.difficultyButtonText,
                  { color: theme === 'light' ? '#6B7280' : '#9ca3af' },
                  difficulty === level && level === 'easy' && { color: '#10B981' },
                  difficulty === level && level === 'medium' && { color: '#F59E0B' },
                  difficulty === level && level === 'hard' && { color: '#EF4444' },
                ]}>
                  {level === 'easy' && `😊 ${t('upload:easy')}`}
                  {level === 'medium' && `🎯 ${t('upload:medium')}`}
                  {level === 'hard' && `🔥 ${t('upload:hard')}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={generateFromText}
            disabled={loading}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>✨ {t('upload:generate')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        )}

        {/* File Upload Section */}
        {uploadType === 'file' && (
        <View style={[styles.card, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e' }]}>
          <Text style={[styles.cardTitle, { color: theme === 'light' ? '#111827' : 'white' }]}>📄 {t('upload:fromFile')}</Text>
          <Text style={[styles.info, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>Upload PDF, Image, Word, or Text file</Text>
          
          {/* File Type Indicators */}
          <View style={[styles.fileTypesContainer, { backgroundColor: theme === 'light' ? '#F8FAFC' : '#272727' }]}>
            <View style={styles.fileType}>
              <Text style={styles.fileTypeEmoji}>📄</Text>
              <Text style={[styles.fileTypeText, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>PDF</Text>
            </View>
            <View style={styles.fileType}>
              <Text style={styles.fileTypeEmoji}>🖼️</Text>
              <Text style={[styles.fileTypeText, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>Image</Text>
            </View>
            <View style={styles.fileType}>
              <Text style={styles.fileTypeEmoji}>📄</Text>
              <Text style={[styles.fileTypeText, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>Word</Text>
            </View>
            <View style={styles.fileType}>
              <Text style={styles.fileTypeEmoji}>📄</Text>
              <Text style={[styles.fileTypeText, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>Text</Text>
            </View>
          </View>

          {selectedFile && (
            <View style={[styles.fileInfo, { backgroundColor: theme === 'light' ? '#EEF2FF' : '#4F46E520' }]}>
              <Text style={[styles.fileName, { color: theme === 'light' ? '#667eea' : '#A5B4FC' }]}>📎 {selectedFile.name}</Text>
              <Text style={[styles.fileSize, { color: theme === 'light' ? '#9CA3AF' : '#6B7280' }]}>
                {selectedFile.size ? `${Math.round(selectedFile.size / 1024)} KB` : 'Size unknown'}
              </Text>
              {contentFeedback && (
                <Text style={[styles.fileFeedback, { color: theme === 'light' ? '#4F46E5' : '#C7D2FE' }]}>{contentFeedback}</Text>
              )}
            </View>
          )}

          <Text style={[styles.label, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>{t('upload:numQuestions')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme === 'light' ? '#F3F4F6' : '#272727', color: theme === 'light' ? '#111827' : 'white' }]}
            placeholder="5"
            placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
            keyboardType="number-pad"
            value={numQuestions}
            onChangeText={setNumQuestions}
            editable={!loading}
          />

          <Text style={[styles.label, { color: theme === 'light' ? '#6B7280' : '#9ca3af' }]}>{t('upload:difficultyLevel')}</Text>
          <View style={styles.difficultySelector}>
            {['easy', 'medium', 'hard'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyButton,
                  { backgroundColor: theme === 'light' ? '#F9FAFB' : '#272727', borderColor: theme === 'light' ? '#E5E7EB' : '#374151' },
                  difficulty === level && styles.difficultyButtonActive,
                  difficulty === level && level === 'easy' && { borderColor: '#10B981', backgroundColor: theme === 'light' ? '#ECFDF5' : '#10B98120' },
                  difficulty === level && level === 'medium' && { borderColor: '#F59E0B', backgroundColor: theme === 'light' ? '#FEF3C7' : '#F59E0B20' },
                  difficulty === level && level === 'hard' && { borderColor: '#EF4444', backgroundColor: theme === 'light' ? '#FEE2E2' : '#EF444420' },
                ]}
                onPress={() => setDifficulty(level)}
                disabled={loading}
              >
                <Text style={[
                  styles.difficultyButtonText,
                  { color: theme === 'light' ? '#6B7280' : '#9ca3af' },
                  difficulty === level && level === 'easy' && { color: '#10B981' },
                  difficulty === level && level === 'medium' && { color: '#F59E0B' },
                  difficulty === level && level === 'hard' && { color: '#EF4444' },
                ]}>
                  {level === 'easy' && `😊 ${t('upload:easy')}`}
                  {level === 'medium' && `🎯 ${t('upload:medium')}`}
                  {level === 'hard' && `🔥 ${t('upload:hard')}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: theme === 'light' ? '#667eea' : '#4F46E5' }]}
            onPress={pickDocument}
            disabled={loading}
          >
            <Text style={styles.uploadButtonText}>{t('upload:chooseFile')}</Text>
          </TouchableOpacity>

          {selectedFile && (
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={uploadAndGenerate}
              disabled={loading}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>✨ {t('upload:uploadAndGenerate')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        )}
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  emoji: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  contentAddedBanner: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  contentAddedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonActiveDark: {
    backgroundColor: '#4F46E5',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#4F46E5',
  },
  typeButtonTextActiveDark: {
    color: 'white',
  },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  textArea: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, fontSize: 14, textAlignVertical: 'top', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20 },
  button: { borderRadius: 12, overflow: 'hidden' },
  buttonGradient: { padding: 18, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  info: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  fileTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  fileType: {
    alignItems: 'center',
    flex: 1,
  },
  fileTypeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  fileTypeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  fileInfo: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 16, marginBottom: 16 },
  fileName: { fontSize: 16, color: '#667eea', fontWeight: '600', marginBottom: 4 },
  fileSize: { fontSize: 14, color: '#9CA3AF', marginBottom: 8 },
  fileFeedback: { fontSize: 14, color: '#4F46E5', fontWeight: '500', textAlign: 'center' },
  uploadButton: { backgroundColor: '#667eea', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  uploadButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  difficultySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  difficultyButtonActive: {
    borderWidth: 2,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
