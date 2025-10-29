// HomeScreen.tsx - UPDATED WITH DARK NAVY & SOFT LAVENDER + CLICKABLE DEMO NOTIFICATIONS + CLOSEABLE LOW BALANCE WARNING
import React, {useState, useEffect, useRef, useCallback} from 'react';
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
  Modal,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useWebSocket} from '../../utility/WebSocketConnection';
import {useRoute, RouteProp} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

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
  auctionStartTime?: string | number;
  auctionEndTime?: string | number;
  startTime?: string | number;
  endTime?: string | number;
  createdAt?: string | number;
  beadingCarId?: string;
  bidCarId?: string;
}

interface LivePriceData {
  price: number;
  remainingTime?: string;
  timeLeft?: string;
  auctionStartTime?: string;
  auctionEndTime?: string;
}

interface Notification {
  id: string;
  carId: string;
  message: string;
  type: 'bid' | 'outbid' | 'won' | 'time';
  timestamp: number;
}

type RootStackParamList = {
  Login: undefined;
  Home: {token: string; userId: string; userInfo: any};
  ForgotPassword: undefined;
};

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const AUCTION_DURATION_MS = 30 * 60 * 1000;

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'OCB'>('LIVE');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [biddingStates, setBiddingStates] = useState<{[key: string]: boolean}>({});
  const [livePrices, setLivePrices] = useState<{[key: string]: LivePriceData}>({});
  const [carImageData, setCarImageData] = useState<{[key: string]: string}>({});
  const [carDetailsData, setCarDetailsData] = useState<{[key: string]: any}>({});
  const [carAuctionTimes, setCarAuctionTimes] = useState<{
    [key: string]: {start: number; end: number};
  }>({});
  const [countdownTimers, setCountdownTimers] = useState<{
    [key: string]: string;
  }>({});
  const [filteredLiveCars, setFilteredLiveCars] = useState<Car[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCar, setSelectedCar] = useState<{
    bidCarId: string;
    price: number;
  } | null>(null);
  const [bidAmounts, setBidAmounts] = useState<{[bidCarId: string]: string}>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(true); // New state

  const bidInitializedRef = useRef<string | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const notificationAnim = useRef(new Animated.Value(-100)).current;
  const route = useRoute<HomeScreenRouteProp>();
  const routeParams = route.params;
  const {
    liveCars,
    getLiveCars,
    connectWebSocket,
    isConnected,
    connectionError,
    connectionStatus,
  } = useWebSocket();

  // Show notification (with animation)
  const showNotification = useCallback((car: Car, type: 'bid' | 'outbid' | 'won' | 'time') => {
    const carName = `${car.make || 'Toyota'} ${car.model || 'Innova'} ${car.variant || '2.8 ZX'}`;
    let message = '';
    let bgColor = '#262a4f';

    switch (type) {
      case 'bid':
        message = `You placed a bid on ${carName} at ₹${(livePrices[car.id]?.price || 0).toLocaleString()}`;
        bgColor = '#10B981';
        break;
      case 'outbid':
        message = `You've been outbid on ${carName}! New bid: ₹${((livePrices[car.id]?.price || 0) + 5000).toLocaleString()}`;
        bgColor = '#EF4444';
        break;
      case 'won':
        message = `Congratulations! You won ${carName} for ₹${(livePrices[car.id]?.price || 0).toLocaleString()}`;
        bgColor = '#8B5CF6';
        break;
      case 'time':
        message = `Only 5 minutes left for ${carName}!`;
        bgColor = '#F59E0B';
        break;
    }

    const newNotif: Notification = {
      id: `${car.id}-${Date.now()}`,
      carId: car.id,
      message,
      type,
      timestamp: Date.now(),
    };

    setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);

    // Animate in
    notificationAnim.setValue(-100);
    Animated.timing(notificationAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Auto hide after 4 seconds
    setTimeout(() => {
      Animated.timing(notificationAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      });
    }, 4000);
  }, [livePrices, notificationAnim]);

  // Click notification to show demo
  const handleNotificationClick = () => {
    if (filteredLiveCars.length === 0) {
      Alert.alert('No Cars', 'No live cars to show demo notifications.');
      return;
    }

    const randomCar = filteredLiveCars[Math.floor(Math.random() * filteredLiveCars.length)];
    const types: Array<'bid' | 'outbid' | 'won' | 'time'> = ['bid', 'outbid', 'time', 'won'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    // Only show "won" if auction is ending
    if (randomType === 'won' && !countdownTimers[randomCar.id]?.startsWith?.('00:00:')) {
      showNotification(randomCar, 'bid');
    } else if (randomType === 'time' && !countdownTimers[randomCar.id]?.startsWith?.('00:05:')) {
      showNotification(randomCar, 'bid');
    } else {
      showNotification(randomCar, randomType);
    }
  };

  const getCurrentDateTimeForAPI = useCallback((): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }, []);

  const parseDateTime = useCallback((dateTime: any): number | null => {
    if (!dateTime) return null;
    try {
      if (typeof dateTime === 'number') return dateTime;
      if (typeof dateTime === 'string') {
        const parsed = new Date(dateTime).getTime();
        if (!isNaN(parsed)) return parsed;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  const formatCountdown = useCallback((milliseconds: number): string => {
    if (milliseconds <= 0) return '00:00:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(seconds).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const now = Date.now();
    const newAuctionTimes: {[key: string]: {start: number; end: number}} = {
      ...carAuctionTimes,
    };
    let hasNewCars = false;
    liveCars.forEach(car => {
      if (car.id && !carAuctionTimes[car.id]) {
        let startTime =
          parseDateTime(car.auctionStartTime) ||
          parseDateTime(car.startTime) ||
          parseDateTime(car.createdAt) ||
          now;
        let endTime =
          parseDateTime(car.auctionEndTime) ||
          parseDateTime(car.endTime) ||
          startTime + AUCTION_DURATION_MS;
        newAuctionTimes[car.id] = {start: startTime, end: endTime};
        hasNewCars = true;
      }
    });
    if (hasNewCars) setCarAuctionTimes(newAuctionTimes);
  }, [liveCars, carAuctionTimes, parseDateTime]);

  useEffect(() => {
    if (Object.keys(carAuctionTimes).length === 0) return;
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      const now = Date.now();
      const newTimers: {[key: string]: string} = {};
      const activeCars: Car[] = [];
      const expiredCarIds: string[] = [];
      liveCars.forEach(car => {
        if (!car.id) return;
        const auctionTime = carAuctionTimes[car.id];
        if (!auctionTime) return;
        const remainingMs = auctionTime.end - now;
        if (remainingMs > 0) {
          newTimers[car.id] = formatCountdown(remainingMs);
          activeCars.push(car);
        } else {
          expiredCarIds.push(car.id);
        }
      });
      setCountdownTimers(newTimers);
      setFilteredLiveCars(activeCars);
      if (expiredCarIds.length > 0) {
        setCarAuctionTimes(prev => {
          const updated = {...prev};
          expiredCarIds.forEach(id => delete updated[id]);
          return updated;
        });
      }
    }, 1000);
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [liveCars, carAuctionTimes, formatCountdown]);

  useEffect(() => {
    loadStoredAuthData();
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  const loadStoredAuthData = async () => {
    try {
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_ID_KEY),
      ]);
      if (token) setStoredToken(token);
      if (userId) setStoredUserId(userId);
    } catch (error) {}
  };

  const token = routeParams?.token || storedToken;
  const userId = routeParams?.userId || storedUserId;
  const userInfo = routeParams?.userInfo;

  useEffect(() => {
    if (token && connectionStatus === 'disconnected') connectWebSocket(token);
    if (
      isConnected &&
      connectionStatus === 'connected' &&
      liveCars.length === 0
    ) {
      setTimeout(getLiveCars, 1000);
    }
  }, [token, connectionStatus, isConnected, liveCars.length]);

  useEffect(() => {
    if (connectionStatus === 'connected' || connectionStatus === 'error') {
      setIsLoading(false);
    } else if (connectionStatus === 'connecting') {
      setIsLoading(true);
    }
  }, [connectionStatus]);

  useEffect(() => {
    if (filteredLiveCars.length > 0) {
      const interval = setInterval(() => {
        filteredLiveCars.forEach(car => {
          if (car.id) fetchLivePrice(car.id);
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [filteredLiveCars]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (isConnected) getLiveCars();
      else if (token) connectWebSocket(token);
    } catch (error) {
    } finally {
      setTimeout(() => setRefreshing(false), 2000);
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    if (token) connectWebSocket(token);
    else Alert.alert('Authentication Required', 'Please login again.');
  };

  const fetchLivePrice = async (
    bidCarId: string,
  ): Promise<LivePriceData | null> => {
    try {
      const livePriceUrl = `https://caryanamindia.prodchunca.in.net/Bid/getliveValue?bidCarId=${bidCarId}`;
      const response = await fetch(livePriceUrl);
      const data = await response.json();
      const price = data?.object?.price ?? 0;
      const livePriceData = {
        price,
        remainingTime: data?.object?.remainingTime || '',
        timeLeft: data?.object?.timeLeft || '',
        auctionArtifactStartTime:
          data?.object?.auctionStartTime || data?.object?.startTime,
        auctionEndTime: data?.object?.auctionEndTime || data?.object?.endTime,
      };
      setLivePrices(prev => ({...prev, [bidCarId]: livePriceData}));
      return livePriceData;
    } catch (error) {
      return null;
    }
  };

  const refreshAllCarPrices = async () => {
    const promises = filteredLiveCars.map(car => {
      if (car.id) return fetchLivePrice(car.id);
      return Promise.resolve(null);
    });
    await Promise.all(promises);
  };

  const fetchCarImageAndDetails = async (
    beadingCarId: string,
    bidCarId: string,
  ) => {
    try {
      const imageUrl = `https://caryanamindia.prodchunca.in.net/uploadFileBidCar/getByBidCarID?beadingCarId=${beadingCarId}`;
      const imageResponse = await fetch(imageUrl);
      const imageText = await imageResponse.text();
      let imageDataArray: any[] = [];
      try {
        const parsed = JSON.parse(imageText);
        if (Array.isArray(parsed)) {
          imageDataArray = parsed;
        } else if (Array.isArray(parsed?.object)) {
          imageDataArray = parsed.object;
        } else if (Array.isArray(parsed?.data)) {
          imageDataArray = parsed.data;
        }
      } catch (err) {}
      const coverImageData = imageDataArray.find(
        item =>
          (item.documentType?.toLowerCase() === 'coverimage' ||
            item.doctype?.toLowerCase() === 'coverimage' ||
            item.subtype?.toLowerCase() === 'coverimage') &&
          String(item.beadingCarId) === String(beadingCarId),
      );
      const carIdUrl = `https://caryanamindia.prodchunca.in.net/BeadingCarController/getByBidCarId/${bidCarId}`;
      const carIdResponse = await fetch(carIdUrl);
      const carIdText = await carIdResponse.text();
      let carIdData: any = null;
      try {
        carIdData = carIdText ? JSON.parse(carIdText) : null;
      } catch (e) {}
      const imageLink = coverImageData?.documentLink;
      if (imageLink) {
        setCarImageData(prev => ({...prev, [beadingCarId]: imageLink}));
      }
      if (carIdData) {
        setCarDetailsData(prev => ({...prev, [bidCarId]: carIdData || {}}));
      }
      fetchLivePrice(bidCarId);
    } catch (error: any) {}
  };

  useEffect(() => {
    filteredLiveCars.forEach(car => {
      const beadingId = car.beadingCarId || car.id;
      const bidId = car.bidCarId || car.id;
      const hasImage = !!(carImageData[bidId] || carImageData[beadingId]);
      const hasDetails = !!carDetailsData[bidId];
      if (!hasImage || !hasDetails) {
        fetchCarImageAndDetails(beadingId, bidId);
      }
    });
  }, [filteredLiveCars, carImageData, carDetailsData]);

  const openBidModal = async (bidCarId: string) => {
    try {
      const priceData = await fetchLivePrice(bidCarId);
      const currentPrice = priceData?.price ?? 0;
      bidInitializedRef.current = null;
      setSelectedCar({bidCarId, price: currentPrice});
      const initialBid = (currentPrice + 2000).toString();
      setBidAmounts(prev => ({...prev, [bidCarId]: initialBid}));
      bidInitializedRef.current = bidCarId;
      setModalVisible(true);
    } catch (error) {}
  };

  useEffect(() => {
    if (modalVisible && selectedCar) {
      const livePriceData = livePrices[selectedCar.bidCarId];
      const currentPrice = livePriceData?.price ?? 0;
      if (currentPrice > 0 && selectedCar.price !== currentPrice) {
        setSelectedCar(prev => (prev ? {...prev, price: currentPrice} : null));
      }
    }
  }, [modalVisible, livePrices[selectedCar?.bidCarId || '']?.price]);

  useEffect(() => {
    if (!modalVisible) bidInitializedRef.current = null;
  }, [modalVisible]);

  const handleBidInputChange = (text: string) => {
    if (selectedCar) {
      setBidAmounts(prev => ({...prev, [selectedCar.bidCarId]: text}));
    }
  };

  const handleDecreaseBid = () => {
    if (selectedCar) {
      const livePriceData = livePrices[selectedCar.bidCarId];
      const currentPrice = livePriceData?.price ?? selectedCar.price ?? 0;
      const current =
        parseInt(bidAmounts[selectedCar.bidCarId] || '0') || currentPrice;
      if (current - 2000 > currentPrice) {
        setBidAmounts(prev => ({
          ...prev,
          [selectedCar.bidCarId]: (current - 2000).toString(),
        }));
      }
    }
  };

  const handleIncreaseBid = () => {
    if (selectedCar) {
      const livePriceData = livePrices[selectedCar.bidCarId];
      const currentPrice = livePriceData?.price ?? selectedCar.price ?? 0;
      const current =
        parseInt(bidAmounts[selectedCar.bidCarId] || '0') || currentPrice;
      setBidAmounts(prev => ({
        ...prev,
        [selectedCar.bidCarId]: (current + 2000).toString(),
      }));
    }
  };

  const handlePlaceBid = async () => {
    if (!token || !userId || !selectedCar) {
      Alert.alert('Error', 'Please login to place a bid.');
      return;
    }
    const livePriceData = livePrices[selectedCar.bidCarId];
    const currentPrice = livePriceData?.price ?? selectedCar.price ?? 0;
    const bidValue = parseInt(bidAmounts[selectedCar.bidCarId] || '0');
    if (isNaN(bidValue) || bidValue <= currentPrice) {
      Alert.alert(
        'Invalid Bid',
        `Bid amount (₹${bidValue}) must be greater than current bid (₹${currentPrice}).`,
      );
      return;
    }
    setBiddingStates(prev => ({...prev, [selectedCar.bidCarId]: true}));
    try {
      const currentDateTime = getCurrentDateTimeForAPI();
      const requestBody = {
        userId: Number(userId),
        bidCarId: Number(selectedCar.bidCarId),
        dateTime: currentDateTime,
        amount: bidValue,
      };
      if (!token || token.trim() === '')
        throw new Error('Invalid authentication token');
      const bidUrl = `https://caryanamindia.prodchunca.in.net/Bid/placeBid?bidCarId=${selectedCar.bidCarId}`;
      const response = await fetch(bidUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      let data = null;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {}
      if (response.ok) {
        setModalVisible(false);
        Alert.alert(
          'Bid Placed Successfully!',
          `Your bid of ₹${bidValue.toLocaleString()} has been placed.`,
          [
            {
              text: 'OK',
              onPress: async () => {
                await refreshAllCarPrices();
                getLiveCars();
                const car = filteredLiveCars.find(c => c.id === selectedCar.bidCarId);
                if (car) showNotification(car, 'bid');
              },
            },
          ],
        );
      } else {
        let errorMessage = 'Server Error';
        let debugInfo = 'Unable to place bid. Please try again.';
        Alert.alert(errorMessage, debugInfo, [
          {
            text: 'Refresh & Retry',
            onPress: async () => {
              await refreshAllCarPrices();
              getLiveCars();
            },
          },
          {text: 'Close', style: 'cancel'},
        ]);
      }
    } catch (error: any) {
      Alert.alert('Network Error', 'Unable to connect to server.', [
        {text: 'Retry', onPress: () => handlePlaceBid()},
        {text: 'Close', style: 'cancel'},
      ]);
    } finally {
      setBiddingStates(prev => ({...prev, [selectedCar.bidCarId]: false}));
    }
  };

  const renderCarCard = (car: Car, idx: number) => {
    const carId = car.id || `car-${idx}`;
    const beadingId = car.beadingCarId || carId;
    const bidId = car.bidCarId || carId;
    const imageUrl =
      carImageData[carId] ||
      carImageData[beadingId] ||
      carImageData[bidId] ||
      car.imageUrl ||
      'https://photos.caryanamindia.com/1453c850-c6a4-4d46-ab36-6c4dbab27f4c-crysta%201%20-%20Copy.jpg';
    const carDetails = carDetailsData[carId] || carDetailsData[bidId];
    const livePriceData = livePrices[carId];
    const currentBid =
      livePriceData?.price ?? car.currentBid ?? carDetails?.price ?? 0;
    const timeLeft = countdownTimers[carId] || '00:30:00';
    const isBidding = biddingStates[carId] || false;

    return (
      <View key={carId} style={styles.card}>
        <Image source={{uri: imageUrl}} style={styles.carImage} />
        <TouchableOpacity style={styles.heartIcon}>
          <Ionicons name="heart-outline" size={24} color="#fff" />
        </TouchableOpacity>
        {car.isScrap && (
          <View style={styles.scrapBadge}>
            <Text style={styles.scrapText}>SCRAP CAR</Text>
          </View>
        )}

        <View style={styles.cardDetails}>
          {carDetails && (
            <Text style={styles.carName}>
              {carDetails.brand} {carDetails.model} (
              {carDetails.variant?.trim()})
            </Text>
          )}
          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color="#a9acd6"
            />
            <Text style={styles.locationTextSmall}>
              {carDetails?.city || car.city} •{' '}
              {carDetails?.registration || car.rtoCode}
            </Text>
          </View>
          <Text style={styles.carInfo}>
            {carDetails?.kmDriven?.toLocaleString() || car.kmsDriven} km •{' '}
            {carDetails?.ownerSerial || car.owner} Owner •{' '}
            {carDetails?.fuelType || car.fuelType}
          </Text>

          <View style={styles.bidSection}>
            <View>
              <Text style={styles.highestBid}>
                {livePriceData ? 'Live Bid [Red Dot]' : 'Highest Bid'}
              </Text>
              <Text style={styles.bidAmount}>
                ₹{currentBid.toLocaleString()}
              </Text>
            </View>
            <View style={styles.timerContainer}>
              <Text style={styles.timeRemaining}>[Clock] Time Left</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>{timeLeft}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => openBidModal(carId)}
            disabled={isBidding}
            activeOpacity={0.8}>
            <View
              style={[
                styles.placeBidButton,
                isBidding && styles.placeBidButtonDisabled,
              ]}>
              {isBidding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.placeBidText}>Place Bid</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTab = (tab: 'LIVE' | 'OCB', count: number) => {
    const active = activeTab === tab;
    return (
      <TouchableOpacity
        style={styles.tabContainer}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.8}>
        <Text style={[styles.tabText, active && styles.activeTabText]}>
          {tab}
        </Text>
        <View
          style={[styles.tabCountBadge, active && styles.activeTabCountBadge]}>
          <Text style={[styles.tabCount, active && styles.activeTabCountText]}>
            {count}
          </Text>
        </View>
        {active && <View style={styles.activeTabIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#262a4f" />
      <LinearGradient
        colors={['#262a4f', '#353a65', '#262a4f']}
        style={styles.gradientBackground}>

        {/* Clickable Notification Banner */}
        {notifications.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleNotificationClick}
            style={[
              styles.notificationBanner,
              {
                backgroundColor: notifications[0].type === 'bid' ? '#10B981' :
                                 notifications[0].type === 'outbid' ? '#EF4444' :
                                 notifications[0].type === 'won' ? '#8B5CF6' : '#F59E0B',
                transform: [{ translateY: notificationAnim }],
              },
            ]}>
            <MaterialCommunityIcons
              name={
                notifications[0].type === 'bid' ? 'check-circle' :
                notifications[0].type === 'outbid' ? 'alert' :
                notifications[0].type === 'won' ? 'trophy' : 'clock-alert'
              }
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.notificationText}>{notifications[0].message}</Text>
            <Ionicons name="chevron-down" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.profileSection}>
              <Image
                source={{
                  uri: userInfo?.profileImage || 'https://i.pravatar.cc/100',
                }}
                style={styles.profileImage}
              />
              <View>
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={14} color="#a9acd6" />
                  <Text style={styles.locationLabel}>London, Nigeria</Text>
                  <Ionicons name="chevron-down" size={14} color="#a9acd6" />
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationIcon} onPress={handleNotificationClick}>
              <Ionicons
                name="notifications-outline"
                size={26}
                color="#a9acd6"
              />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#262a4f" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search auction"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>
        <View style={styles.whiteContentArea}>
          <ScrollView
            style={styles.scrollViewContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#a9acd6']}
              />
            }
            showsVerticalScrollIndicator={false}>
            <View style={styles.tabs}>
              {renderTab('LIVE', filteredLiveCars.length)}
              {renderTab('OCB', 0)}
            </View>
            <View style={styles.banner}>
              <View style={{flex: 1}}>
                <View style={styles.newLaunchBadge}>
                  <Text style={styles.bannerTitle}>New launch</Text>
                </View>
                <Text style={styles.bannerDesc}>
                  Get used car loan for your customers{'\n'}Instant valuation |
                  100% digital
                </Text>
                <TouchableOpacity activeOpacity={0.8}>
                  <View style={styles.exploreBtn}>
                    <Text style={styles.exploreText}>Explore</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <Image
                source={require('../../assets/images/car3.png')}
                style={styles.bannerImage}
              />
            </View>
            <View style={styles.liveCarsHeaderContainer}>
              <View>
                <Text style={styles.liveCarsHeader}>Live Cars</Text>
                {filteredLiveCars.length > 0 && (
                  <Text style={styles.liveCarsSubtext}>
                    {filteredLiveCars.length} cars available
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
                <View style={styles.refreshGradient}>
                  <Ionicons name="refresh" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#a9acd6" />
                <Text style={styles.loadingText}>Loading cars...</Text>
              </View>
            ) : filteredLiveCars.length > 0 ? (
              filteredLiveCars.map(renderCarCard)
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="car-off"
                  size={60}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyText}>No live cars available</Text>
                <TouchableOpacity onPress={handleRetry} activeOpacity={0.8}>
                  <View style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            <View style={{height: 100}} />
          </ScrollView>
        </View>
      </LinearGradient>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Place Your Bid</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Your Bid Amount</Text>
              <View style={styles.bidInputContainer}>
                <TouchableOpacity onPress={handleDecreaseBid}>
                  <View style={styles.adjustButtonMinus}>
                    <Text style={styles.adjustButtonText}>-</Text>
                  </View>
                </TouchableOpacity>
                <TextInput
                  style={styles.bidInput}
                  value={selectedCar ? bidAmounts[selectedCar.bidCarId] : ''}
                  onChangeText={handleBidInputChange}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                />
                <TouchableOpacity onPress={handleIncreaseBid}>
                  <View style={styles.adjustButtonPlus}>
                    <Text style={styles.adjustButtonText}>+</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePlaceBid}
                disabled={biddingStates[selectedCar?.bidCarId || '']}>
                <View style={styles.confirmButton}>
                  {biddingStates[selectedCar?.bidCarId || ''] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>CONFIRM BID</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Low Balance Warning with Close Button */}
      {showLowBalanceWarning && (
        <View style={styles.warningFixedContainer}>
          <View style={styles.warningIconText}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={26}
              color="#fff"
              style={{marginRight: 10}}
            />
            <View style={{flex: 1}}>
              <Text style={styles.warningTitle}>Low Account Balance</Text>
              <Text style={styles.warningText}>
                Account balance below ₹10,000. Deposit to continue bidding.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setShowLowBalanceWarning(false)}
            style={styles.closeWarningButton}
            activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#262a4f'},
  gradientBackground: {flex: 1},
  header: {paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20},
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileSection: {flexDirection: 'row', alignItems: 'center', gap: 12},
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#a9acd6',
  },
  locationRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  locationLabel: {color: '#a9acd6', fontSize: 13, fontWeight: '600'},
  notificationIcon: {position: 'relative'},
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#262a4f',
  },
  searchContainer: {flexDirection: 'row', gap: 12, width: 320, height: 60},
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {flex: 1, color: '#1F2937', fontSize: 15, fontWeight: '500'},
  whiteContentArea: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  scrollViewContent: {flex: 1},
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
    gap: 40,
  },
  tabContainer: {alignItems: 'center'},
  tabText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  activeTabText: {color: '#262a4f'},
  tabCountBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  activeTabCountBadge: {backgroundColor: '#e6e8f3'},
  tabCount: {fontSize: 13, fontWeight: '800', color: '#6B7280'},
  activeTabCountText: {color: '#262a4f'},
  activeTabIndicator: {
    height: 4,
    marginTop: 8,
    width: 50,
    borderRadius: 2,
    backgroundColor: '#a9acd6',
  },
  banner: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6e8f3',
    shadowColor: '#262a4f',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  newLaunchBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#262a4f',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#a9acd6',
    letterSpacing: 0.5,
  },
  bannerDesc: {
    fontSize: 13,
    color: '#4B5563',
    marginVertical: 8,
    lineHeight: 18,
    fontWeight: '500',
  },
  exploreBtn: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#a9acd6',
    shadowColor: '#a9acd6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreText: {color: '#262a4f', fontSize: 14, fontWeight: '700'},
  bannerImage: {width: 110, height: 100, resizeMode: 'contain', marginLeft: 10},
  liveCarsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  liveCarsHeader: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  liveCarsSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  refreshGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a9acd6',
    shadowColor: '#a9acd6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  carImage: {width: '100%', height: 200, resizeMode: 'cover'},
  heartIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 24,
  },
  scrapBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  scrapText: {color: '#fff', fontWeight: '800', fontSize: 11},
  cardDetails: {padding: 18},
  carName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  locationTextSmall: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '600',
  },
  carInfo: {fontSize: 13, color: '#9CA3AF', marginTop: 6, fontWeight: '500'},
  bidSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  highestBid: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
    fontWeight: '600',
  },
  bidAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#262a4f',
    letterSpacing: -0.5,
  },
  timerContainer: {alignItems: 'flex-end'},
  timeRemaining: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
    fontWeight: '600',
  },
  timerBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#262a4f',
    shadowColor: '#262a4f',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerText: {
    color: '#a9acd6',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  placeBidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    backgroundColor: '#a9acd6',
    shadowColor: '#a9acd6',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  placeBidButtonDisabled: {backgroundColor: '#d4d6e9'},
  placeBidText: {
    color: '#262a4f',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  loadingContainer: {alignItems: 'center', marginTop: 80},
  loadingText: {
    marginTop: 16,
    color: '#a9acd6',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {alignItems: 'center', marginTop: 80},
  emptyText: {fontSize: 20, fontWeight: '800', color: '#6B7280', marginTop: 16},
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    backgroundColor: '#a9acd6',
    shadowColor: '#a9acd6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryText: {color: '#262a4f', fontWeight: '800', fontSize: 15},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 42, 79, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 28,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 20},
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHeader: {padding: 24, alignItems: 'center', backgroundColor: '#262a4f'},
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#a9acd6',
    letterSpacing: -0.5,
  },
  amountContainer: {padding: 24, paddingTop: 16},
  amountLabel: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '600',
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e6e8f3',
    borderRadius: 16,
    overflow: 'hidden',
  },
  adjustButtonMinus: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444',
  },
  adjustButtonPlus: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#a9acd6',
  },
  adjustButtonText: {color: '#fff', fontSize: 28, fontWeight: '700'},
  bidInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1F2937',
  },
  modalActions: {flexDirection: 'row', padding: 24, paddingTop: 0, gap: 12},
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e6e8f3',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#262a4f',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#a9acd6',
    shadowColor: '#a9acd6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#262a4f',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  warningFixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -8},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  warningIconText: {flexDirection: 'row', alignItems: 'center', flex: 1},
  warningTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  warningText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.95,
  },
  closeWarningButton: {
    marginLeft: 12,
    padding: 4,
  },

  // Clickable Notification Banner
  notificationBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
});

export default HomeScreen;