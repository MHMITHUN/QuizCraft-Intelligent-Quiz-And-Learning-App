import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Switch } from 'react-native';
import { adminAPI } from '../../services/api';
import { useI18n } from '../../i18n';

export default function AdminQuizzesScreen({ route }) {
  const { t } = useI18n();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isPublic, setIsPublic] = useState('');

  const load = async (p = page) => {
    try {
      setLoading(true);
      const res = await adminAPI.getQuizzes({ page: p, limit: 20, status: status || undefined });
      setList(res?.data?.data?.quizzes || []);
      setPage(res?.data?.data?.pagination?.page || p);
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    const preset = route?.params?.preset || {};
    if (preset?.status) setStatus(preset.status);
    if (preset?.from) setFrom(preset.from);
    if (preset?.to) setTo(preset.to);
    load(1); 
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.sub}>{t('admin:createdAt')}: {new Date(item.createdAt).toLocaleDateString()} • {t('admin:public')}: {item.isPublic? 'Yes':'No'}</Text>
    </View>
  );

  // Client-side filtered list for additional filters
  const filtered = Array.isArray(list) ? list.filter(q => {
    const txt = (q.title||'') + ' ' + (q.description||'');
    if (search && !txt.toLowerCase().includes(search.toLowerCase())) return false;
    if (isPublic && String(q.isPublic) !== String(isPublic).toLowerCase()) return false;
    if (from && new Date(q.createdAt) < new Date(from)) return false;
    if (to && new Date(q.createdAt) > new Date(to)) return false;
    return true;
  }) : [];

  let DateTimePicker;
  try { DateTimePicker = require('@react-native-community/datetimepicker').default; } catch(e) { DateTimePicker = null; }
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TextInput style={styles.input} placeholder={t('admin:search')} value={search} onChangeText={setSearch} />
        <TextInput style={styles.input} placeholder={t('admin:status')} value={status} onChangeText={setStatus} />
        <View style={styles.dateRow}><TextInput style={[styles.input, { flex:1 }]} placeholder={t('admin:from')} value={from} onChangeText={setFrom} /><TouchableOpacity style={styles.calBtn} onPress={()=>setShowFrom(true)}><Text>📅</Text></TouchableOpacity></View>
        <View style={styles.dateRow}><TextInput style={[styles.input, { flex:1 }]} placeholder={t('admin:to')} value={to} onChangeText={setTo} /><TouchableOpacity style={styles.calBtn} onPress={()=>setShowTo(true)}><Text>📅</Text></TouchableOpacity></View>
        <TextInput style={styles.input} placeholder={t('admin:public')} value={isPublic} onChangeText={setIsPublic} />
        <TouchableOpacity style={styles.btn} onPress={() => load(1)}><Text style={styles.btnText}>{t('admin:filter')}</Text></TouchableOpacity>
      </View>
      {DateTimePicker && showFrom && (
        <DateTimePicker value={from? new Date(from): new Date()} mode="date" onChange={(e, date)=>{ setShowFrom(false); if (date) setFrom(date.toISOString().slice(0,10)); }} />
      )}
      {DateTimePicker && showTo && (
        <DateTimePicker value={to? new Date(to): new Date()} mode="date" onChange={(e, date)=>{ setShowTo(false); if (date) setTo(date.toISOString().slice(0,10)); }} />
      )}
      <FlatList data={filtered} keyExtractor={(q)=>q._id} renderItem={renderItem} contentContainerStyle={{ padding: 16 }} />
      <View style={styles.pager}>
        <TouchableOpacity style={styles.pagerBtn} onPress={() => { if (page>1) { setPage(page-1); load(page-1);} }}><Text>{t('admin:prev')}</Text></TouchableOpacity>
        <Text>{t('admin:page')}: {page}</Text>
        <TouchableOpacity style={styles.pagerBtn} onPress={() => { const np = page+1; setPage(np); load(np);} }><Text>{t('admin:next')}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F9FAFB' },
  filters: { flexDirection:'row', padding: 12 },
  input: { flex:1, backgroundColor:'#FFF', borderRadius: 10, borderWidth:1, borderColor:'#E5E7EB', paddingHorizontal: 10, marginRight: 8 },
  btn: { backgroundColor:'#4F46E5', paddingHorizontal: 12, justifyContent:'center', borderRadius: 10 },
  btnText: { color:'#FFF', fontWeight:'700' },
  card: { backgroundColor:'#FFF', padding: 12, borderRadius: 12, borderWidth:1, borderColor:'#E5E7EB', marginBottom: 10 },
  title: { fontWeight:'800' },
  sub: { color:'#6B7280' },
  pager: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: 12 },
  pagerBtn: { borderWidth:1, borderColor:'#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  dateRow: { flexDirection:'row', alignItems:'center' },
  calBtn: { marginLeft: 8, borderWidth:1, borderColor:'#E5E7EB', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 }
});