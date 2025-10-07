// HomeScreen.tsx - COMPLETE UPDATED VERSION
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useWebSocket} from '../../utility/WebSocketConnection';
import {useRoute} from '@react-navigation/native';
import {RouteProp} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Car {
  id: string;
  imageUrl?: string;
  isScrap?: boolean;
  city?: string;
  rtoCode?: string;
  make?: string;
  model?: string;
  variant?: string;
  engine?: string;
  kmsDriven?: number;
  owner?: string;
  fuelType?: string;
  remainingTime?: string;
  currentBid?: number;
}

// Define Root Stack Param List
type RootStackParamList = {
  Login: undefined;
  Home: {
    token: string;
    userId: string;
    userInfo: any;
  };
  ForgotPassword: undefined;
};

// Define route prop type
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'OCB'>('LIVE');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [storedUserId, setStoredUserId] = useState<string | null>(null);

  const route = useRoute<HomeScreenRouteProp>();

  // Safely get route parameters
  const routeParams = route.params;

  const {
    liveCars,
    getLiveCars,
    connectWebSocket,
    isConnected,
    connectionError,
    connectionStatus,
  } = useWebSocket();

  // Load stored token and user ID on component mount
  useEffect(() => {
    loadStoredAuthData();
  }, []);

  const loadStoredAuthData = async () => {
    try {
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_ID_KEY),
      ]);

      if (token) {
        setStoredToken(token);
        console.log('✅ Loaded stored token in HomeScreen');
      }

      if (userId) {
        setStoredUserId(userId);
        console.log('✅ Loaded stored user ID in HomeScreen');
      }
    } catch (error) {
      console.error('❌ Error loading stored auth data:', error);
    }
  };

  // Get the actual token and user ID (priority: route params -> stored data)
  const token = routeParams?.token || storedToken;
  const userId = routeParams?.userId || storedUserId;
  const userInfo = routeParams?.userInfo;

  // ========== ENHANCED CONNECTION LOGIC ==========

  // Enhanced monitoring effect
  useEffect(() => {
    console.log('🏠 HomeScreen - Monitoring Flow:');
    console.log('🔍 Connection Status:', connectionStatus);
    console.log('🔍 Is Connected:', isConnected);
    console.log('🔍 Live Cars Count:', liveCars.length);
    console.log('🔍 Connection Error:', connectionError);
    console.log('🔍 Token Available:', !!token);
    console.log('🔍 User ID:', userId);

    // Auto-connect if we have token but are disconnected
    if (token && connectionStatus === 'disconnected') {
      console.log('🔄 HomeScreen: Auto-connecting WebSocket...');
      connectWebSocket(token);
    }

    // Auto-fetch cars when connected
    if (
      isConnected &&
      connectionStatus === 'connected' &&
      liveCars.length === 0
    ) {
      console.log('🚗 HomeScreen: Connected and fetching live cars...');
      // Small delay to ensure subscriptions are ready
      setTimeout(() => {
        getLiveCars();
      }, 1000);
    }
  }, [
    isConnected,
    liveCars.length,
    connectionStatus,
    connectionError,
    token,
    userId,
  ]);

  // Initial connection effect
  useEffect(() => {
    const initConnection = () => {
      if (token) {
        console.log('🎯 HomeScreen: Initializing with token...');

        if (connectionStatus === 'disconnected') {
          console.log('🔗 Triggering initial WebSocket connection...');
          connectWebSocket(token);
        }
      }
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(initConnection, 1000);

    return () => clearTimeout(timer);
  }, [token]);

  // Connection state change effect
  useEffect(() => {
    switch (connectionStatus) {
      case 'connected':
        console.log('🎉 WebSocket connected successfully!');
        setIsLoading(false);
        break;
      case 'error':
        console.log('💥 Connection error occurred');
        setIsLoading(false);
        break;
      case 'connecting':
        console.log('🔄 WebSocket connecting...');
        setIsLoading(true);
        break;
      default:
        break;
    }
  }, [connectionStatus]);

  // ========== END OF ENHANCED CONNECTION LOGIC ==========

  // Pull to refresh
  const onRefresh = async () => {
    console.log('🔃 Manual refresh started');
    setRefreshing(true);

    try {
      if (isConnected) {
        getLiveCars();
      } else {
        console.log('🔌 Not connected, attempting reconnect...');
        if (token) {
          connectWebSocket(token);
        }
      }
    } catch (error) {
      console.error('❌ Refresh error:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 2000);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Manual retry initiated');
    setIsLoading(true);

    if (token) {
      connectWebSocket(token);
    } else {
      Alert.alert('Authentication Required', 'Please login again.');
    }
  };

  const checkFlowStatus = () => {
    const status = `
🏁 COMPLETE FLOW STATUS:

1. ✅ Login: ${token ? 'Completed' : 'Pending'}
2. 🔗 WebSocket: ${connectionStatus}
3. 📡 Subscriptions: ${isConnected ? 'Active' : 'Inactive'}
4. 🚗 Live Cars: ${liveCars.length} cars loaded
5. 🖥️ UI: ${isLoading ? 'Loading...' : 'Ready'}
6. 👤 User: ${userId || 'Unknown'}

${connectionError ? `❌ Error: ${connectionError}` : '✅ No Errors'}
    `;

    console.log(status);
    Alert.alert('Flow Status', status);
  };

  // Render car card
  const renderCarCard = (car: Car, index: number) => {
    const carData = {
      id: car.id || `car-${index}`,
      imageUrl: car.imageUrl,
      isScrap: car.isScrap || false,
      city: car.city || 'Mumbai',
      rtoCode: car.rtoCode || 'MH-01',
      make: car.make || 'Car',
      model: car.model || 'Model',
      variant: car.variant || 'Variant',
      engine: car.engine || '1.0L',
      kmsDriven: car.kmsDriven || 0,
      owner: car.owner || '1st Owner',
      fuelType: car.fuelType || 'Petrol',
      remainingTime: car.remainingTime || '01:30:00',
      currentBid: car.currentBid || 0,
    };

    return (
      <View key={carData.id} style={styles.card}>
        <Image
          source={
            carData.imageUrl
              ? {uri: carData.imageUrl}
              : require('../../assets/images/car1.png')
          }
          style={styles.carImage}
          defaultSource={require('../../assets/images/car1.png')}
        />

        <TouchableOpacity style={styles.heartIcon}>
          <Ionicons name="heart-outline" size={24} color="#fff" />
        </TouchableOpacity>

        {carData.isScrap && (
          <View style={styles.scrapBadge}>
            <Text style={styles.scrapText}>SCRAP CAR</Text>
          </View>
        )}

        <View style={styles.cardDetails}>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#555" />
            <Text style={styles.locationTextSmall}>
              {carData.city} • {carData.rtoCode}
            </Text>
          </View>

          <View style={styles.carHeaderRow}>
            <Text style={styles.carTitle}>
              {carData.make} {carData.model}
            </Text>
            <View style={styles.engineTag}>
              <Text style={styles.engineText}>ENGINE {carData.engine}</Text>
              <Ionicons
                name="star"
                size={10}
                color="#d32f2f"
                style={{marginLeft: 2}}
              />
            </View>
          </View>

          <Text style={styles.carSubtitle}>{carData.variant}</Text>
          <Text style={styles.carInfo}>
            {carData.kmsDriven.toLocaleString()} km • {carData.owner} •{' '}
            {carData.fuelType}
          </Text>

          <View style={styles.bidSection}>
            <View>
              <Text style={styles.highestBid}>Highest Bid</Text>
              <Text style={styles.bidAmount}>
                ₹{carData.currentBid?.toLocaleString()}
              </Text>
            </View>
            <View style={styles.timerContainer}>
              <Text style={styles.timeRemaining}>Time Left:</Text>
              {carData.remainingTime
                .split(':')
                .map((value: string, idx: number) => (
                  <React.Fragment key={idx}>
                    <View style={styles.timerBox}>
                      <Text style={styles.timerText}>{value}</Text>
                    </View>
                    {idx < carData.remainingTime.split(':').length - 1 && (
                      <Text style={styles.timerSeparator}>:</Text>
                    )}
                  </React.Fragment>
                ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTab = (tabName: 'LIVE' | 'OCB', count: number) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity
        style={styles.tabContainer}
        onPress={() => setActiveTab(tabName)}
        activeOpacity={0.8}>
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {tabName}
        </Text>
        <Text
          style={[
            styles.tabCount,
            isActive ? styles.liveCount : styles.defaultCount,
          ]}>
          {count}
        </Text>
        {isActive && <View style={styles.activeTabIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appContainer}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.location}>
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color="#888"
              style={{marginRight: 2}}
            />
            <Text style={styles.rtoText}>RTO</Text>
            <Text style={styles.locationText}>MH</Text>
            <Ionicons name="chevron-down-outline" size={16} color="#000" />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#aaa" />
            <TextInput
              style={styles.searchInput}
              placeholder="Make, model, year, Appt. id"
              placeholderTextColor="#aaa"
            />
          </View>

          <TouchableOpacity style={styles.buyBasicButton}>
            <Text style={styles.buyBasicText}>Buy{'\n'}Basic</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007bff']}
              tintColor="#007bff"
            />
          }
          showsVerticalScrollIndicator={false}>
          {/* Flow Status Debug Button */}
          <TouchableOpacity
            style={styles.flowStatusButton}
            onPress={checkFlowStatus}>
            <Text style={styles.flowStatusText}>Check Flow Status</Text>
          </TouchableOpacity>

          {/* Connection Status */}
          <View style={styles.connectionStatus}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    connectionStatus === 'connected'
                      ? '#4CAF50'
                      : connectionStatus === 'connecting'
                      ? '#FF9800'
                      : '#F44336',
                },
              ]}
            />
            <Text style={styles.statusText}>
              {connectionStatus === 'connected' && '✅ WebSocket Connected'}
              {connectionStatus === 'connecting' && '🔄 Connecting...'}
              {connectionStatus === 'disconnected' && '❌ Disconnected'}
              {connectionStatus === 'error' && '❌ Connection Error'}
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              style={styles.retrySmallBtn}>
              <Text style={styles.retrySmallText}>Retry</Text>
            </TouchableOpacity>
          </View>

          {/* User Info */}
          {(userInfo || userId) && (
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>
                👤 {userInfo?.firstname || userInfo?.sub || userId}
                {userInfo?.dealerId ? ` • Dealer: ${userInfo.dealerId}` : ''}
              </Text>
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabs}>
            {renderTab('LIVE', liveCars?.length || 0)}
            {renderTab('OCB', 443)}
          </View>

          {/* Banner */}
          <View style={styles.banner}>
            <View>
              <Text style={styles.bannerTitle}>New launch</Text>
              <Text style={styles.bannerDesc}>
                Get used car loan for your customers{'\n'}Instant valuation |
                100% digital
              </Text>
              <TouchableOpacity style={styles.exploreBtn}>
                <Text style={styles.exploreText}>Explore →</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={require('../../assets/images/car2.png')}
              style={styles.bannerImage}
            />
          </View>

          {/* Live Cars Section */}
          <View style={styles.liveCarsHeaderContainer}>
            <Text style={styles.liveCarsHeader}>
              Live Cars {liveCars.length > 0 ? `(${liveCars.length})` : ''}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={20} color="#007bff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cars List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>
                {connectionStatus === 'connecting'
                  ? 'Connecting to server...'
                  : 'Loading live cars...'}
              </Text>
            </View>
          ) : liveCars.length > 0 ? (
            <View>
              {liveCars.map((car, index) => renderCarCard(car, index))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="car-off" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No live cars available</Text>
              <Text style={styles.emptySubtext}>
                {isConnected
                  ? 'No cars are currently being auctioned'
                  : 'Please check your connection and try again'}
              </Text>
              <TouchableOpacity
                onPress={handleRetry}
                style={styles.retryButton}>
                <Text style={styles.retryText}>
                  {isConnected ? 'Refresh' : 'Reconnect'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{height: 100}} />
        </ScrollView>
      </View>

      {/* Warning Fixed Container */}
      <View style={styles.warningFixedContainer}>
        <View style={styles.warningIconText}>
          <MaterialCommunityIcons
            name="wallet-outline"
            size={24}
            color="#fff"
            style={{marginRight: 8}}
          />
          <Text style={styles.warningText}>
            <Text style={{fontWeight: '700'}}>Low Account Balance</Text>
            {'\n'}
            Account balance is below Min. Balance Rs. 10000. Booking limit
            exceeded. Deposit Rs. 10000 to continue bidding.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Styles (keep all your existing styles exactly the same)
const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#fff'},
  appContainer: {flex: 1},
  scrollViewContent: {flex: 1},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingRight: 5,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  location: {flexDirection: 'row', alignItems: 'center'},
  rtoText: {fontSize: 14, color: '#888', marginRight: 2},
  locationText: {fontSize: 16, fontWeight: '700', marginHorizontal: 2},
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 10,
    alignItems: 'center',
    height: 36,
  },
  searchInput: {flex: 1, fontSize: 14, marginLeft: 5, paddingVertical: 0},
  buyBasicButton: {
    backgroundColor: '#7b3aed',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  buyBasicText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  retrySmallBtn: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  retrySmallText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  userInfo: {
    backgroundColor: '#e7f3ff',
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    marginTop: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  userInfoText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
    textAlign: 'center',
  },
  flowStatusButton: {
    backgroundColor: '#666',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
    margin: 10,
  },
  flowStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tabs: {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee'},
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabText: {fontSize: 14, fontWeight: '500', color: '#555'},
  activeTabText: {color: '#007bff', fontWeight: '600'},
  tabCount: {fontWeight: '500', marginLeft: 4},
  defaultCount: {color: '#555'},
  liveCount: {color: '#d32f2f', fontWeight: '700'},
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#007bff',
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#2f5c9e',
    borderRadius: 8,
    padding: 15,
    overflow: 'hidden',
  },
  bannerTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 5,
    fontSize: 12,
  },
  bannerDesc: {color: '#fff', fontSize: 13, marginBottom: 10, lineHeight: 18},
  exploreBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  exploreText: {color: '#2f5c9e', fontWeight: '600', fontSize: 14},
  bannerImage: {
    width: 100,
    height: 70,
    resizeMode: 'contain',
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  liveCarsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginTop: 5,
  },
  liveCarsHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshBtn: {
    padding: 5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  emptySubtext: {
    marginTop: 5,
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 10,
    marginTop: 5,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  carImage: {width: '100%', height: 200, resizeMode: 'cover'},
  heartIcon: {position: 'absolute', top: 10, right: 10, padding: 5},
  scrapBadge: {
    position: 'absolute',
    top: 15,
    left: 10,
    backgroundColor: '#d32f2f',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  scrapText: {color: '#fff', fontSize: 10, fontWeight: 'bold'},
  cardDetails: {padding: 10, paddingBottom: 0},
  locationRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 5},
  locationTextSmall: {fontSize: 12, color: '#555'},
  carHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  carTitle: {fontSize: 18, fontWeight: '700', color: '#000'},
  engineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    height: 25,
  },
  engineText: {fontSize: 12, fontWeight: '600', color: '#333'},
  carSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  carInfo: {fontSize: 12, color: '#555', marginBottom: 10},
  bidSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  highestBid: {fontSize: 13, fontWeight: '600', color: '#000'},
  bidAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
    marginTop: 4,
  },
  timerContainer: {flexDirection: 'row', alignItems: 'center'},
  timeRemaining: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timerBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d32f2f',
  },
  timerSeparator: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginHorizontal: 4,
  },
  warningFixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#d32f2f',
    paddingHorizontal: 15,
    paddingVertical: 10,
    zIndex: 10,
  },
  warningIconText: {flexDirection: 'row', alignItems: 'flex-start'},
  warningText: {flex: 1, color: '#fff', fontSize: 13, lineHeight: 18},
});

export default HomeScreen;
