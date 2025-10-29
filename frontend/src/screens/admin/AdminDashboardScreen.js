import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, FlatList, TouchableOpacity } from 'react-native';
import { adminAPI } from '../../services/api';
import { useTheme } from '../../hooks/useTheme';

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const pulse = useRef(new Animated.Value(0.4)).current;
  const { theme } = useTheme();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true })
      ])
    ).start();
    (async ()=>{
      try {
        const res = await adminAPI.getDashboard();
        setStats(res?.data?.data || {});
      } catch (e) {
        setStats({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const Skeleton = () => (<Animated.View style={[styles.skel, { opacity: pulse, backgroundColor: theme === 'light' ? '#E5E7EB' : '#272727' }]} />);

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#F9FAFB' : '#121212' }]}>
      {loading ? (
        <View style={{ padding: 16 }}>
          {[...Array(6)].map((_,i)=> <Skeleton key={i} />)}
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={[styles.title, { color: theme === 'light' ? '#111827' : 'white' }]}>Users</Text>
          <Text style={[styles.line, { color: theme === 'light' ? '#6B7280' : '#9CA3AF' }]}>Total: {stats?.users?.total || 0} • Active: {stats?.users?.active || 0} • Premium: {stats?.users?.premium || 0}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={()=>navigation.navigate('AdminUsers', { preset: { isActive: 'true' } })}><Text style={styles.navBtnText}>Active Users</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={()=>navigation.navigate('AdminUsers', { preset: { subscription: 'premium' } })}><Text style={styles.navBtnText}>Premium Users</Text></TouchableOpacity>
          <Text style={[styles.title, { color: theme === 'light' ? '#111827' : 'white' }]}>Quizzes</Text>
          <Text style={[styles.line, { color: theme === 'light' ? '#6B7280' : '#9CA3AF' }]}>Total: {stats?.quizzes?.total || 0} • Public: {stats?.quizzes?.public || 0}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={()=>navigation.navigate('AdminQuizzes', { preset: { from, to } })}><Text style={styles.navBtnText}>Quizzes Created This Week</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={()=>navigation.navigate('AdminPayments')}><Text style={styles.navBtnText}>View Payments</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={()=>navigation.navigate('AdminUsers', { preset: { subscription: 'institutional' } })}><Text style={styles.navBtnText}>Institutional Users</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={()=>{
            const now = new Date();
            const day = now.getDay();
            const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()-day).toISOString().slice(0,10);
            const to = new Date().toISOString().slice(0,10);
            navigation.navigate('AdminUsers', { preset: { from, to } });
          }}><Text style={styles.navBtnText}>Users Created This Week</Text></TouchableOpacity>
          <Text style={[styles.title, { color: theme === 'light' ? '#111827' : 'white' }]}>Activity</Text>
          <TouchableOpacity style={styles.navBtn} onPress={()=>{
            const now = new Date();
            const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
            const to = new Date().toISOString().slice(0,10);
            navigation.navigate('AdminUsers', { preset: { from, to } });
          }}><Text style={styles.navBtnText}>Users Joined This Month</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={()=>{
            const now = new Date();
            const day = now.getDay();
            const diff = (day === 0 ? 6 : day-1); // Monday-based
            const monday = new Date(now); monday.setDate(now.getDate()-diff);
            const from = monday.toISOString().slice(0,10);
            const to = new Date().toISOString().slice(0,10);
            navigation.navigate('AdminQuizzes', { preset: { from, to } });
          }}><Text style={styles.navBtnText}>Quizzes Created This Week</Text></TouchableOpacity>
          <Text style={[styles.line, { color: theme === 'light' ? '#6B7280' : '#9CA3AF' }]}>Total Attempts: {stats?.activity?.totalAttempts || 0}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  title: { fontWeight:'800', marginTop: 8 },
  line: { color:'#6B7280', marginBottom: 4 },
  skel: { height: 56, backgroundColor:'#E5E7EB', borderRadius: 12, marginBottom: 12 },
  navBtn: { backgroundColor:'#2563EB', paddingVertical:8, borderRadius:10, alignItems:'center', marginVertical: 6 },
  navBtnText: { color:'#FFF', fontWeight:'800' }
});
