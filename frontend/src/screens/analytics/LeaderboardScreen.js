import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated } from 'react-native';
import { analyticsAPI } from '../../services/api';
import { useI18n } from '../../i18n';

export default function LeaderboardScreen() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
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
        const res = await analyticsAPI.getLeaderboard(20);
        setItems(res?.data?.data?.leaderboard || []);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const Skeleton = () => (<Animated.View style={[styles.skel, { opacity: pulse }]} />);

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <Text style={styles.rank}>{index+1}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>{t('analytics:score')}: {item.totalPoints} • {t('analytics:attempts')}: {item.quizzesTaken}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ padding: 16 }}>
          {[...Array(8)].map((_,i)=> <Skeleton key={i} />)}
        </View>
      ) : (
        <FlatList data={items} keyExtractor={(i)=>String(i.userId)} renderItem={renderItem} contentContainerStyle={{ padding: 16 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { flexDirection:'row', alignItems:'center', backgroundColor:'#FFF', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth:1, borderColor:'#E5E7EB' },
  rank: { width: 28, textAlign:'center', fontWeight:'800', color:'#4F46E5' },
  name: { fontWeight:'800' },
  sub: { color:'#6B7280' },
  skel: { height: 52, backgroundColor:'#E5E7EB', borderRadius: 12, marginBottom: 10 }
});
