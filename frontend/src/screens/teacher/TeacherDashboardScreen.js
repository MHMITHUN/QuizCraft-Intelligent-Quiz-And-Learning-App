import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../../i18n';
import { classesAPI, quizAPI } from '../../services/api';

export default function TeacherDashboardScreen({ navigation }) {
  const { t } = useI18n();
  const [classes, setClasses] = useState([]);
  const [title, setTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [filter, setFilter] = useState('');

  const load = async () => {
    try {
      const res = await classesAPI.mine();
      setClasses(res.data.data.classes || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const createClass = async () => {
    if (!title.trim()) return;
    try {
      await classesAPI.create({ name: title });
      setTitle('');
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.classCard}>
      <Text style={styles.classTitle}>{item.name}</Text>
      <Text style={styles.classCode}>{t('teacher:joinCode')}: {item.code}</Text>
      <View style={{ flexDirection:'row', gap:8 }}>
        <TouchableOpacity style={styles.assignBtn} onPress={() => navigation.navigate('MyQuizzes', { assignToClassId: item._id })}>
          <Text style={styles.assignText}>{t('teacher:assignToClass')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.assignBtn, { backgroundColor:'#10B981' }]} onPress={() => navigation.navigate('ClassDetail', { id: item._id })}>
          <Text style={styles.assignText}>{t('teacher:classDetails')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filtered = Array.isArray(classes) ? classes.filter(c => !filter || c.name?.toLowerCase?.().includes(filter.toLowerCase())) : [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F46E5','#7C3AED']} style={styles.header}>
        <Text style={styles.headerTitle}>{t('teacher:myClasses')}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.row}>
          <TextInput style={styles.input} placeholder={t('teacher:className')} value={title} onChangeText={setTitle} />
          <TouchableOpacity style={styles.createBtn} onPress={createClass}>
            <Text style={styles.createText}>{t('teacher:create')}</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={[styles.input, { marginBottom: 8 }]} placeholder={t('admin:search')} value={filter} onChangeText={setFilter} />
        <FlatList data={filtered} renderItem={renderItem} keyExtractor={i=>i._id} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  body: { padding: 16 },
  row: { flexDirection: 'row', marginBottom: 12 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, marginRight: 8, height: 44 },
  createBtn: { backgroundColor: '#10B981', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  createText: { color: '#FFF', fontWeight: '700' },
  classCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  classTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  classCode: { color: '#6B7280', marginBottom: 8 },
  assignBtn: { backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  assignText: { color: '#FFF', fontWeight: '700' }
});
