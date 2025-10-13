import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { classesAPI } from '../../services/api';
import { useI18n } from '../../i18n';

export default function JoinClassScreen({ navigation }) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      await classesAPI.join(code.trim());
      Alert.alert('QuizCraft', 'Joined successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('teacher:joinClass')}</Text>
      <TextInput style={styles.input} placeholder={t('teacher:joinCode')} value={code} onChangeText={setCode} autoCapitalize="characters" />
      <TouchableOpacity style={styles.btn} onPress={join} disabled={loading}>
        <Text style={styles.btnText}>{loading ? '...' : t('teacher:joinClass')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F9FAFB', padding: 16, justifyContent:'center' },
  title: { fontWeight:'800', fontSize: 18, marginBottom: 12 },
  input: { backgroundColor:'#FFF', borderRadius: 12, borderWidth:1, borderColor:'#E5E7EB', padding: 12, marginBottom: 10 },
  btn: { backgroundColor:'#2563EB', borderRadius: 12, padding: 12, alignItems:'center' },
  btnText: { color:'#FFF', fontWeight:'800' }
});
