// HomeScreen.tsx - FINAL OPTIMIZED VERSION (Bid Loading Fixed)
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
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useWebSocket} from '../../utility/WebSocketConnection';
import {useRoute, RouteProp} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {useWishlist} from '../../context/WishlistContext';
import Geolocation from '@react-native-community/geolocation';

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
const DEFAULT_LOCATION = 'Mumbai, India';

const HomeScreen: React.FC = () => {
  const {wishlist, toggleWishlist, isWishlisted} = useWishlist();
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
  const [carDetailsModalVisible, setCarDetailsModalVisible] = useState(false);
  const [selectedCarForDetails, setSelectedCarForDetails] = useState<Car | null>(null);
  const [selectedCar, setSelectedCar] = useState<{
    bidCarId: string;
    price: number;
  } | null>(null);
  const [bidAmounts, setBidAmounts] = useState<{[bidCarId: string]: string}>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<string>(DEFAULT_LOCATION);
  const [locationLoading, setLocationLoading] = useState(true);

  // NEW: Cache price when opening bid modal
  const [bidModalPriceCache, setBidModalPriceCache] = useState<{[bidCarId: string]: number}>({});

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

  // === LOCATION LOGIC ===
  const getCurrentLocation = useCallback(async () => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs location access to show your current city.',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    };

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      setCurrentLocation(DEFAULT_LOCATION);
      setLocationLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Mumbai';
          const country = data.address?.country || 'India';
          setCurrentLocation(`${city}, ${country}`);
        } catch (error) {
          setCurrentLocation(DEFAULT_LOCATION);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setCurrentLocation(DEFAULT_LOCATION);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // === NOTIFICATION SYSTEM ===
  const showNotification = useCallback((car: Car, type: 'bid' | 'outbid' | 'won' | 'time') => {
    const carName = `${car.make || 'Toyota'} ${car.model || 'Innova'} ${car.variant || '2.8 ZX'}`;
    let message = '';
    switch (type) {
      case 'bid':
        message = `You placed a bid on ${carName} at ₹${(livePrices[car.id]?.price || 0).toLocaleString()}`;
        break;
      case 'outbid':
        message = `You've been outbid on ${carName}! New bid: ₹${((livePrices[car.id]?.price || 0) + 5000).toLocaleString()}`;
        break;
      case 'won':
        message = `Congratulations! You won ${carName} for ₹${(livePrices[car.id]?.price || 0).toLocaleString()}`;
        break;
      case 'time':
        message = `Only 5 minutes left for ${carName}!`;
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
    notificationAnim.setValue(-100);
    Animated.timing(notificationAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
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

  const handleNotificationClick = () => {
    if (filteredLiveCars.length === 0) {
      Alert.alert('No Cars', 'No live cars to show demo notifications.');
      return;
    }
    const randomCar = filteredLiveCars[Math.floor(Math.random() * filteredLiveCars.length)];
    const types: Array<'bid' | 'outbid' | 'won' | 'time'> = ['bid', 'outbid', 'time', 'won'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    showNotification(randomCar, randomType);
  };

  // === HELPER FUNCTIONS ===
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

  // === AUCTION TIME LOGIC ===
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

  // === AUTH & WEBSOCKET ===
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

  // === PRICE POLLING ===
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

  // === API CALLS ===
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
        auctionStartTime:
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

  // === MODAL HANDLERS ===
  const openCarDetailsModal = async (car: Car) => {
    setSelectedCarForDetails(car);
    setCarDetailsModalVisible(true);
  };

  // FIXED: Only one fetch, cache price
  const openBidModal = async (bidCarId: string) => {
    try {
      const priceData = await fetchLivePrice(bidCarId);
      const currentPrice = priceData?.price ?? 0;

      setBidModalPriceCache(prev => ({ ...prev, [bidCarId]: currentPrice }));
      setSelectedCar({ bidCarId, price: currentPrice });
      const initialBid = (currentPrice + 2000).toString();
      setBidAmounts(prev => ({ ...prev, [bidCarId]: initialBid }));
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Could not load current price. Try again.');
    }
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
    if (!modalVisible) {
      bidInitializedRef.current = null;
      // Optional: clear cache on close
      if (selectedCar) {
        setBidModalPriceCache(prev => {
          const updated = { ...prev };
          delete updated[selectedCar.bidCarId];
          return updated;
        });
      }
    }
  }, [modalVisible]);

  const handleBidInputChange = (text: string) => {
    if (selectedCar) {
      setBidAmounts(prev => ({...prev, [selectedCar.bidCarId]: text}));
    }
  };

  const handleDecreaseBid = () => {
    if (selectedCar) {
      const cachedPrice = bidModalPriceCache[selectedCar.bidCarId] ?? selectedCar.price ?? 0;
      const current = parseInt(bidAmounts[selectedCar.bidCarId] || '0') || cachedPrice + 2000;
      if (current - 2000 > cachedPrice) {
        setBidAmounts(prev => ({
          ...prev,
          [selectedCar.bidCarId]: (current - 2000).toString(),
        }));
      }
    }
  };

  const handleIncreaseBid = () => {
    if (selectedCar) {
      const current = parseInt(bidAmounts[selectedCar.bidCarId] || '0') || (selectedCar.price + 2000);
      setBidAmounts(prev => ({
        ...prev,
        [selectedCar.bidCarId]: (current + 2000).toString(),
      }));
    }
  };

  // FIXED: Use cached price, no extra fetch
  const handlePlaceBid = async () => {
    if (!token || !userId || !selectedCar) {
      Alert.alert('Error', 'Please login to place a bid.');
      return;
    }

    const cachedPrice = bidModalPriceCache[selectedCar.bidCarId] ?? 0;
    const bidValue = parseInt(bidAmounts[selectedCar.bidCarId] || '0');

    if (isNaN(bidValue) || bidValue <= cachedPrice) {
      Alert.alert(
        'Invalid Bid',
        `Bid amount (₹${bidValue}) must be greater than current bid (₹${cachedPrice}).`,
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

  // === RENDER FUNCTIONS ===
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
    const wishlisted = isWishlisted(carId);

    return (
      <TouchableOpacity
        key={carId}
        style={styles.card}
        activeOpacity={0.95}
        onPress={() => openCarDetailsModal(car)}>
        <Image source={{uri: imageUrl}} style={styles.carImage} />
        <TouchableOpacity
          style={styles.heartIcon}
          onPress={(e) => {
            e.stopPropagation();
            toggleWishlist(carId);
          }}>
          <Ionicons
            name={wishlisted ? "heart" : "heart-outline"}
            size={24}
            color={wishlisted ? "#e74c3c" : "#fff"}
          />
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
            onPress={(e) => {
              e.stopPropagation();
              openCarDetailsModal(car);
            }}
            activeOpacity={0.8}>
            <View style={styles.viewButton}>
              <Text style={styles.viewButtonText}>VIEW</Text>
              <Ionicons name="eye" size={16} color="#fff" style={{marginLeft: 6}} />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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

  const renderCarDetailsModal = () => {
    if (!selectedCarForDetails) return null;
    const carId = selectedCarForDetails.id;
    const beadingId = selectedCarForDetails.beadingCarId || carId;
    const bidId = selectedCarForDetails.bidCarId || carId;
    const imageUrl =
      carImageData[carId] ||
      carImageData[beadingId] ||
      carImageData[bidId] ||
      selectedCarForDetails.imageUrl ||
      'https://photos.caryanamindia.com/1453c850-c6a4-4d46-ab36-6c4dbab27f4c-crysta%201%20-%20Copy.jpg';
   
    const carDetails = carDetailsData[carId] || carDetailsData[bidId];
    const livePriceData = livePrices[carId];
    const currentBid = livePriceData?.price ?? selectedCarForDetails.currentBid ?? carDetails?.price ?? 5874000;
    const timeLeft = countdownTimers[carId] || '23:24:00';

    const brand = carDetails?.brand || selectedCarForDetails.make || '2021';
    const model = carDetails?.model || selectedCarForDetails.model || 'FORCE ONE';
    const variant = carDetails?.variant || selectedCarForDetails.variant || 'BLUE & AUTOMATIC';
    const kmDriven = carDetails?.kmDriven || selectedCarForDetails.kmsDriven || 50000;
    const ownerSerial = carDetails?.ownerSerial || selectedCarForDetails.owner || '2ND OWNER';
    const fuelType = carDetails?.fuelType || selectedCarForDetails.fuelType || 'DIESEL';
    const registration = carDetails?.registration || selectedCarForDetails.rtoCode || 'MH-12';
    const city = carDetails?.city || selectedCarForDetails.city || 'Kharadi, Kharadi';
    const transmission = carDetails?.transmission || 'Automatic';
    const makeYear = carDetails?.makeYear || carDetails?.year || '2021';
    const insuranceType = carDetails?.insuranceType || 'Third Party';

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={carDetailsModalVisible}
        onRequestClose={() => setCarDetailsModalVisible(false)}>
        <SafeAreaView style={styles.detailsModalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
         
          <View style={styles.detailsHeader}>
            <TouchableOpacity
              onPress={() => setCarDetailsModalVisible(false)}
              style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#262a4f" />
            </TouchableOpacity>
            <Text style={styles.detailsHeaderTitle}>Car Details</Text>
            <TouchableOpacity
              onPress={() => toggleWishlist(carId)}
              style={styles.headerHeartIcon}>
              <Ionicons
                name={isWishlisted(carId) ? "heart" : "heart-outline"}
                size={24}
                color={isWishlisted(carId) ? "#e74c3c" : "#262a4f"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailsScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.detailsImageContainer}>
              <Image source={{uri: imageUrl}} style={styles.detailsCarImage} />
              {selectedCarForDetails.isScrap && (
                <View style={styles.detailsScrapBadge}>
                  <Text style={styles.scrapText}>SCRAP CAR</Text>
                </View>
              )}
            </View>
            <View style={styles.detailsTitleSection}>
              <Text style={styles.detailsCarTitle}>{makeYear} {model.toUpperCase()}</Text>
              <Text style={styles.detailsCarSubtitle}>{variant}</Text>
              <View style={styles.quickInfoBadges}>
                <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>{kmDriven.toLocaleString()} KM</Text></View>
                <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>{ownerSerial}</Text></View>
                <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>{fuelType}</Text></View>
                <View style={styles.infoBadge}><Text style={styles.infoBadgeText}>{registration}</Text></View>
              </View>
              <View style={styles.locationTestDriveRow}>
                <View style={styles.locationInfoBox}>
                  <MaterialCommunityIcons name="map-marker" size={18} color="#10B981" />
                  <Text style={styles.locationInfoText}>Parked at: {city}</Text>
                </View>
              </View>
              <View style={styles.testDriveAvailable}>
                <Ionicons name="home" size={18} color="#10B981" />
                <Text style={styles.testDriveText}>Home Test Drive Available</Text>
              </View>
              <TouchableOpacity style={styles.inspectionReportButton}>
                <MaterialCommunityIcons name="file-document-outline" size={20} color="#a9acd6" />
                <Text style={styles.inspectionReportText}>View Inspection Report</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.priceTimerSection}>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Amount: ₹{currentBid.toLocaleString()}</Text>
                <Text style={styles.priceSubLabel}>FIXED ROAD PRICE</Text>
                <Text style={styles.timerLabelBig}>{timeLeft}</Text>
              </View>
            </View>
            <View style={styles.knowYourCarSection}>
              <Text style={styles.sectionTitle}>Know your Car</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconCircle}><MaterialCommunityIcons name="card-account-details" size={24} color="#10B981" /></View>
                  <Text style={styles.detailLabel}>Reg Number</Text>
                  <Text style={styles.detailValue}>{registration}</Text>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconCircle}><MaterialCommunityIcons name="calendar" size={24} color="#10B981" /></View>
                  <Text style={styles.detailLabel}>Make Year</Text>
                  <Text style={styles.detailValue}>{makeYear}</Text>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconCircle}><MaterialCommunityIcons name="gas-station" size={24} color="#10B981" /></View>
                  <Text style={styles.detailLabel}>Fuel Type</Text>
                  <Text style={styles.detailValue}>{fuelType}</Text>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconCircle}><MaterialCommunityIcons name="cog" size={24} color="#10B981" /></View>
                  <Text style={styles.detailLabel}>Transmission</Text>
                  <Text style={styles.detailValue}>{transmission}</Text>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconCircle}><MaterialCommunityIcons name="car" size={24} color="#10B981" /></View>
                  <Text style={styles.detailLabel}>KM Driven</Text>
                  <Text style={styles.detailValue}>{kmDriven.toLocaleString()}</Text>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconCircle}><MaterialCommunityIcons name="account" size={24} color="#10B981" /></View>
                  <Text style={styles.detailLabel}>Ownership</Text>
                  <Text style={styles.detailValue}>{ownerSerial === '2ND OWNER' ? '2' : ownerSerial}</Text>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconCircle}><MaterialCommunityIcons name="shield-check" size={24} color="#10B981" /></View>
                  <Text style={styles.detailLabel}>Insurance Type</Text>
                  <Text style={styles.detailValue}>{insuranceType}</Text>
                </View>
              </View>
            </View>
            <View style={styles.topFeaturesSection}>
              <Text style={styles.sectionTitle}>Top Features</Text>
              <View style={styles.featuresGrid}>
                <View style={styles.featureItem}><MaterialCommunityIcons name="bluetooth" size={28} color="#262a4f" /><Text style={styles.featureText}>Bluetooth Compatibility</Text></View>
                <View style={styles.featureItem}><MaterialCommunityIcons name="air-conditioner" size={28} color="#262a4f" /><Text style={styles.featureText}>Air Conditioning</Text></View>
                <View style={styles.featureItem}><MaterialCommunityIcons name="window-closed" size={28} color="#262a4f" /><Text style={styles.featureText}>Power Windows</Text></View>
                <View style={styles.featureItem}><MaterialCommunityIcons name="camera-rear" size={28} color="#262a4f" /><Text style={styles.featureText}>Rear Parking Camera</Text></View>
                <View style={styles.featureItem}><MaterialCommunityIcons name="car-brake-abs" size={28} color="#262a4f" /><Text style={styles.featureText}>ABS</Text></View>
                <View style={styles.featureItem}><MaterialCommunityIcons name="airbag" size={28} color="#262a4f" /><Text style={styles.featureText}>Air Bag</Text></View>
                <View style={styles.featureItem}><MaterialCommunityIcons name="power" size={28} color="#262a4f" /><Text style={styles.featureText}>Button Start</Text></View>
              </View>
            </View>
            <View style={{height: 120}} />
          </ScrollView>

          <View style={styles.bottomActionBar}>
            <TouchableOpacity
              style={styles.placeBidButtonLarge}
              onPress={() => {
                setCarDetailsModalVisible(false);
                setTimeout(() => openBidModal(carId), 300);
              }}
              activeOpacity={0.8}>
              <Text style={styles.placeBidButtonText}>PLACE BID</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.interestedButton} activeOpacity={0.8}>
              <Text style={styles.interestedButtonText}>I am Interested</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // === MAIN RENDER ===
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#262a4f" />
      <LinearGradient
        colors={['#262a4f', '#353a65', '#262a4f']}
        style={styles.gradientBackground}>
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
              <View style={styles.locationContainer}>
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={14} color="#a9acd6" />
                  <Text style={styles.locationLabel}>
                    {locationLoading ? 'Fetching...' : currentLocation}
                  </Text>
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

      {/* BID MODAL */}
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

      {/* CAR DETAILS MODAL */}
      {renderCarDetailsModal()}

      {/* LOW BALANCE WARNING */}
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
  locationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
  },
  locationRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  locationLabel: {color: '#a9acd6', fontSize: 13, fontWeight: '600'},
  notificationIcon: {position: 'relative', right: 20},
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
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    backgroundColor: '#262a4f',
    shadowColor: '#262a4f',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
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
  detailsModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  detailsHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#262a4f',
    letterSpacing: -0.3,
  },
  headerHeartIcon: {
    padding: 8,
  },
  detailsScrollView: {
    flex: 1,
  },
  detailsImageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    backgroundColor: '#f8f9fc',
  },
  detailsCarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailsScrapBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  detailsTitleSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  detailsCarTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  detailsCarSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  quickInfoBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  infoBadge: {
    backgroundColor: '#f8f9fc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6e8f3',
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#262a4f',
  },
  locationTestDriveRow: {
    marginBottom: 12,
  },
  locationInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  testDriveAvailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  testDriveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  inspectionReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e8f3',
  },
  inspectionReportText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a9acd6',
  },
  priceTimerSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  priceBox: {
    backgroundColor: '#f8f9fc',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e6e8f3',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#262a4f',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  priceSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timerLabelBig: {
    fontSize: 32,
    fontWeight: '800',
    color: '#a9acd6',
    letterSpacing: 1,
  },
  knowYourCarSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8f9fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e6e8f3',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  topFeaturesSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#f8f9fc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e8f3',
  },
  featureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  placeBidButtonLarge: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  placeBidButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  interestedButton: {
    flex: 1,
    backgroundColor: '#FCD34D',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FCD34D',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  interestedButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default HomeScreen;