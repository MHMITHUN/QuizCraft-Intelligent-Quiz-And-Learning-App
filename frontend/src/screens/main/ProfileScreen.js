import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../../i18n';
import { TouchableOpacity as TO } from 'react-native';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        {user?.avatar ? (
<Image source={{ uri: user.avatar.startsWith('http')?user.avatar:(`${require('../../services/api').API_HOST}${user.avatar}`) }} />
        ) : (
          <Text style={styles.emoji}>👤</Text>
        )}
        <Text style={styles.name}>{user?.name || 'Guest'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user?.role || 'guest'}</Text>
        </View>
        {/* Language Toggle */}
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <TouchableOpacity style={[styles.langBtn, lang==='en' && styles.langBtnActive]} onPress={() => setLang('en')}>
            <Text style={[styles.langBtnText, lang==='en' && styles.langBtnTextActive]}>{t('common:english')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.langBtn, lang==='bn' && styles.langBtnActive]} onPress={() => setLang('bn')}>
            <Text style={[styles.langBtnText, lang==='bn' && styles.langBtnTextActive]}>{t('common:bangla')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981', marginBottom: 12 }]} onPress={() => navigation.navigate('Subscription')}>
          <Text style={styles.buttonText}>{t('subscription:title')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#0EA5E9', marginBottom: 12 }]} onPress={() => navigation.navigate('MyPayments')}>
          <Text style={styles.buttonText}>My Payments</Text>
        </TouchableOpacity>
        {user?.role === 'teacher' && (
          <TouchableOpacity style={[styles.button, { backgroundColor: '#2563EB', marginBottom: 12 }]} onPress={() => navigation.navigate('TeacherDashboard')}>
            <Text style={styles.buttonText}>{t('profile:teacherDashboard')}</Text>
          </TouchableOpacity>
        )}
        {user?.role === 'student' && (
          <TouchableOpacity style={[styles.button, { backgroundColor: '#2563EB', marginBottom: 12 }]} onPress={() => navigation.navigate('JoinClass')}>
            <Text style={styles.buttonText}>{t('teacher:joinClass')}</Text>
          </TouchableOpacity>
        )}
        {user?.role === 'admin' && (
          <TouchableOpacity style={[styles.button, { backgroundColor: '#7C3AED', marginBottom: 12 }]} onPress={() => navigation.navigate('AdminDashboard')}>
            <Text style={styles.buttonText}>{t('profile:adminDashboard')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.button, { backgroundColor: '#374151', marginBottom: 12 }]} onPress={() => navigation.navigate('ProfileEdit')}>
          <Text style={styles.buttonText}>{t('common:save')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>{t('profile:logout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  emoji: { fontSize: 64, marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  email: { fontSize: 14, color: '#FFF', opacity: 0.9 },
  badge: { backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 12 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#FFF', textTransform: 'uppercase' },
  content: { padding: 20 },
  button: { backgroundColor: '#EF4444', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  langBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginHorizontal: 6 },
  langBtnActive: { backgroundColor: '#FFF' },
  langBtnText: { color: '#FFF', fontWeight: '600' },
  langBtnTextActive: { color: '#4F46E5' },
});
