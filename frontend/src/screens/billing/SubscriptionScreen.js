import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { subscriptionsAPI, paymentsAPI } from '../../services/api';
import { useI18n } from '../../i18n';

export default function SubscriptionScreen() {
  const { t } = useI18n();
  const [sub, setSub] = useState(null);

  const load = async () => {
    try {
      const res = await subscriptionsAPI.mine();
      setSub(res?.data?.data?.subscription || null);
    } catch (e) {}
  };
  useEffect(() => { load(); }, []);

  const upgrade = async (plan) => {
    try {
      await subscriptionsAPI.change(plan, 'monthly');
      await paymentsAPI.create({ amount: plan==='premium'?9.99:99, currency:'USD', provider:'manual', subscriptionPlan: plan });
      Alert.alert('QuizCraft', 'Subscription updated');
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4F46E5','#7C3AED']} style={styles.header}>
        <Text style={styles.title}>Subscription</Text>
        <Text style={styles.subText}>Current: {sub?.plan || 'free'}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Premium</Text>
          <Text style={styles.cardLine}>Faster AI</Text>
          <Text style={styles.cardLine}>Advanced Analytics</Text>
          <Text style={styles.cardLine}>Unlimited Saves</Text>
          <TouchableOpacity style={styles.btn} onPress={() => upgrade('premium')}>
            <Text style={styles.btnText}>Upgrade $9.99</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Institutional</Text>
          <Text style={styles.cardLine}>Organization License</Text>
          <Text style={styles.cardLine}>Admin Controls</Text>
          <Text style={styles.cardLine}>SSO (future)</Text>
          <TouchableOpacity style={styles.btnOutline} onPress={() => upgrade('institutional')}>
            <Text style={styles.btnOutlineText}>Contact Sales</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 24, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  subText: { color: '#E0E7FF', marginTop: 6 },
  body: { padding: 16 },
  card: { backgroundColor:'#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth:1, borderColor:'#E5E7EB' },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  cardLine: { color:'#6B7280', marginVertical: 2 },
  btn: { backgroundColor:'#10B981', paddingVertical: 12, borderRadius: 12, alignItems:'center', marginTop: 12 },
  btnText: { color:'#FFF', fontWeight:'800' },
  btnOutline: { borderWidth:1, borderColor:'#4F46E5', paddingVertical: 12, borderRadius: 12, alignItems:'center', marginTop: 12 },
  btnOutlineText: { color:'#4F46E5', fontWeight:'800' },
});
