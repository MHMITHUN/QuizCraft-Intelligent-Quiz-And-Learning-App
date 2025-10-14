import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { quizAPI } from '../../services/api';
import { useI18n } from '../../i18n';

export default function UploadScreen({ navigation }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [numQuestions, setNumQuestions] = useState('5');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('text'); // 'text', 'file'
  const [showContentAdded, setShowContentAdded] = useState(false);
  const [contentFeedback, setContentFeedback] = useState('');

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

    setLoading(true);
    try {
      // Show content added feedback
      setContentFeedback('📝 Text content added as resource - generating quiz questions...');
      setShowContentAdded(true);
      
      const response = await quizAPI.generateFromText({
        text: safeText,
        numQuestions: safeNum,
        quizType: 'mcq',
        difficulty: 'medium',
        language: 'en'
      });
      
      setShowContentAdded(false);
      
      Alert.alert(
        t('upload:success'), 
        `Quiz successfully generated from your text content! ${safeNum} questions have been created.`,
        [
          {
            text: 'View Quiz',
            onPress: () => {
              const quizId = response?.data?.data?.quiz?.id || response?.data?.data?.quiz?._id;
              if (quizId) {
                navigation.navigate('QuizDetail', { id: quizId });
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Generate from text error:', error);
      const serverMsg = error?.response?.data?.message;
      const detailed = serverMsg || error?.message || 'Failed to generate quiz';
      Alert.alert(t('common:appName'), detailed);
    } finally {
      setLoading(false);
    }
  };

  const uploadAndGenerate = async () => {
    if (!selectedFile) {
      Alert.alert(t('common:appName'), t('upload:chooseFile'));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      });
      formData.append('numQuestions', Number.parseInt(numQuestions) || 5);
      formData.append('quizType', 'mcq');
      formData.append('difficulty', 'medium');
      formData.append('language', 'en');

      const response = await quizAPI.uploadAndGenerate(formData);

      Alert.alert(t('upload:success'), t('upload:generateQuiz'), [
        {
          text: 'OK',
          onPress: () => {
            const quizId = response.data.data?.quiz?.id || response.data.data?.quiz?._id;
            if (quizId) {
              navigation.navigate('QuizDetail', { id: quizId });
            }
          }
        }
      ]);
    } catch (error) {
      console.error('Upload and generate error:', error);
      const serverMsg = error?.response?.data?.message;
      const detailed = serverMsg || error?.message || 'Failed to generate quiz';
      Alert.alert(t('common:appName'), detailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#F9FAFB', '#E5E7EB']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🤖</Text>
          <Text style={styles.title}>{t('upload:generateQuiz')}</Text>
          <Text style={styles.subtitle}>{t('upload:aiPowered')}</Text>
          
          {/* Content Added Feedback */}
          {showContentAdded && (
            <View style={styles.contentAddedBanner}>
              <Text style={styles.contentAddedText}>{contentFeedback}</Text>
            </View>
          )}
        </View>
        
        {/* Content Type Selection */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeButton, uploadType === 'text' && styles.typeButtonActive]}
            onPress={() => setUploadType('text')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeButtonText, uploadType === 'text' && styles.typeButtonTextActive]}>
              📝 Text Input
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, uploadType === 'file' && styles.typeButtonActive]}
            onPress={() => setUploadType('file')}
            activeOpacity={0.7}
          >
            <Text style={[styles.typeButtonText, uploadType === 'file' && styles.typeButtonTextActive]}>
              📁 File Upload
            </Text>
          </TouchableOpacity>
        </View>

        {/* Text Input Section */}
        {uploadType === 'text' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 {t('upload:fromText')}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={t('upload:fromText')}
            multiline
            numberOfLines={8}
            value={text}
            onChangeText={setText}
            editable={!loading}
          />

          <Text style={styles.label}>{t('upload:numQuestions')}</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            keyboardType="number-pad"
            value={numQuestions}
            onChangeText={setNumQuestions}
            editable={!loading}
          />

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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📄 {t('upload:fromFile')}</Text>
          <Text style={styles.info}>Upload PDF, Image, Word, or Text file</Text>
          
          {/* File Type Indicators */}
          <View style={styles.fileTypesContainer}>
            <View style={styles.fileType}>
              <Text style={styles.fileTypeEmoji}>📄</Text>
              <Text style={styles.fileTypeText}>PDF</Text>
            </View>
            <View style={styles.fileType}>
              <Text style={styles.fileTypeEmoji}>🖼️</Text>
              <Text style={styles.fileTypeText}>Image</Text>
            </View>
            <View style={styles.fileType}>
              <Text style={styles.fileTypeEmoji}>📄</Text>
              <Text style={styles.fileTypeText}>Word</Text>
            </View>
            <View style={styles.fileType}>
              <Text style={styles.fileTypeEmoji}>📄</Text>
              <Text style={styles.fileTypeText}>Text</Text>
            </View>
          </View>

          {selectedFile && (
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>📎 {selectedFile.name}</Text>
              <Text style={styles.fileSize}>
                {selectedFile.size ? `${Math.round(selectedFile.size / 1024)} KB` : 'Size unknown'}
              </Text>
              {contentFeedback && (
                <Text style={styles.fileFeedback}>{contentFeedback}</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.uploadButton}
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
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#4F46E5',
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
  uploadButton: { backgroundColor: '#667eea', borderRadius: 12, padding: 16, alignItems: 'center' },
  uploadButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
