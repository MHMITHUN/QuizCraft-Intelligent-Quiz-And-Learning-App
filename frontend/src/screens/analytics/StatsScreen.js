import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { analyticsAPI } from '../../services/api';
import { useI18n } from '../../i18n';

export default function StatsScreen() {
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true })
      ])
    ).start();
    (async ()=>{
      try {
        const res = await analyticsAPI.getMyStats();
        setStats(res?.data?.data || {});
      } catch (e) {
        setStats({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const Skeleton = () => (<Animated.View style={[styles.skel, { opacity: pulse }]} />);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ padding: 16 }}>
          {[...Array(4)].map((_,i)=> <Skeleton key={i} />)}
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={styles.title}>{t('analytics:stats')}</Text>
          <Text style={styles.line}>{t('analytics:attempts')}: {stats?.stats?.totalQuizzes || 0}</Text>
          <Text style={styles.line}>{t('analytics:avgScore')}: {(stats?.stats?.averageScore || 0).toFixed(2)}%</Text>
          <Text style={styles.line}>{t('analytics:averageTime')}: {Math.round(stats?.stats?.totalTimeTaken || 0)}s</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  title: { fontWeight:'800', marginBottom: 6 },
  line: { color:'#6B7280', marginBottom: 4 },
  skel: { height: 56, backgroundColor:'#E5E7EB', borderRadius: 12, marginBottom: 12 }
});
