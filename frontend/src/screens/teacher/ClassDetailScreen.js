import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { classesAPI } from '../../services/api';
import { useI18n } from '../../i18n';

export default function ClassDetailScreen({ route }) {
  const { id } = route.params || {};
  const { t } = useI18n();
  const [klass, setKlass] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await classesAPI.getById(id);
      setKlass(res?.data?.data?.class || null);
    })();
  }, [id]);

  if (!klass) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{klass.name}</Text>
      <Text style={styles.sub}>{t('teacher:joinCode')}: {klass.code}</Text>

      <Text style={styles.section}>{t('teacher:students')}</Text>
      <FlatList data={klass.students || []} keyExtractor={(s)=>s._id} renderItem={({ item }) => (
        <View style={styles.card}><Text style={styles.bold}>{item.name}</Text><Text>{item.email}</Text></View>
      )} />

      <Text style={styles.section}>{t('teacher:assignedQuizzes')}</Text>
      <FlatList data={klass.quizzes || []} keyExtractor={(q)=>q._id} renderItem={({ item }) => (
        <View style={styles.card}><Text style={styles.bold}>{item.title}</Text><Text>{item.category}</Text></View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F9FAFB', padding: 16 },
  title: { fontWeight:'800', fontSize: 18 },
  sub: { color:'#6B7280', marginBottom: 12 },
  section: { fontWeight:'800', marginTop: 12, marginBottom: 6 },
  card: { backgroundColor:'#FFF', borderRadius: 12, borderWidth:1, borderColor:'#E5E7EB', padding: 12, marginBottom: 8 },
  bold: { fontWeight:'800' }
});
