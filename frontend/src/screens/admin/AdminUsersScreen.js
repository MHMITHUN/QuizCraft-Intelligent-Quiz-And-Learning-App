import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { adminAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';

export default function AdminUsersScreen({ route }) {
  const { t } = useI18n();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [subscription, setSubscription] = useState('');
  const [isActive, setIsActive] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { theme } = useTheme();

  const load = async (p = page) => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers({ page: p, limit: 20, role: role || undefined, search: search || undefined, subscription: subscription || undefined, isActive: isActive || undefined });
      setList(res?.data?.data?.users || []);
      setPage(res?.data?.data?.pagination?.page || p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const preset = route?.params?.preset || {};
    if (preset) {
      if (preset.role) setRole(preset.role);
      if (preset.subscription) setSubscription(preset.subscription);
      if (preset.isActive) setIsActive(preset.isActive);
      if (preset.from) setFrom(preset.from);
      if (preset.to) setTo(preset.to);
    }
    load(1); 
  }, []);

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]}>
      <Text style={[styles.name, { color: theme === 'light' ? '#111827' : 'white' }]}>{item.name} <Text style={styles.muted}>({item.role})</Text></Text>
      <Text style={[styles.muted, { color: theme === 'light' ? '#6B7280' : '#9CA3AF' }]}>{t('admin:email')}: {item.email}</Text>
    </View>
  );

  // Date picker (conditional)
  let DateTimePicker;
  try { DateTimePicker = require('@react-native-community/datetimepicker').default; } catch(e) { DateTimePicker = null; }
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#F9FAFB' : '#121212' }]}>
      <View style={styles.filters}>
        <TextInput style={[styles.input, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} placeholder={t('admin:search')} value={search} onChangeText={setSearch} placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'} />
        <TextInput style={[styles.input, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} placeholder={t('admin:role')} value={role} onChangeText={setRole} placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'} />
        <TextInput style={[styles.input, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} placeholder={t('admin:subscription')} value={subscription} onChangeText={setSubscription} placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'} />
        <TextInput style={[styles.input, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} placeholder={t('admin:isActive')} value={isActive} onChangeText={setIsActive} placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'} />
        <TouchableOpacity style={styles.btn} onPress={() => load(1)}><Text style={styles.btnText}>{t('admin:filter')}</Text></TouchableOpacity>
      </View>
      <View style={styles.filters}>
        <View style={styles.dateRow}>
          <TextInput style={[styles.input, { flex: 1, backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} placeholder={t('admin:from')} value={from} onChangeText={setFrom} placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'} />
          <TouchableOpacity style={[styles.calBtn, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} onPress={()=>setShowFrom(true)}><Text>📅</Text></TouchableOpacity>
        </View>
        <View style={styles.dateRow}>
          <TextInput style={[styles.input, { flex: 1, backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} placeholder={t('admin:to')} value={to} onChangeText={setTo} placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'} />
          <TouchableOpacity style={[styles.calBtn, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} onPress={()=>setShowTo(true)}><Text>📅</Text></TouchableOpacity>
        </View>
      </View>
      {DateTimePicker && showFrom && (
        <DateTimePicker value={from? new Date(from): new Date()} mode="date" onChange={(e, date)=>{ setShowFrom(false); if (date) setFrom(date.toISOString().slice(0,10)); }} />
      )}
      {DateTimePicker && showTo && (
        <DateTimePicker value={to? new Date(to): new Date()} mode="date" onChange={(e, date)=>{ setShowTo(false); if (date) setTo(date.toISOString().slice(0,10)); }} />
      )}
      <FlatList data={list} keyExtractor={(u)=>u._id} renderItem={renderItem} contentContainerStyle={{ padding: 16 }} />
      <View style={[styles.pager, { backgroundColor: theme === 'light' ? '#F9FAFB' : '#121212' }]}>
        <TouchableOpacity style={[styles.pagerBtn, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} onPress={() => { if (page>1) { setPage(page-1); load(page-1);} }}><Text style={{ color: theme === 'light' ? '#111827' : 'white' }}>{t('admin:prev')}</Text></TouchableOpacity>
        <Text style={{ color: theme === 'light' ? '#111827' : 'white' }}>{t('admin:page')}: {page}</Text>
        <TouchableOpacity style={[styles.pagerBtn, { backgroundColor: theme === 'light' ? '#FFF' : '#1e1e1e', borderColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} onPress={() => { const np = page+1; setPage(np); load(np);} }><Text style={{ color: theme === 'light' ? '#111827' : 'white' }}>{t('admin:next')}</Text></TouchableOpacity>
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
  name: { fontWeight:'800' },
  muted: { color:'#6B7280' },
  pager: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: 12 },
  pagerBtn: { borderWidth:1, borderColor:'#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  dateRow: { flexDirection:'row', alignItems:'center', flex:1 },
  calBtn: { marginLeft: 8, borderWidth:1, borderColor:'#E5E7EB', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 }
});
