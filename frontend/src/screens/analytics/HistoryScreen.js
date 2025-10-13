import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated } from 'react-native';
import { analyticsAPI } from '../../services/api';

export default function HistoryScreen() {
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
    (async () => {
      try {
        const res = await analyticsAPI.getMyHistory(1, 20);
        setItems(res?.data?.data?.history || []);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const Skeleton = () => (
    <Animated.View style={[styles.skel, { opacity: pulse }]} />
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item?.quiz?.title || 'Quiz'}</Text>
      <Text style={styles.sub}>Score: {item.percentage?.toFixed?.(0)}% • {new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ padding: 16 }}>
          {[...Array(5)].map((_,i)=> <Skeleton key={i} />)}
        </View>
      ) : (
        <FlatList data={items} keyExtractor={(i)=>i._id} renderItem={renderItem} contentContainerStyle={{ padding: 16 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  card: { backgroundColor:'#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth:1, borderColor:'#E5E7EB' },
  title: { fontWeight:'800', marginBottom: 4 },
  sub: { color:'#6B7280' },
  skel: { height: 64, backgroundColor:'#E5E7EB', borderRadius: 12, marginBottom: 12 }
});
