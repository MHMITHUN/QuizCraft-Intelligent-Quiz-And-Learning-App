import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Share,
  Clipboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { classesAPI } from '../../services/api';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import { useTheme } from '../../hooks/useTheme';

export default function ClassDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { t } = useI18n();
  const { user } = useAuth();
  const [klass, setKlass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [processing, setProcessing] = useState(false);
  const { theme } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    loadClassDetails();
    
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
  }, [id]);

  const loadClassDetails = async () => {
    try {
      const [classRes, requestsRes] = await Promise.all([
        classesAPI.getById(id),
        classesAPI.getJoinRequests(id)
      ]);
      
      setKlass(classRes?.data?.data?.class || null);
      setJoinRequests(requestsRes?.data?.data?.requests || []);
    } catch (error) {
      Toast.error('Failed to load class details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClassDetails();
  };

  const generateNewCode = async () => {
    Alert.alert(
      'Generate New Code',
      'This will generate a new join code and invalidate the current one. Students with the old code won\'t be able to join.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await classesAPI.generateNewCode(id);
              setKlass(prev => ({ ...prev, code: response.data.data.code }));
              Toast.success('New join code generated!');
            } catch (error) {
              Toast.error('Failed to generate new code');
            }
          }
        }
      ]
    );
  };

  const copyCode = async () => {
    try {
      await Clipboard.setString(klass.code);
      Toast.success('Class code copied to clipboard!');
    } catch (error) {
      Toast.error('Failed to copy code');
    }
  };

  const shareClass = async () => {
    try {
      const message = `Join my QuizCraft class "${klass.name}" with code: ${klass.code}`;
      await Share.share({
        message,
        title: 'Join My Class',
      });
    } catch (error) {
      Toast.error('Failed to share class');
    }
  };

  const handleJoinRequest = async (requestId, action) => {
    setProcessing(true);
    try {
      await classesAPI.handleJoinRequest(id, requestId, action);
      
      const actionText = action === 'approve' ? 'approved' : 'rejected';
      Toast.success(`Join request ${actionText}!`);
      
      // Reload data to reflect changes
      loadClassDetails();
    } catch (error) {
      Toast.error(`Failed to ${action} join request`);
    } finally {
      setProcessing(false);
    }
  };

  const removeStudent = async (studentId) => {
    Alert.alert(
      'Remove Student',
      'Are you sure you want to remove this student from the class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await classesAPI.removeStudent(id, studentId);
              Toast.success('Student removed successfully!');
              loadClassDetails();
            } catch (error) {
              Toast.error('Failed to remove student');
            }
          }
        }
      ]
    );
  };

  const createPost = async () => {
    if (!postText.trim()) {
      Toast.warning('Please enter a message');
      return;
    }

    setPosting(true);
    try {
      await classesAPI.createPost(id, { message: postText.trim() });
      setPostText('');
      setShowPostModal(false);
      Toast.success('Post created successfully!');
      loadClassDetails();
    } catch (error) {
      Toast.error('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme === 'light' ? '#f8fafc' : '#121212' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={[styles.loadingText, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>Loading class details...</Text>
      </View>
    );
  }

  if (!klass) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme === 'light' ? '#f8fafc' : '#121212' }]}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={[styles.errorText, { color: theme === 'light' ? '#374151' : 'white' }]}>Class not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
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
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.className}>{klass.name}</Text>
            <Text style={styles.classStats}>
              {klass.students?.length || 0} students • {klass.quizzes?.length || 0} quizzes
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.codeButton}
            onPress={() => setShowCodeModal(true)}
          >
            <Ionicons name="qr-code" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actionRow,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => setShowPostModal(true)}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Post</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => setShowJoinRequests(true)}
          >
            <Ionicons name="people-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              Requests ({joinRequests.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={shareClass}
          >
            <Ionicons name="share-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Class Posts */}
        {klass.posts && klass.posts.length > 0 && (
          <Animated.View 
            style={[
              styles.section,
              { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="megaphone-outline" size={20} color="#4F46E5" />
              <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>Recent Posts</Text>
            </View>
            
            {klass.posts.slice(0, 3).map((post, index) => (
              <View key={post._id || index} style={[styles.postCard, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e' }]}>
                <View style={styles.postHeader}>
                  <View style={styles.teacherAvatar}>
                    <Text style={styles.teacherInitial}>
                      {post.author?.name?.charAt(0) || 'T'}
                    </Text>
                  </View>
                  <View style={styles.postInfo}>
                    <Text style={[styles.postAuthor, { color: theme === 'light' ? '#1e293b' : 'white' }]}>{post.author?.name || 'Teacher'}</Text>
                    <Text style={[styles.postTime, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.postMessage, { color: theme === 'light' ? '#374151' : 'white' }]}>{post.message}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Students Section */}
        <Animated.View 
          style={[
            styles.section,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>
              Students ({klass.students?.length || 0})
            </Text>
          </View>
          
          {klass.students && klass.students.length > 0 ? (
            klass.students.map((student, index) => (
              <View key={student._id} style={[styles.studentCard, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e' }]}>
                <View style={styles.studentInfo}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentInitial}>
                      {student.name?.charAt(0)?.toUpperCase() || 'S'}
                    </Text>
                  </View>
                  <View style={styles.studentDetails}>
                    <Text style={[styles.studentName, { color: theme === 'light' ? '#1e293b' : 'white' }]}>{student.name}</Text>
                    <Text style={[styles.studentEmail, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>{student.email}</Text>
                    <Text style={[styles.studentJoined, { color: theme === 'light' ? '#9CA3AF' : '#6B7280' }]}>
                      Joined {new Date(student.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeStudent(student._id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.emptyTitle, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>No students yet</Text>
              <Text style={[styles.emptyText, { color: theme === 'light' ? '#9CA3AF' : '#6B7280' }]}>Share your class code to get students</Text>
            </View>
          )}
        </Animated.View>

        {/* Assigned Quizzes Section */}
        <Animated.View 
          style={[
            styles.section,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="library-outline" size={20} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>
              Assigned Quizzes ({klass.quizzes?.length || 0})
            </Text>
          </View>
          
          {klass.quizzes && klass.quizzes.length > 0 ? (
            klass.quizzes.map((quiz, index) => (
              <TouchableOpacity
                key={quiz._id}
                style={[styles.quizCard, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e' }]}
                onPress={() => navigation.navigate('QuizDetail', { id: quiz._id })}
              >
                <View style={styles.quizInfo}>
                  <Text style={[styles.quizTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>{quiz.title}</Text>
                  <Text style={styles.quizCategory}>{quiz.category}</Text>
                  <Text style={[styles.quizStats, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>
                    {quiz.questions?.length} questions • {quiz.attempts || 0} attempts
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.emptyTitle, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>No quizzes assigned</Text>
              <Text style={[styles.emptyText, { color: theme === 'light' ? '#9CA3AF' : '#6B7280' }]}>Assign quizzes from your quiz library</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Class Code Modal */}
      <Modal
        visible={showCodeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#f8fafc' : '#121212' }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e', borderBottomColor: theme === 'light' ? '#e2e8f0' : '#272727' }]}>
            <TouchableOpacity onPress={() => setShowCodeModal(false)}>
              <Ionicons name="close" size={24} color={theme === 'light' ? '#374151' : 'white'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>Class Join Code</Text>
            <TouchableOpacity onPress={generateNewCode}>
              <Ionicons name="refresh" size={24} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.codeModalContent}>
            <View style={[styles.codeDisplay, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e' }]}>
              <Text style={styles.codeText}>{klass.code}</Text>
            </View>
            
            <Text style={[styles.codeInstructions, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>
              Students can join your class using this code
            </Text>
            
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={[styles.codeActionButton, { backgroundColor: '#10B981' }]}
                onPress={copyCode}
              >
                <Ionicons name="copy-outline" size={20} color="white" />
                <Text style={styles.codeActionText}>Copy Code</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.codeActionButton, { backgroundColor: '#3B82F6' }]}
                onPress={shareClass}
              >
                <Ionicons name="share-outline" size={20} color="white" />
                <Text style={styles.codeActionText}>Share Class</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Requests Modal */}
      <Modal
        visible={showJoinRequests}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#f8fafc' : '#121212' }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e', borderBottomColor: theme === 'light' ? '#e2e8f0' : '#272727' }]}>
            <TouchableOpacity onPress={() => setShowJoinRequests(false)}>
              <Ionicons name="close" size={24} color={theme === 'light' ? '#374151' : 'white'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>Join Requests</Text>
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsCount}>{joinRequests.length}</Text>
            </View>
          </View>
          
          <ScrollView style={styles.requestsList}>
            {joinRequests.length > 0 ? (
              joinRequests.map((request, index) => (
                <View key={request._id} style={[styles.requestCard, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e' }]}>
                  <View style={styles.requestInfo}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestInitial}>
                        {request.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.requestDetails}>
                      <Text style={[styles.requestName, { color: theme === 'light' ? '#1e293b' : 'white' }]}>{request.user?.name}</Text>
                      <Text style={[styles.requestEmail, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>{request.user?.email}</Text>
                      <Text style={[styles.requestTime, { color: theme === 'light' ? '#9CA3AF' : '#6B7280' }]}>
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestActionButton, styles.approveButton]}
                      onPress={() => handleJoinRequest(request._id, 'approve')}
                      disabled={processing}
                    >
                      <Ionicons name="checkmark" size={16} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.requestActionButton, styles.rejectButton]}
                      onPress={() => handleJoinRequest(request._id, 'reject')}
                      disabled={processing}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyRequests}>
                <Ionicons name="person-add-outline" size={64} color="#9CA3AF" />
                <Text style={[styles.emptyRequestsTitle, { color: theme === 'light' ? '#64748b' : '#9CA3AF' }]}>No join requests</Text>
                <Text style={[styles.emptyRequestsText, { color: theme === 'light' ? '#9CA3AF' : '#6B7280' }]}>All join requests will appear here</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Create Post Modal */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme === 'light' ? '#f8fafc' : '#121212' }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme === 'light' ? 'white' : '#1e1e1e', borderBottomColor: theme === 'light' ? '#e2e8f0' : '#272727' }]}>
            <TouchableOpacity onPress={() => setShowPostModal(false)}>
              <Ionicons name="close" size={24} color={theme === 'light' ? '#374151' : 'white'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#1e293b' : 'white' }]}>Create Post</Text>
            <TouchableOpacity 
              onPress={createPost}
              disabled={posting || !postText.trim()}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <Text style={[
                  styles.postSubmitText,
                  !postText.trim() && styles.postSubmitTextDisabled
                ]}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.postModalContent}>
            <TextInput
              style={[styles.postInput, { backgroundColor: theme === 'light' ? 'white' : '#272727', color: theme === 'light' ? '#111827' : 'white', borderColor: theme === 'light' ? '#e2e8f0' : '#374151' }]}
              value={postText}
              onChangeText={setPostText}
              placeholder="What would you like to share with your students?"
              placeholderTextColor={theme === 'light' ? '#9CA3AF' : '#6B7280'}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            
            <Text style={[styles.characterCount, { color: theme === 'light' ? '#9CA3AF' : '#6B7280' }]}>
              {postText.length}/1000
            </Text>
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  className: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'white',
    marginBottom: 4,
  },
  classStats: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  codeButton: {
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
  actionRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginLeft: 8,
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherInitial: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  postInfo: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
  },
  postTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  postMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInitial: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginBottom: 2,
  },
  studentJoined: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  removeButton: {
    padding: 8,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  quizCategory: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  quizStats: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
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
  codeModalContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDisplay: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  codeText: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#4F46E5',
    textAlign: 'center',
    letterSpacing: 8,
  },
  codeInstructions: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  codeActions: {
    flexDirection: 'row',
    width: '100%',
  },
  codeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  codeActionText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  requestsBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  requestsCount: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  requestsList: {
    flex: 1,
    padding: 20,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestInitial: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1e293b',
    marginBottom: 2,
  },
  requestEmail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  emptyRequests: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyRequestsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRequestsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  postModalContent: {
    flex: 1,
    padding: 20,
  },
  postInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  postSubmitText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#4F46E5',
  },
  postSubmitTextDisabled: {
    color: '#9CA3AF',
  },
});
