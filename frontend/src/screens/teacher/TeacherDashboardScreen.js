import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Modal,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../i18n';
import { classesAPI, quizAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

// Generate random class code
const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if code exists in database
const checkCodeExists = async (code) => {
  try {
    const response = await classesAPI.checkCodeExists(code);
    return response.data.exists;
  } catch (error) {
    return false;
  }
};

export default function TeacherDashboardScreen({ navigation }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form states
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [useRandomCode, setUseRandomCode] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeError, setCodeError] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    loadClasses();
    
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

  const loadClasses = async () => {
    try {
      const response = await classesAPI.mine();
      setClasses(response.data.data.classes || []);
    } catch (error) {
      Toast.error('Failed to load classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClasses();
  };

  const generateNewCode = async () => {
    let code;
    let exists = true;
    let attempts = 0;
    
    // Try to generate a unique code (max 10 attempts)
    while (exists && attempts < 10) {
      code = generateRandomCode();
      exists = await checkCodeExists(code);
      attempts++;
    }
    
    if (exists) {
      Toast.error('Unable to generate unique code. Please try again.');
      return null;
    }
    
    return code;
  };

  const openCreateModal = async () => {
    setShowCreateModal(true);
    // Generate initial random code
    if (useRandomCode) {
      const code = await generateNewCode();
      if (code) {
        setGeneratedCode(code);
      }
    }
  };

  const validateCustomCode = async (code) => {
    if (!code.trim()) {
      setCodeError('');
      return;
    }
    
    if (code.length < 4 || code.length > 8) {
      setCodeError('Code must be 4-8 characters long');
      return;
    }
    
    if (!/^[A-Z0-9]+$/.test(code.toUpperCase())) {
      setCodeError('Code can only contain letters and numbers');
      return;
    }
    
    const exists = await checkCodeExists(code.toUpperCase());
    if (exists) {
      setCodeError('This code already exists. Please choose another.');
      return;
    }
    
    setCodeError('');
  };

  const createClass = async () => {
    if (!className.trim()) {
      Toast.warning('Please enter a class name');
      return;
    }
    
    if (!useRandomCode && codeError) {
      Toast.error('Please fix the code error');
      return;
    }
    
    setCreating(true);
    
    try {
      let finalCode;
      
      if (useRandomCode) {
        finalCode = generatedCode || await generateNewCode();
        if (!finalCode) {
          setCreating(false);
          return;
        }
      } else {
        finalCode = customCode.toUpperCase();
        // Final check for custom code
        const exists = await checkCodeExists(finalCode);
        if (exists) {
          setCodeError('This code already exists. Please choose another.');
          setCreating(false);
          return;
        }
      }
      
      await classesAPI.create({
        name: className.trim(),
        description: classDescription.trim(),
        code: finalCode
      });
      
      // Reset form
      setClassName('');
      setClassDescription('');
      setCustomCode('');
      setGeneratedCode('');
      setCodeError('');
      setShowCreateModal(false);
      
      Toast.success('Class created successfully!');
      loadClasses();
    } catch (error) {
      Toast.error('Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const deleteClass = async (classId, className) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete "${className}"? This action cannot be undone and all students will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await classesAPI.delete(classId);
              Toast.success('Class deleted successfully!');
              loadClasses();
            } catch (error) {
              Toast.error('Failed to delete class');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading your classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#EC4899']}
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
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>My Classes</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {user?.name?.split(' ')[0] || 'Teacher'}!
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <Animated.View 
          style={[
            styles.statsContainer,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Ionicons name="school-outline" size={24} color="white" />
            <Text style={styles.statNumber}>{classes.length}</Text>
            <Text style={styles.statLabel}>Active Classes</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="people-outline" size={24} color="white" />
            <Text style={styles.statNumber}>
              {classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="library-outline" size={24} color="white" />
            <Text style={styles.statNumber}>
              {classes.reduce((sum, cls) => sum + (cls.quizzes?.length || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Assigned Quizzes</Text>
          </View>
        </Animated.View>

        {/* Classes List */}
        <Animated.View 
          style={[
            styles.classesSection,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <Text style={styles.sectionTitle}>Your Classes</Text>
          
          {classes.length > 0 ? (
            classes.map((cls, index) => (
              <View key={cls._id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{cls.name}</Text>
                    <Text style={styles.classCode}>Code: {cls.code}</Text>
                    {cls.description && (
                      <Text style={styles.classDescription}>{cls.description}</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteClass(cls._id, cls.name)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.classStats}>
                  <View style={styles.classStat}>
                    <Ionicons name="people" size={16} color="#6B7280" />
                    <Text style={styles.classStatText}>
                      {cls.students?.length || 0} students
                    </Text>
                  </View>
                  
                  <View style={styles.classStat}>
                    <Ionicons name="library" size={16} color="#6B7280" />
                    <Text style={styles.classStatText}>
                      {cls.quizzes?.length || 0} quizzes
                    </Text>
                  </View>
                  
                  <View style={styles.classStat}>
                    <Ionicons name="time" size={16} color="#6B7280" />
                    <Text style={styles.classStatText}>
                      {new Date(cls.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.classActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
                    onPress={() => navigation.navigate('ClassDetail', { id: cls._id })}
                  >
                    <Ionicons name="eye-outline" size={16} color="white" />
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => navigation.navigate('MyQuizzes', { assignToClassId: cls._id })}
                  >
                    <Ionicons name="add-circle-outline" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Assign Quiz</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No classes yet</Text>
              <Text style={styles.emptyText}>
                Create your first class to start teaching with QuizCraft!
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={openCreateModal}
              >
                <Text style={styles.createFirstButtonText}>Create Your First Class</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Create Class Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Class</Text>
            <TouchableOpacity 
              onPress={createClass}
              disabled={creating || !className.trim()}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <Text style={[
                  styles.createText,
                  !className.trim() && styles.createTextDisabled
                ]}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Class Name *</Text>
              <TextInput
                style={styles.formInput}
                value={className}
                onChangeText={setClassName}
                placeholder="Enter class name (e.g., Mathematics Grade 10)"
                maxLength={50}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={classDescription}
                onChangeText={setClassDescription}
                placeholder="Brief description of your class"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Join Code</Text>
              
              <View style={styles.codeOptions}>
                <TouchableOpacity
                  style={[
                    styles.codeOption,
                    useRandomCode && styles.codeOptionActive
                  ]}
                  onPress={() => {
                    setUseRandomCode(true);
                    setCodeError('');
                    if (!generatedCode) {
                      generateNewCode().then(code => {
                        if (code) setGeneratedCode(code);
                      });
                    }
                  }}
                >
                  <Ionicons 
                    name={useRandomCode ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={useRandomCode ? "#4F46E5" : "#9CA3AF"} 
                  />
                  <Text style={styles.codeOptionText}>Generate Random Code</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.codeOption,
                    !useRandomCode && styles.codeOptionActive
                  ]}
                  onPress={() => {
                    setUseRandomCode(false);
                    setGeneratedCode('');
                  }}
                >
                  <Ionicons 
                    name={!useRandomCode ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={!useRandomCode ? "#4F46E5" : "#9CA3AF"} 
                  />
                  <Text style={styles.codeOptionText}>Custom Code</Text>
                </TouchableOpacity>
              </View>
              
              {useRandomCode ? (
                <View style={styles.generatedCodeContainer}>
                  <View style={styles.generatedCodeDisplay}>
                    <Text style={styles.generatedCodeText}>
                      {generatedCode || 'Generating...'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.regenerateButton}
                    onPress={async () => {
                      const newCode = await generateNewCode();
                      if (newCode) setGeneratedCode(newCode);
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TextInput
                    style={[
                      styles.formInput,
                      codeError && styles.formInputError
                    ]}
                    value={customCode}
                    onChangeText={(text) => {
                      const upperText = text.toUpperCase();
                      setCustomCode(upperText);
                      validateCustomCode(upperText);
                    }}
                    placeholder="Enter 4-8 character code (A-Z, 0-9)"
                    maxLength={8}
                    autoCapitalize="characters"
                  />
                  {codeError ? (
                    <Text style={styles.errorText}>{codeError}</Text>
                  ) : null}
                  <Text style={styles.codeHint}>
                    Make it memorable for your students!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  classesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  classCard: {
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
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#4F46E5',
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  deleteButton: {
    padding: 8,
  },
  classStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  classStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  classStatText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginLeft: 4,
  },
  classActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
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
  createText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#4F46E5',
  },
  createTextDisabled: {
    color: '#9CA3AF',
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
  formInputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  codeOptions: {
    marginBottom: 16,
  },
  codeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  codeOptionActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  codeOptionText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#374151',
    marginLeft: 12,
  },
  generatedCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generatedCodeDisplay: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  generatedCodeText: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#4F46E5',
    letterSpacing: 2,
  },
  regenerateButton: {
    marginLeft: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#EF4444',
    marginTop: 4,
  },
  codeHint: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
});
