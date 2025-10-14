import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { analyticsAPI } from '../../services/api';
import { useI18n } from '../../i18n';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const pulse = useRef(new Animated.Value(0.4)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for loading
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true })
      ])
    ).start();

    // Load data
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await analyticsAPI.getLeaderboard(20);
      setItems(res?.data?.data?.leaderboard || []);
      
      // Animate entrance
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start();
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const Skeleton = () => (<Animated.View style={[styles.skel, { opacity: pulse }]} />);

  const getCrownIcon = (index) => {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getPodiumHeight = (index) => {
    if (index === 0) return 120; // Gold - tallest
    if (index === 1) return 90;  // Silver
    if (index === 2) return 70;  // Bronze
    return 50;
  };

  const getPodiumColor = (index) => {
    if (index === 0) return ['#FFD700', '#FFA500']; // Gold gradient
    if (index === 1) return ['#C0C0C0', '#A0A0A0']; // Silver gradient
    if (index === 2) return ['#CD7F32', '#A0522D']; // Bronze gradient
    return ['#667eea', '#764ba2'];
  };

  const renderTopThree = () => {
    const topThree = items.slice(0, 3);
    if (topThree.length === 0) return null;

    return (
      <Animated.View style={[styles.podiumContainer, { 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }]}>
        <Text style={styles.podiumTitle}>🏆 {t('analytics:leaderboard')} 🏆</Text>
        
        <View style={styles.podium}>
          {/* Second Place */}
          {topThree[1] && (
            <Animated.View style={[
              styles.podiumPlace,
              { height: getPodiumHeight(1) }
            ]}>
              <LinearGradient
                colors={getPodiumColor(1)}
                style={styles.podiumGradient}
              >
                <Text style={styles.podiumRank}>🥈</Text>
                <Text style={styles.podiumName}>{topThree[1].name}</Text>
                <Text style={styles.podiumScore}>{topThree[1].totalPoints}pts</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* First Place */}
          {topThree[0] && (
            <Animated.View style={[
              styles.podiumPlace,
              styles.firstPlace,
              { height: getPodiumHeight(0) }
            ]}>
              <LinearGradient
                colors={getPodiumColor(0)}
                style={styles.podiumGradient}
              >
                <Text style={styles.podiumRank}>👑</Text>
                <Text style={styles.podiumName}>{topThree[0].name}</Text>
                <Text style={styles.podiumScore}>{topThree[0].totalPoints}pts</Text>
                <View style={styles.crownDecoration}>
                  <Text style={styles.crownText}>CHAMPION</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Third Place */}
          {topThree[2] && (
            <Animated.View style={[
              styles.podiumPlace,
              { height: getPodiumHeight(2) }
            ]}>
              <LinearGradient
                colors={getPodiumColor(2)}
                style={styles.podiumGradient}
              >
                <Text style={styles.podiumRank}>🥉</Text>
                <Text style={styles.podiumName}>{topThree[2].name}</Text>
                <Text style={styles.podiumScore}>{topThree[2].totalPoints}pts</Text>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    );
  };

  const ListItem = React.memo(({ item, index }) => {
    const actualIndex = index + 3; // Since top 3 are shown in podium
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const slideInAnim = useRef(new Animated.Value(30)).current;

    React.useEffect(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          delay: index * 100,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideInAnim, {
          toValue: 0,
          delay: index * 50,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }, [index]);

    return (
      <Animated.View style={{
        transform: [
          { scale: scaleAnim },
          { translateX: slideInAnim }
        ]
      }}>
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <View style={styles.rankContainer}>
            <Text style={styles.rank}>{actualIndex + 1}</Text>
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            
            <View style={styles.userDetails}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Ionicons name="trophy" size={14} color="#F59E0B" />
                  <Text style={styles.statText}>{item.totalPoints} pts</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.statText}>{item.quizzesTaken} quizzes</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>{item.totalPoints}</Text>
            <Text style={styles.scoreLabel}>points</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  const renderItem = ({ item, index }) => (
    <ListItem item={item} index={index} />
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingTitle}>🏆 Loading Leaderboard...</Text>
          {[...Array(8)].map((_, i) => <Skeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={items.slice(3)} // Skip top 3 as they're shown in podium
          keyExtractor={(i) => String(i.userId)}
          renderItem={renderItem}
          ListHeaderComponent={renderTopThree}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  
  // Podium Styles
  podiumContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  podiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 20,
  },
  podiumPlace: {
    width: width * 0.28,
    marginHorizontal: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  firstPlace: {
    transform: [{ scale: 1.05 }],
    zIndex: 3,
  },
  podiumGradient: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  podiumRank: {
    fontSize: 32,
    marginBottom: 8,
  },
  podiumName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  podiumScore: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
  },
  crownDecoration: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  crownText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  
  // List Item Styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  
  // Loading Skeleton
  skel: {
    height: 72,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    marginVertical: 6,
    marginHorizontal: 16,
  },
});
