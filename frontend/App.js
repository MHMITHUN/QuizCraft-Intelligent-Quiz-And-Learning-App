import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { I18nProvider } from './src/i18n';
import { Ionicons } from '@expo/vector-icons';
import WebResponsiveWrapper from './src/components/WebResponsiveWrapper';
import { ToastComponent } from './src/components/Toast';

// Import web styles for better responsive design (web only)
if (Platform.OS === 'web') {
  try {
    require('./src/styles/web.css');
  } catch (e) {
    console.warn('Web styles not loaded:', e);
  }
}

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Main Screens
import HomeScreen from './src/screens/main/HomeScreen';
import UploadScreen from './src/screens/main/UploadScreen';
import SearchScreen from './src/screens/main/SearchScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';

// Quiz Screens
import QuizDetailScreen from './src/screens/quiz/QuizDetailScreen';
import TakeQuizScreen from './src/screens/quiz/TakeQuizScreen';
import QuizResultScreen from './src/screens/quiz/QuizResultScreen';
import MyQuizzesScreen from './src/screens/quiz/MyQuizzesScreen';

// Analytics & History
import HistoryScreen from './src/screens/analytics/HistoryScreen';
import LeaderboardScreen from './src/screens/analytics/LeaderboardScreen';
import StatsScreen from './src/screens/analytics/StatsScreen';

// Admin
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function MainTabs() {
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Upload') {
            iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          width: isWeb ? '100%' : 'auto',
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5'
        },
        headerShown: false
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Role-based Screen Wrapper
const RoleProtectedScreen = ({ component: Component, allowedRoles, ...props }) => {
  const RoleGuard = require('./src/components/RoleGuard').default;
  
  return (screenProps) => (
    <RoleGuard allowedRoles={allowedRoles} navigation={screenProps.navigation} showUpgrade>
      <Component {...screenProps} {...props} />
    </RoleGuard>
  );
};

// Main App Stack
function AppStack() {
  const { user } = useAuth();

  return (
    <Stack.Navigator>
      {/* Public screens available to all users */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="QuizDetail" 
        component={QuizDetailScreen}
        options={{ title: 'Quiz Details' }}
      />
      <Stack.Screen 
        name="TakeQuiz" 
        component={TakeQuizScreen}
        options={{ title: 'Take Quiz', headerShown: false }}
      />
      <Stack.Screen 
        name="QuizResult" 
        component={QuizResultScreen}
        options={{ title: 'Results', headerLeft: null }}
      />
      <Stack.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
      
      {/* Authenticated user screens */}
      <Stack.Screen 
        name="MyQuizzes" 
        component={MyQuizzesScreen}
        options={{ title: 'My Quizzes' }}
      />
      <Stack.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'Quiz History' }}
      />
      <Stack.Screen 
        name="Stats" 
        component={StatsScreen}
        options={{ title: 'My Statistics' }}
      />
      <Stack.Screen 
        name="Subscription" 
        component={require('./src/screens/billing/SubscriptionScreen').default}
        options={{ title: 'Subscription' }}
      />
      <Stack.Screen 
        name="MyPayments" 
        component={require('./src/screens/billing/MyPaymentsScreen').default}
        options={{ title: 'My Payments' }}
      />
      
      {/* Student-specific screens */}
      <Stack.Screen 
        name="JoinClass" 
        component={RoleProtectedScreen({
          component: require('./src/screens/teacher/JoinClassScreen').default,
          allowedRoles: ['student']
        })}
        options={{ title: 'Join Class' }}
      />
      
      {/* Teacher-specific screens */}
      <Stack.Screen 
        name="TeacherDashboard" 
        component={RoleProtectedScreen({
          component: require('./src/screens/teacher/TeacherDashboardScreen').default,
          allowedRoles: ['teacher', 'admin']
        })}
        options={{ title: 'Teacher Dashboard' }}
      />
      <Stack.Screen 
        name="ClassDetail" 
        component={RoleProtectedScreen({
          component: require('./src/screens/teacher/ClassDetailScreen').default,
          allowedRoles: ['teacher', 'admin']
        })}
        options={{ title: 'Class Details' }}
      />
      
      {/* Admin-specific screens */}
      <Stack.Screen 
        name="AdminDashboard" 
        component={RoleProtectedScreen({
          component: AdminDashboardScreen,
          allowedRoles: ['admin']
        })}
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen 
        name="AdminUsers" 
        component={RoleProtectedScreen({
          component: require('./src/screens/admin/AdminUsersScreen').default,
          allowedRoles: ['admin']
        })}
        options={{ title: 'User Management' }}
      />
      <Stack.Screen 
        name="AdminQuizzes" 
        component={RoleProtectedScreen({
          component: require('./src/screens/admin/AdminQuizzesScreen').default,
          allowedRoles: ['admin']
        })}
        options={{ title: 'Quiz Management' }}
      />
      <Stack.Screen 
        name="AdminPayments" 
        component={RoleProtectedScreen({
          component: require('./src/screens/admin/AdminPaymentsScreen').default,
          allowedRoles: ['admin']
        })}
        options={{ title: 'Payment Management' }}
      />
      <Stack.Screen 
        name="AdminSettings" 
        component={RoleProtectedScreen({
          component: require('./src/screens/admin/AdminSettingsScreen').default,
          allowedRoles: ['admin']
        })}
        options={{ title: 'System Settings' }}
      />
    </Stack.Navigator>
  );
}

// Root Navigation
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or loading screen
  }

  return user ? <AppStack /> : <AuthStack />;
}

export default function App() {
  const isWeb = Platform.OS === 'web';
  
  return (
    <WebResponsiveWrapper>
      <I18nProvider>
        <AuthProvider>
          <NavigationContainer
            theme={{
              colors: {
                background: '#f8fafc',
              },
            }}
          >
            <StatusBar style="auto" />
            <View style={{
              flex: 1,
              minHeight: isWeb ? '100vh' : 'auto',
              width: isWeb ? '100vw' : 'auto'
            }}>
              <RootNavigator />
              <ToastComponent />
            </View>
          </NavigationContainer>
        </AuthProvider>
      </I18nProvider>
    </WebResponsiveWrapper>
  );
}
