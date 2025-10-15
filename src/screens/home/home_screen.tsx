// HomeScreen.tsx - WITH AUCTION TIMER & AUTO-REMOVE + ENHANCED IMAGE FETCH

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useWebSocket} from '../../utility/WebSocketConnection';
import {useRoute, RouteProp} from '@react-navigation/native';
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

type RootStackParamList = {
  Login: undefined;
  Home: {token: string; userId: string; userInfo: any};
  ForgotPassword: undefined;
};

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const AUCTION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'OCB'>('LIVE');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [biddingStates, setBiddingStates] = useState<{[key: string]: boolean}>(
    {},
  );
  const [livePrices, setLivePrices] = useState<{[key: string]: LivePriceData}>(
    {},
  );
  const [carImageData, setCarImageData] = useState<{[key: string]: string}>({});
  const [carDetailsData, setCarDetailsData] = useState<{[key: string]: any}>(
    {},
  );

  // ✅ Auction timer states
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
  const [bidAmounts, setBidAmounts] = useState<{[bidCarId: string]: string}>(
    {},
  );

  const bidInitializedRef = useRef<string | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

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

  // ✅ PARSE DATETIME TO TIMESTAMP
  const parseDateTime = useCallback((dateTime: any): number | null => {
    if (!dateTime) return null;

    try {
      if (typeof dateTime === 'number') {
        return dateTime;
      }

      if (typeof dateTime === 'string') {
        const parsed = new Date(dateTime).getTime();
        if (!isNaN(parsed)) {
          return parsed;
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing datetime:', error);
      return null;
    }
  }, []);

  // ✅ FORMAT COUNTDOWN TIMER (HH:MM:SS)
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

  // ✅ INITIALIZE AUCTION TIMES WHEN CARS ARE ADDED
  useEffect(() => {
    const now = Date.now();
    const newAuctionTimes: {[key: string]: {start: number; end: number}} = {
      ...carAuctionTimes,
    };
    let hasNewCars = false;

    liveCars.forEach(car => {
      if (car.id && !carAuctionTimes[car.id]) {
        let startTime: number | null = null;

        startTime =
          parseDateTime(car.auctionStartTime) ||
          parseDateTime(car.startTime) ||
          parseDateTime(car.createdAt);

        if (!startTime) {
          startTime = now;
          console.log('⚠️ No start time in API data, using current time', {
            carId: car.id,
          });
        }

        let endTime: number | null = null;
        endTime =
          parseDateTime(car.auctionEndTime) || parseDateTime(car.endTime);

        if (!endTime) {
          endTime = startTime + AUCTION_DURATION_MS;
        }

        newAuctionTimes[car.id] = {
          start: startTime,
          end: endTime,
        };

        hasNewCars = true;

        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        console.log(`🚗 New car added to auction`, {
          carId: car.id,
          startTime: startDate.toLocaleTimeString(),
          endTime: endDate.toLocaleTimeString(),
          startTimestamp: startTime,
          endTimestamp: endTime,
          duration: `${Math.round((endTime - startTime) / 60000)} minutes`,
        });
      }
    });

    if (hasNewCars) {
      setCarAuctionTimes(newAuctionTimes);
    }
  }, [liveCars, carAuctionTimes, parseDateTime]);

  // ✅ UPDATE COUNTDOWN EVERY SECOND & FILTER EXPIRED CARS
  useEffect(() => {
    if (Object.keys(carAuctionTimes).length === 0) return;

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

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

          const startDate = new Date(auctionTime.start);
          const endDate = new Date(auctionTime.end);

          console.log(`⏰ Car auction expired and removed`, {
            carId: car.id,
            startedAt: startDate.toLocaleTimeString(),
            expiredAt: endDate.toLocaleTimeString(),
            removedAt: new Date(now).toLocaleTimeString(),
          });
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
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [liveCars, carAuctionTimes, formatCountdown]);

  useEffect(() => {
    loadStoredAuthData();
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
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
    } catch (error) {
      console.error('Error loading auth data:', error);
    }
  };

  const token = routeParams?.token || storedToken;
  const userId = routeParams?.userId || storedUserId;
  const userInfo = routeParams?.userInfo;

  useEffect(() => {
    if (token && connectionStatus === 'disconnected') {
      connectWebSocket(token);
    }
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
          if (car.id) {
            fetchLivePrice(car.id);
          }
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
      console.error('Refresh error:', error);
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
      const livePriceUrl = `http://caryanamindia.prodchunca.in.net/Bid/getliveValue?bidCarId=${bidCarId}`;
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
      setLivePrices(prev => ({
        ...prev,
        [bidCarId]: livePriceData,
      }));
      return livePriceData;
    } catch (error) {
      console.error(`❌ Failed to fetch live price for ${bidCarId}:`, error);
      return null;
    }
  };

  const refreshAllCarPrices = async () => {
    console.log('🔄 Refreshing all car prices...');
    const promises = filteredLiveCars.map(car => {
      if (car.id) {
        return fetchLivePrice(car.id);
      }
      return Promise.resolve(null);
    });
    await Promise.all(promises);
    console.log('✅ All car prices refreshed');
  };

  // ✅ ENHANCED IMAGE FETCH FROM SECOND CODE
  const fetchCarImageAndDetails = async (
    beadingCarId: string,
    bidCarId: string,
  ) => {
    try {
      console.log('🔍 Starting fetch for:', {beadingCarId, bidCarId});

      // 1️⃣ Fetch image using beadingCarId
      const imageUrl = `http://caryanamindia.prodchunca.in.net/uploadFileBidCar/getByBidCarID?beadingCarId=${beadingCarId}`;
      console.log('📡 Fetching image from:', imageUrl);

      const imageResponse = await fetch(imageUrl);
      console.log('📡 Image response status:', imageResponse.status);

      const imageText = await imageResponse.text();
      console.log(
        '📡 Image response text (first 1000 chars):',
        imageText.substring(0, 1000),
      );

      // ✅ Parse the response safely
      let imageDataArray: any[] = [];
      try {
        const parsed = JSON.parse(imageText);

        // Some APIs wrap data in an "object" property
        if (Array.isArray(parsed)) {
          imageDataArray = parsed;
        } else if (Array.isArray(parsed?.object)) {
          imageDataArray = parsed.object;
        } else if (Array.isArray(parsed?.data)) {
          imageDataArray = parsed.data;
        } else {
          console.warn('⚠️ Unexpected image response structure:', parsed);
        }
      } catch (err) {
        console.error('❌ Failed to parse image response JSON:', err);
      }

      // ✅ Find the cover image for this car
      const coverImageData = imageDataArray.find(
        item =>
          (item.documentType?.toLowerCase() === 'coverimage' ||
            item.doctype?.toLowerCase() === 'coverimage' ||
            item.subtype?.toLowerCase() === 'coverimage') &&
          String(item.beadingCarId) === String(beadingCarId),
      );

      console.log('🖼️ Cover image object:', coverImageData);

      // 2️⃣ Fetch car details using bidCarId
      const carIdUrl = `https://caryanamindia.prodchunca.in.net/BeadingCarController/getByBidCarId/${bidCarId}`;
      console.log('📡 Fetching car details from:', carIdUrl);

      const carIdResponse = await fetch(carIdUrl);
      console.log('📡 Car details response status:', carIdResponse.status);

      const carIdText = await carIdResponse.text();
      console.log(
        '📡 Car details response text (first 100 chars):',
        carIdText.substring(0, 100),
      );

      let carIdData: any = null;
      try {
        carIdData = carIdText ? JSON.parse(carIdText) : null;
        console.log('✅ Parsed car details data:', carIdData);
      } catch (e) {
        console.warn('⚠️ Failed to parse car details response:', carIdText);
      }

      // ✅ Extract and store the correct image link
      const imageLink = coverImageData?.documentLink;

      console.log('📸 Image link extracted:', imageLink);

      if (imageLink) {
        console.log('💾 Storing image for IDs:', {beadingCarId, bidCarId});
        setCarImageData(prev => {
          const newData = {
            ...prev,
            [beadingCarId]: imageLink,
          };
          console.log('💾 Updated carImageData:', newData);
          return newData;
        });
      } else {
        console.warn('⚠️ No cover image found for beadingCarId:', beadingCarId);
      }

      // Store car details
      if (carIdData) {
        setCarDetailsData(prev => ({
          ...prev,
          [bidCarId]: carIdData || {},
        }));
      }

      fetchLivePrice(bidCarId);
    } catch (error: any) {
      console.error('❌ Fetch failed for car', beadingCarId, ':', error);
    }
  };

  // ✅ FETCH IMAGES AND DETAILS FOR ALL CARS
  useEffect(() => {
    console.log(
      '🚗 filteredLiveCars changed, length:',
      filteredLiveCars.length,
    );
    console.log('🗂️ Current carImageData keys:', Object.keys(carImageData));
    console.log('🗂️ Current carDetailsData keys:', Object.keys(carDetailsData));

    filteredLiveCars.forEach(car => {
      const beadingId = car.beadingCarId || car.id;
      const bidId = car.bidCarId || car.id;

      const hasImage = !!(carImageData[bidId] || carImageData[beadingId]);
      const hasDetails = !!carDetailsData[bidId];

      console.log('🚗 Checking car:', {
        carId: car.id,
        beadingId,
        bidId,
        hasImage,
        hasDetails,
      });

      // Fetch if missing either image or details
      if (!hasImage || !hasDetails) {
        console.log('🔄 Fetching data for car:', {beadingId, bidId});
        fetchCarImageAndDetails(beadingId, bidId);
      } else {
        console.log('✅ Car data already exists, skipping fetch');
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
    } catch (error) {
      console.error('Error opening bid modal:', error);
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
    }
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
        const newVal = (current - 2000).toString();
        setBidAmounts(prev => ({...prev, [selectedCar.bidCarId]: newVal}));
      }
    }
  };

  const handleIncreaseBid = () => {
    if (selectedCar) {
      const livePriceData = livePrices[selectedCar.bidCarId];
      const currentPrice = livePriceData?.price ?? selectedCar.price ?? 0;
      const current =
        parseInt(bidAmounts[selectedCar.bidCarId] || '0') || currentPrice;
      const newVal = (current + 2000).toString();
      setBidAmounts(prev => ({...prev, [selectedCar.bidCarId]: newVal}));
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

    console.log('💰 Placing bid:', {
      bidValue,
      currentPrice,
      bidCarId: selectedCar.bidCarId,
      userId,
      token: token?.substring(0, 20) + '...',
    });

    if (isNaN(bidValue) || bidValue <= currentPrice) {
      Alert.alert(
        'Invalid Bid',
        `Bid amount (₹${bidValue}) must be greater than current bid (₹${currentPrice}).`,
      );
      return;
    }

    setBiddingStates(prev => ({...prev, [selectedCar.bidCarId]: true}));

    try {
      const currentDateTime = new Date().toISOString();
      const requestBody = {
        userId: Number(userId),
        bidCarId: Number(selectedCar.bidCarId),
        dateTime: currentDateTime,
        amount: bidValue,
      };

      console.log('📤 Request body:', requestBody);
      console.log(
        '📤 Request URL:',
        `https://caryanamindia.prodchunca.in.net/Bid/placeBid?bidCarId=${selectedCar.bidCarId}`,
      );
      console.log('📤 Headers:', {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token?.substring(0, 20) + '...',
      });

      const bidUrl = `https://caryanamindia.prodchunca.in.net/Bid/placeBid?bidCarId=${selectedCar.bidCarId}`;
      const response = await fetch(bidUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);
      console.log(
        '📥 Response headers:',
        JSON.stringify([...response.headers.entries()]),
      );

      let data = null;
      const text = await response.text();
      console.log('📥 Response text:', text);
      console.log('📥 Response text length:', text?.length || 0);

      try {
        data = text ? JSON.parse(text) : null;
        console.log('📥 Parsed data:', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('📥 Raw response:', text?.substring(0, 200));
      }

      if (response.ok) {
        setModalVisible(false);
        Alert.alert(
          'Bid Placed Successfully! 🎉',
          `Your bid of ₹${bidValue.toLocaleString()} has been placed.`,
          [
            {
              text: 'OK',
              onPress: async () => {
                await refreshAllCarPrices();
                getLiveCars();
              },
            },
          ],
        );
      } else {
        let errorMessage = '';

        if (response.status === 500) {
          errorMessage =
            data?.message ||
            data?.error ||
            text ||
            'Server error occurred. Please try again.';

          if (!text || text.trim() === '') {
            errorMessage =
              'Server returned no error details. Possible causes:\n• Session expired\n• Invalid bid amount\n• Car no longer available\n\nPlease refresh and try again.';
          }
        } else {
          errorMessage =
            data?.message ||
            data?.error ||
            `Server returned ${response.status}`;
        }

        console.error('❌ Bid failed:', {
          status: response.status,
          message: errorMessage,
          data,
          text: text?.substring(0, 200),
        });

        Alert.alert('Bid Failed', errorMessage, [
          {
            text: 'Refresh Data',
            onPress: async () => {
              await refreshAllCarPrices();
              getLiveCars();
            },
          },
          {text: 'Cancel', style: 'cancel'},
        ]);
      }
    } catch (error: any) {
      console.error('❌ Place Bid Error:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      });

      Alert.alert(
        'Network Error',
        `Unable to connect to server.\n\nError: ${
          error?.message || 'Unknown error'
        }\n\nPlease check your connection and try again.`,
        [
          {
            text: 'Retry',
            onPress: () => handlePlaceBid(),
          },
          {text: 'Cancel', style: 'cancel'},
        ],
      );
    } finally {
      setBiddingStates(prev => ({...prev, [selectedCar.bidCarId]: false}));
    }
  };

  const renderCarCard = (car: Car, idx: number) => {
    // ✅ Try multiple ID sources with fallbacks
    const carId = car.id || `car-${idx}`;
    const beadingId = car.beadingCarId || carId;
    const bidId = car.bidCarId || carId;

    // ✅ Try to get image from either ID
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

    // ✅ Use countdown timer from state
    const timeLeft = countdownTimers[carId] || '00:30:00';
    const isBidding = biddingStates[carId] || false;

    console.log('🖼️ Rendering car:', {
      carId,
      beadingId,
      bidId,
      hasImage: !!(
        carImageData[carId] ||
        carImageData[beadingId] ||
        carImageData[bidId]
      ),
      imageUrl: imageUrl.substring(0, 60),
    });

    return (
      <View key={carId} style={styles.card}>
        <Image
          source={{uri: imageUrl}}
          style={styles.carImage}
          defaultSource={require('../../assets/images/car1.png')}
          onError={error => {
            console.error(
              '❌ Image load error for car',
              carId,
              error.nativeEvent,
            );
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully for car', carId);
          }}
        />
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
            <MaterialCommunityIcons name="map-marker" size={14} color="#555" />
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
                {livePriceData ? 'Live Bid 🔴' : 'Highest Bid'}
              </Text>
              <Text style={styles.bidAmount}>
                ₹{currentBid.toLocaleString()}
              </Text>
            </View>
            <View style={styles.timerContainer}>
              <Text style={styles.timeRemaining}>Time Left:</Text>
              {/* ✅ Display single countdown timer */}
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>{timeLeft}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.placeBidButton,
              isBidding && styles.placeBidButtonDisabled,
            ]}
            onPress={() => openBidModal(carId)}
            disabled={isBidding}>
            {isBidding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.placeBidText}>Place Bid</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </>
            )}
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
        <Text
          style={[
            styles.tabCount,
            active ? styles.liveCount : styles.defaultCount,
          ]}>
          {count}
        </Text>
        {active && <View style={styles.activeTabIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appContainer}>
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
            />
          }
          showsVerticalScrollIndicator={false}>
          <View style={styles.tabs}>
            {renderTab('LIVE', filteredLiveCars.length)}
            {renderTab('OCB', 443)}
          </View>

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
              source={require('../../assets/images/car3.png')}
              style={styles.bannerImage}
            />
          </View>

          <View style={styles.liveCarsHeaderContainer}>
            <Text style={styles.liveCarsHeader}>
              Live Cars{' '}
              {filteredLiveCars.length > 0
                ? `(${filteredLiveCars.length})`
                : ''}
            </Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={20} color="#007bff" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>
                {connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Loading...'}
              </Text>
            </View>
          ) : filteredLiveCars.length > 0 ? (
            filteredLiveCars.map(renderCarCard)
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="car-off" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No live cars available</Text>
              <Text style={styles.emptySubtext}>
                {isConnected
                  ? 'No cars currently in auction'
                  : 'Check connection and retry'}
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Place Your Bid</Text>

            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Your Bid Amount</Text>
              <View style={styles.bidInputContainer}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={handleDecreaseBid}>
                  <Text style={styles.adjustButtonText}>-</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.bidInput}
                  value={selectedCar ? bidAmounts[selectedCar.bidCarId] : ''}
                  onChangeText={handleBidInputChange}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                />

                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={handleIncreaseBid}>
                  <Text style={styles.adjustButtonText}>+</Text>
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
                style={styles.confirmButton}
                onPress={handlePlaceBid}
                disabled={biddingStates[selectedCar?.bidCarId || '']}>
                {biddingStates[selectedCar?.bidCarId || ''] ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>CONFIRM</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            Account balance below ₹10,000. Deposit to continue bidding.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

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
    margin: 10,
    borderRadius: 8,
  },
  statusDot: {width: 8, height: 8, borderRadius: 4, marginRight: 6},
  statusText: {fontSize: 12, color: '#666', fontWeight: '500'},
  retrySmallBtn: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  retrySmallText: {color: '#fff', fontSize: 10, fontWeight: '600'},
  userInfo: {
    backgroundColor: '#e7f3ff',
    padding: 10,
    margin: 10,
    borderRadius: 8,
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
  flowStatusText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  tabContainer: {alignItems: 'center'},
  tabText: {fontSize: 16, fontWeight: '600', color: '#888'},
  activeTabText: {color: '#007bff'},
  tabCount: {fontSize: 12, fontWeight: '700', marginTop: 2},
  liveCount: {color: '#007bff'},
  defaultCount: {color: '#aaa'},
  activeTabIndicator: {
    height: 3,
    backgroundColor: '#007bff',
    marginTop: 4,
    width: 40,
    borderRadius: 2,
  },
  banner: {
    backgroundColor: '#eaf2ff',
    marginHorizontal: 10,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTitle: {fontSize: 14, fontWeight: '700', color: '#007bff'},
  bannerDesc: {fontSize: 12, color: '#333', marginVertical: 4},
  exploreBtn: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  exploreText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  bannerImage: {width: 80, height: 60, resizeMode: 'contain', marginLeft: 120},
  liveCarsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  liveCarsHeader: {fontSize: 18, fontWeight: '700', color: '#333'},
  refreshBtn: {padding: 5},
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  carImage: {width: '100%', height: 160, resizeMode: 'cover'},
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#00000050',
    padding: 6,
    borderRadius: 20,
  },
  scrapBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff0000cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scrapText: {color: '#fff', fontWeight: '700', fontSize: 10},
  cardDetails: {padding: 10},
  carName: {fontSize: 16, fontWeight: '700', color: '#333'},
  locationRow: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  locationTextSmall: {fontSize: 12, color: '#666', marginLeft: 4},
  carInfo: {fontSize: 12, color: '#777', marginTop: 4},
  bidSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  highestBid: {fontSize: 12, color: '#666'},
  bidAmount: {fontSize: 16, fontWeight: '700', color: '#007bff'},
  timerContainer: {flexDirection: 'row', alignItems: 'center'},
  timeRemaining: {fontSize: 10, color: '#666', marginRight: 4},
  timerBox: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timerText: {color: '#fff', fontWeight: '700', fontSize: 12},
  timerSeparator: {marginHorizontal: 2, fontWeight: '700', color: '#007bff'},
  placeBidButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  placeBidButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  placeBidText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  loadingContainer: {alignItems: 'center', marginTop: 50},
  loadingText: {marginTop: 10, color: '#007bff', fontSize: 14},
  emptyContainer: {alignItems: 'center', marginTop: 50},
  emptyText: {fontSize: 16, fontWeight: '700', color: '#777'},
  emptySubtext: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  retryText: {color: '#fff', fontWeight: '600'},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  amountContainer: {
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  adjustButton: {
    backgroundColor: '#000',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  bidInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#28a745',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  warningFixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'red',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  warningIconText: {flexDirection: 'row', alignItems: 'center', flex: 1},
  warningText: {color: '#fff', fontSize: 12, flex: 1},
});

export default HomeScreen;
