import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { adminPaymentsAPI } from '../../services/api';

export default function AdminPaymentsScreen() {
  const [list, setList] = useState([]);

  useEffect(() => { (async ()=>{
    try { const res = await adminPaymentsAPI.list(); setList(res?.data?.data?.payments || []); } catch {}
  })(); }, []);

  return (
    <View style={styles.container}>
      <FlatList data={list} keyExtractor={(p)=>p._id} contentContainerStyle={{ padding: 16 }} renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.user?.name || 'User'} — ${item.amount} {item.currency}</Text>
          <Text style={styles.sub}>{item.provider} • {item.status} • {item.subscriptionPlan}</Text>
          <Text style={styles.sub}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#F9FAFB' },
  card: { backgroundColor:'#FFF', borderRadius: 12, borderWidth:1, borderColor:'#E5E7EB', padding: 12, marginBottom: 10 },
  title: { fontWeight:'800' },
  sub: { color:'#6B7280' }
});
