import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import Toast from '../../components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../hooks/useTheme';
import * as Haptics from 'expo-haptics';

export default function AdminSettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    apiLimits: {
      free: { quizzes: 5, questions: 50 },
      student_basic: { quizzes: 50, questions: 500 },
      student_premium: { quizzes: -1, questions: -1 },
      teacher_basic: { quizzes: 100, questions: 1000 },
      teacher_premium: { quizzes: -1, questions: -1 },
      teacher_institutional: { quizzes: -1, questions: -1 }
    },
    features: {
      guestAccess: true,
      registrationOpen: true,
      maintenanceMode: false,
      vectorSearch: true
    }
  });
  
  const [packages, setPackages] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    id: '',
    name: '',
    namebn: '',
    role: 'student',
    price: { monthly: 0, yearly: 0 },
    features: [],
    color: '#4F46E5',
    popular: false,
    active: true
  });
  const [newFeature, setNewFeature] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const { theme } = useTheme();

  useEffect(() => {
    loadSettings();
    loadPackages();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      setSettings(response.data.data);
    } catch (error) {
      Toast.show('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const LOCAL_PACKAGES_KEY = '@admin_packages';

  const readLocalPackages = async () => {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_PACKAGES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const writeLocalPackages = async (pkgs) => {
    try { await AsyncStorage.setItem(LOCAL_PACKAGES_KEY, JSON.stringify(pkgs)); } catch {}
  };

  const loadPackages = async () => {
    try {
      const response = await adminAPI.getPackages();
      const list = response.data?.data || [];
      setPackages(list);
      // Mirror to local cache for offline usage
      writeLocalPackages(list).catch(()=>{});
    } catch (error) {
      // Fallback to local cache or seed defaults
      let local = await readLocalPackages();
      if (!Array.isArray(local) || local.length === 0) {
        local = [
          { id: 'local-student-basic', name: 'Student Basic', role: 'student', price: { monthly: 50, yearly: 500 }, features: ['Basic usage'], color: '#4F46E5', popular: false, active: true },
          { id: 'local-student-premium', name: 'Student Premium', role: 'student', price: { monthly: 199, yearly: 1999 }, features: ['Unlimited quizzes', 'Priority support'], color: '#7C3AED', popular: true, active: true },
          { id: 'local-teacher', name: 'Teacher', role: 'teacher', price: { monthly: 299, yearly: 2999 }, features: ['Class management', 'Reporting'], color: '#10B981', popular: false, active: true },
        ];
        writeLocalPackages(local).catch(()=>{});
      }
      setPackages(local);
    }
  };

  const validateSettings = () => {
    const plans = Object.entries(settings.apiLimits);
    for (const [plan, limits] of plans) {
      for (const key of ['quizzes','questions']) {
        const val = limits[key];
        if (typeof val !== 'number' || (!Number.isInteger(val))) return `Invalid ${key} for ${plan}`;
        if (val < -1) return `${key} for ${plan} cannot be below -1`;
      }
    }
    return null;
  };

  const saveSettings = async () => {
    const err = validateSettings();
    if (err) { 
      Toast.show(err, 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(()=>{});
      return; 
    }
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      Toast.show('Settings saved successfully!', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
    } catch (error) {
      Toast.show('Failed to save settings', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(()=>{});
    } finally {
      setSaving(false);
    }
  };

  const updateApiLimit = (plan, type, value) => {
    const raw = String(value ?? '').trim();
    let num = NaN;
    if (/^(-?\d+)$/.test(raw)) num = parseInt(raw, 10);
    else if (/^unlimited$/i.test(raw)) num = -1;

    setFieldErrors(prev => ({
      ...prev,
      [`${plan}.${type}`]: Number.isInteger(num) && num >= -1 ? null : 'Enter an integer or "Unlimited"'
    }));

    if (!Number.isInteger(num)) num = 0;

    setSettings(prev => ({
      ...prev,
      apiLimits: {
        ...prev.apiLimits,
        [plan]: {
          ...prev.apiLimits[plan],
          [type]: num
        }
      }
    }));
  };

  const toggleFeature = (feature) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  const openPackageModal = (pkg = null) => {
    if (pkg) {
      const pkgId = pkg.id || pkg._id || '';
      setPackageForm({ id: pkgId, name: pkg.name || '', namebn: pkg.namebn || '', role: pkg.role || 'student', price: { monthly: pkg.price?.monthly ?? 0, yearly: pkg.price?.yearly ?? 0 }, features: Array.isArray(pkg.features) ? pkg.features : [], color: pkg.color || '#4F46E5', popular: !!pkg.popular, active: pkg.active !== false });
      setEditingPackage({ id: pkgId });
    } else {
      setPackageForm({
        id: '',
        name: '',
        namebn: '',
        role: 'student',
        price: { monthly: 0, yearly: 0 },
        features: [],
        color: '#4F46E5',
        popular: false,
        active: true
      });
      setEditingPackage(null);
    }
    setNewFeature('');
    setShowPackageModal(true);
  };

  const savePackage = async () => {
    try {
      const payload = { ...packageForm };
      payload.features = Array.isArray(payload.features) ? payload.features.map(f => String(f)) : [];
      if (editingPackage && (editingPackage.id || packageForm.id)) {
        const pid = editingPackage.id || packageForm.id;
        try {
          await adminAPI.updatePackage(pid, payload);
        } catch {
          // Offline/local fallback update
          const pkgs = await readLocalPackages();
          const idx = pkgs.findIndex(p => (p.id || p._id) === pid);
          if (idx >= 0) {
            pkgs[idx] = { ...pkgs[idx], ...payload, id: pid };
          }
          await writeLocalPackages(pkgs);
        }
        Toast.show('Package updated successfully!', 'success');
      } else {
        const { id, ...createPayload } = payload;
        try {
          await adminAPI.createPackage(createPayload);
        } catch {
          // Offline/local fallback create
          const pkgs = await readLocalPackages();
          const newPkg = { ...createPayload, id: 'local-' + Date.now() };
          pkgs.push(newPkg);
          await writeLocalPackages(pkgs);
        }
        Toast.show('Package created successfully!', 'success');
      }
      setShowPackageModal(false);
      loadPackages();
    } catch (error) {
      Toast.show('Failed to save package', 'error');
    }
  };

  const deletePackage = async (packageId) => {
    Alert.alert(
      'Delete Package',
      'Are you sure you want to delete this package? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deletePackage(packageId);
            } catch {
              // Local fallback
              const pkgs = await readLocalPackages();
              const filtered = pkgs.filter(p => (p.id || p._id) !== packageId);
              await writeLocalPackages(filtered);
            }
            Toast.show('Package deleted successfully!', 'success');
            loadPackages();
          }
        }
      ]
    );
  };

  const addFeatureToPackage = () => {
    const val = (newFeature || '').trim();
    if (!val) return;
    setPackageForm(prev => ({ ...prev, features: [...(prev.features || []), val] }));
    setNewFeature('');
  };

  const removeFeatureFromPackage = (index) => {
    setPackageForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme === 'light' ? '#f8fafc' : '#121212' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={[styles.loadingText, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>Loading admin settings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f8fafc' : '#121212' }]}>
      {/* Header */}
      <LinearGradient
        colors={theme === 'light' ? ['#4F46E5', '#7C3AED', '#EC4899'] : ['#222','#555']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>System Settings</Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="checkmark" size={24} color="white" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* API Limits Section */}
        <Animated.View 
          style={[
            styles.section,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={24} color="#4F46E5" />
            <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>API Usage Limits</Text>
          </View>
          
          {Object.entries(settings.apiLimits).map(([plan, limits]) => (
            <View key={plan} style={[styles.limitCard, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e' }]}>
              <Text style={[styles.limitCardTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>
                {plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              
              <View style={styles.limitRow}>
                <Text style={[styles.limitLabel, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>Monthly Quizzes:</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.limitInput, { backgroundColor: theme === 'light' ? 'white' : '#272727', color: theme === 'light' ? '#111827' : 'white', borderColor: fieldErrors[`${plan}.quizzes`] ? '#EF4444' : (theme === 'light' ? '#e2e8f0' : '#374151') }]}
                    value={limits.quizzes === -1 ? 'Unlimited' : String(limits.quizzes)}
                    onChangeText={(value) => updateApiLimit(plan, 'quizzes', value)}
                    placeholder="number or Unlimited"
                    placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
                    keyboardType="default"
                  />
                  {!!fieldErrors[`${plan}.quizzes`] && (<Text style={styles.errorHint}>{fieldErrors[`${plan}.quizzes`]}</Text>)}
                </View>
              </View>
              
              <View style={styles.limitRow}>
                <Text style={[styles.limitLabel, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>Monthly Questions:</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.limitInput, { backgroundColor: theme === 'light' ? 'white' : '#272727', color: theme === 'light' ? '#111827' : 'white', borderColor: fieldErrors[`${plan}.questions`] ? '#EF4444' : (theme === 'light' ? '#e2e8f0' : '#374151') }]}
                    value={limits.questions === -1 ? 'Unlimited' : String(limits.questions)}
                    onChangeText={(value) => updateApiLimit(plan, 'questions', value)}
                    placeholder="number or Unlimited"
                    placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
                    keyboardType="default"
                  />
                  {!!fieldErrors[`${plan}.questions`] && (<Text style={styles.errorHint}>{fieldErrors[`${plan}.questions`]}</Text>)}
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* System Features Section */}
        <Animated.View 
          style={[
            styles.section,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="toggle-outline" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>System Features</Text>
          </View>
          
          {Object.entries(settings.features).map(([feature, enabled]) => (
            <View key={feature} style={[styles.featureRow, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e' }]}>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureName, { color: theme === 'light' ? '#1e293b' : 'white' }]}>
                  {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text style={[styles.featureDescription, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>
                  {getFeatureDescription(feature)}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={() => toggleFeature(feature)}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor={enabled ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          ))}
        </Animated.View>

        {/* Live Preview */}
        <Animated.View
          style={[styles.section, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={24} color="#4F46E5" />
            <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>Live Preview</Text>
          </View>
          <View style={[styles.limitCard, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e' }]}>
            {Object.entries(settings.apiLimits).map(([plan, limits]) => (
              <Text key={plan} style={{ marginBottom: 6, color: theme === 'light' ? '#1e293b' : 'white' }}>
                {plan.replace('_',' ').toUpperCase()}: {limits.quizzes === -1 ? 'Unlimited' : limits.quizzes} quizzes / {limits.questions === -1 ? 'Unlimited' : limits.questions} questions per month
              </Text>
            ))}
          </View>
        </Animated.View>

        {/* Package Management Section */}
        <Animated.View 
          style={[
            styles.section,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>Subscription Packages</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openPackageModal()}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {packages.map((pkg, index) => (
            <View key={pkg.id || pkg._id || index} style={[styles.packageCard, { borderLeftColor: pkg.color, backgroundColor: theme === 'light' ? 'white' : '#1e1e1e' }]}>
              <View style={styles.packageHeader}>
                <View>
                  <Text style={[styles.packageName, { color: theme === 'light' ? '#1e293b' : 'white' }]}>{pkg.name}</Text>
                  <Text style={[styles.packageRole, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>{pkg.role} • ৳{pkg.price.monthly}/month</Text>
                </View>
                <View style={styles.packageActions}>
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Popular</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openPackageModal(pkg)}
                  >
                    <Ionicons name="pencil" size={16} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deletePackage(pkg.id || pkg._id)}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={[styles.packageFeatures, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>
                {pkg.features.length} features • {pkg.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Package Modal */}
      <Modal
        visible={showPackageModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#f8fafc' : '#121212' }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e', borderBottomColor: theme === 'light' ? '#e2e8f0' : '#272727' }]}>
            <TouchableOpacity onPress={() => setShowPackageModal(false)}>
              <Ionicons name="close" size={24} color={theme === 'light' ? '#374151' : 'white'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>
              {editingPackage ? 'Edit Package' : 'Create Package'}
            </Text>
            <TouchableOpacity onPress={savePackage}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme === 'light' ? '#374151' : 'white' }]}>Package Name</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme === 'light' ? 'white' : '#272727', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#e2e8f0' : '#374151' }]}
                value={packageForm.name}
                onChangeText={(text) => setPackageForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter package name"
                placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme === 'light' ? '#374151' : 'white' }]}>Bengali Name</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: theme === 'light' ? 'white' : '#272727', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#e2e8f0' : '#374151' }]}
                value={packageForm.namebn}
                onChangeText={(text) => setPackageForm(prev => ({ ...prev, namebn: text }))}
                placeholder="বাংলা নাম লিখুন"
                placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme === 'light' ? '#374151' : 'white' }]}>Role</Text>
              <View style={[styles.roleSelector, { backgroundColor: theme === 'light' ? '#e2e8f0' : '#272727' }]}>
                {['student', 'teacher'].map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      packageForm.role === role && (theme === 'light' ? styles.roleOptionActive : styles.roleOptionActiveDark)
                    ]}
                    onPress={() => setPackageForm(prev => ({ ...prev, role }))}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      { color: theme === 'light' ? '#64748b' : '#9CA3AF' },
                      packageForm.role === role && styles.roleOptionTextActive
                    ]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.priceRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.formLabel, { color: theme === 'light' ? '#374151' : 'white' }]}>Monthly Price (৳)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme === 'light' ? 'white' : '#272727', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#e2e8f0' : '#374151' }]}
                  value={String(packageForm.price.monthly)}
                  onChangeText={(text) => setPackageForm(prev => ({
                    ...prev,
                    price: { ...prev.price, monthly: parseInt(text) || 0 }
                  }))}
                  placeholder="0"
                  placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={[styles.formLabel, { color: theme === 'light' ? '#374151' : 'white' }]}>Yearly Price (৳)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme === 'light' ? 'white' : '#272727', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#e2e8f0' : '#374151' }]}
                  value={String(packageForm.price.yearly)}
                  onChangeText={(text) => setPackageForm(prev => ({
                    ...prev,
                    price: { ...prev.price, yearly: parseInt(text) || 0 }
                  }))}
                  placeholder="0"
                  placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.featuresHeader}>
                  <Text style={[styles.formLabel, { color: theme === 'light' ? '#374151' : 'white' }]}>Features</Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                  <TextInput
                    style={[styles.formInput, { width: 200, backgroundColor: theme === 'light' ? 'white' : '#272727', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#e2e8f0' : '#374151' }]}
                    placeholder="Add a feature"
                    placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
                    value={newFeature}
                    onChangeText={setNewFeature}
                    onSubmitEditing={addFeatureToPackage}
                  />
                  <TouchableOpacity
                    style={styles.addFeatureButton}
                    onPress={addFeatureToPackage}
                  >
                    <Ionicons name="add" size={16} color="#4F46E5" />
                    <Text style={styles.addFeatureText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {packageForm.features.map((feature, index) => (
                <View key={index} style={[styles.featureItem, { backgroundColor: theme === 'light' ? 'white' : '#272727', borderColor: theme === 'light' ? '#e2e8f0' : '#374151' }]}>
                  <Text style={[styles.featureItemText, { color: theme === 'light' ? '#374151' : 'white' }]}>{feature}</Text>
                  <TouchableOpacity onPress={() => removeFeatureFromPackage(index)}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            <View style={styles.switchRow}>
              <Text style={[styles.formLabel, { color: theme === 'light' ? '#374151' : 'white' }]}>Mark as Popular</Text>
              <Switch
                value={packageForm.popular}
                onValueChange={(value) => setPackageForm(prev => ({ ...prev, popular: value }))}
                trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              />
            </View>
            
            <View style={styles.switchRow}>
              <Text style={[styles.formLabel, { color: theme === 'light' ? '#374151' : 'white' }]}>Active</Text>
              <Switch
                value={packageForm.active}
                onValueChange={(value) => setPackageForm(prev => ({ ...prev, active: value }))}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getFeatureDescription = (feature) => {
  const descriptions = {
    guestAccess: 'Allow users to try quizzes without registration',
    registrationOpen: 'Accept new user registrations',
    maintenanceMode: 'Put the system in maintenance mode',
    vectorSearch: 'Enable AI-powered semantic search'
  };
  return descriptions[feature] || 'System feature setting';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'Poppins-Medium',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginLeft: 12,
    flex: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  limitCardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#64748b',
    flex: 1,
  },
  limitInput: {
    width: 120,
    height: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#1e293b',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  errorHint: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right'
  },
  packageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
  },
  packageRole: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  packageActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  popularText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  packageFeatures: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#4F46E5',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    backgroundColor: 'white',
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleOptionActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleOptionActiveDark: {
    backgroundColor: '#4F46E5',
  },
  roleOptionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#64748b',
  },
  roleOptionTextActive: {
    color: '#1e293b',
  },
  priceRow: {
    flexDirection: 'row',
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addFeatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  addFeatureText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#4F46E5',
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featureItemText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#374151',
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});