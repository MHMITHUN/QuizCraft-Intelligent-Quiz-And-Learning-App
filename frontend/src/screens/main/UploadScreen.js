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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.type === 'success') {
        setSelectedFile(result);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
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
      const response = await quizAPI.generateFromText({
        text: safeText,
        numQuestions: safeNum,
        quizType: 'mcq',
        difficulty: 'medium',
        language: 'en'
      });
      
      Alert.alert(t('upload:success'), t('upload:generateQuiz'), [
        {
          text: 'OK',
          onPress: () => {
            const quizId = response?.data?.data?.quiz?.id || response?.data?.data?.quiz?._id;
            if (quizId) {
              navigation.navigate('QuizDetail', { id: quizId });
            }
          }
        }
      ]);
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
        </View>

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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📄 {t('upload:fromFile')}</Text>
          <Text style={styles.info}>Upload PDF, Image, or Text file</Text>

          {selectedFile && (
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>📎 {selectedFile.name}</Text>
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
  fileInfo: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12, marginBottom: 16 },
  fileName: { fontSize: 14, color: '#667eea' },
  uploadButton: { backgroundColor: '#667eea', borderRadius: 12, padding: 16, alignItems: 'center' },
  uploadButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
