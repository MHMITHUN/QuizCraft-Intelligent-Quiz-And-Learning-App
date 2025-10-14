import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../../i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRolePermissions } from '../../components/RoleGuard';
import { authAPI } from '../../services/api';

export default function ProfileScreen({ navigation, route }) {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { isAdmin, isTeacher, isStudent, isPremium } = useRolePermissions();
  const [requesting, setRequesting] = useState(false);

  // Handle role upgrade request from params
  useEffect(() => {
    if (route?.params?.requestRoleUpgrade) {
      requestRoleUpgrade(route.params.requestRoleUpgrade);
    }
  }, [route?.params]);

  const requestRoleUpgrade = async (targetRole) => {
    if (requesting) return;
    
    Alert.alert(
      'Request Role Upgrade',
      `Would you like to request an upgrade to ${targetRole} role? This will require admin approval.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Upgrade',
          onPress: async () => {
            setRequesting(true);
            try {
              await authAPI.requestRoleUpgrade(targetRole);
              Alert.alert(
                'Request Submitted',
                `Your ${targetRole} role upgrade request has been submitted. An admin will review it shortly.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              const message = error?.response?.data?.message || 'Failed to submit role upgrade request';
              Alert.alert('Error', message);
            } finally {
              setRequesting(false);
            }
          }
        }
      ]
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return '#DC2626';
      case 'teacher': return '#059669';
      case 'student': return '#2563EB';
      default: return '#6B7280';
    }
  };

  const getSubscriptionBadgeColor = (plan) => {
    if (!plan || plan === 'free') return '#6B7280';
    if (plan.includes('premium')) return '#7C3AED';
    if (plan.includes('institutional')) return '#DC2626';
    return '#F59E0B';
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const MenuButton = ({ title, icon, color, onPress, subtitle = null, badge = null }) => (
    <TouchableOpacity
      style={[styles.menuButton, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuButtonLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuButtonTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuButtonSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuButtonRight}>
        {badge && (
          <View style={[styles.menuBadge, { backgroundColor: color }]}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image 
              source={{ 
                uri: user.avatar.startsWith('http') 
                  ? user.avatar 
                  : `${require('../../services/api').API_HOST}${user.avatar}` 
              }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.name}>{user?.name || 'Guest'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        
        <View style={styles.badgesContainer}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user?.role) }]}>
            <Text style={styles.badgeText}>{user?.role || 'guest'}</Text>
          </View>
          
          {user?.subscription?.plan && (
            <View style={[styles.subscriptionBadge, { backgroundColor: getSubscriptionBadgeColor(user.subscription.plan) }]}>
              <Ionicons name="star" size={12} color="white" />
              <Text style={styles.badgeText}>
                {user.subscription.plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          )}
        </View>
        
        {/* Language Toggle */}
        <View style={styles.languageToggle}>
          <TouchableOpacity 
            style={[styles.langBtn, lang === 'en' && styles.langBtnActive]} 
            onPress={() => setLang('en')}
          >
            <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.langBtn, lang === 'bn' && styles.langBtnActive]} 
            onPress={() => setLang('bn')}
          >
            <Text style={[styles.langBtnText, lang === 'bn' && styles.langBtnTextActive]}>বাংলা</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Menu Content */}
      <View style={styles.content}>
        {/* Subscription & Billing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription & Billing</Text>
          
          <MenuButton
            title="Subscription Plans"
            subtitle={isPremium ? 'Manage your subscription' : 'Upgrade to premium'}
            icon="star-outline"
            color="#10B981"
            badge={!isPremium ? "Upgrade" : null}
            onPress={() => navigation.navigate('Subscription')}
          />
          
          <MenuButton
            title="Payment History"
            subtitle="View your payments and invoices"
            icon="card-outline"
            color="#0EA5E9"
            onPress={() => navigation.navigate('MyPayments')}
          />
        </View>

        {/* Role-specific Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role Features</Text>
          
          {isAdmin && (
            <MenuButton
              title="Admin Dashboard"
              subtitle="Manage users, quizzes, and system settings"
              icon="settings-outline"
              color="#7C3AED"
              badge="Admin"
              onPress={() => navigation.navigate('AdminDashboard')}
            />
          )}
          
          {isTeacher && (
            <MenuButton
              title="Teacher Dashboard"
              subtitle="Manage your classes and students"
              icon="school-outline"
              color="#059669"
              badge="Teacher"
              onPress={() => navigation.navigate('TeacherDashboard')}
            />
          )}
          
          {isStudent && (
            <>
              <MenuButton
                title="Join Classes"
                subtitle="Join teacher classes with codes"
                icon="people-outline"
                color="#2563EB"
                onPress={() => navigation.navigate('JoinClass')}
              />
              
              <MenuButton
                title="Become a Teacher"
                subtitle="Request upgrade to teacher account"
                icon="trending-up-outline"
                color="#F59E0B"
                badge="Upgrade"
                onPress={() => requestRoleUpgrade('teacher')}
              />
            </>
          )}
        </View>

        {/* Account & General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Settings</Text>
          
          <MenuButton
            title="Quiz History"
            subtitle="View all your quiz attempts"
            icon="time-outline"
            color="#8B5CF6"
            onPress={() => navigation.navigate('History')}
          />
          
          <MenuButton
            title="My Statistics"
            subtitle="View your performance analytics"
            icon="analytics-outline"
            color="#06B6D4"
            onPress={() => navigation.navigate('Stats')}
          />
          
          <MenuButton
            title="My Quizzes"
            subtitle="View and manage your created quizzes"
            icon="library-outline"
            color="#EC4899"
            onPress={() => navigation.navigate('MyQuizzes')}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    textAlign: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
    textTransform: 'uppercase',
    marginLeft: 2,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: '#FFF',
  },
  langBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  langBtnTextActive: {
    color: '#4F46E5',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
    marginLeft: 4,
  },
  menuButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuButtonTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  menuButtonSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  menuButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  menuBadgeText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'uppercase',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
});
