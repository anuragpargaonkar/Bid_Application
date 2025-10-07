// WebSocketConnection.tsx - SINGLE URL VERSION
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {Client, IMessage, StompSubscription} from '@stomp/stompjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define WebSocket context type
interface WebSocketContextType {
  isConnected: boolean;
  placeBid: (userData: BidUserData) => Promise<any>;
  getTopThreeBids: (bidCarId: string) => void;
  topThreeBidsAmount: any[];
  topThreeBidsAmountArray: any[];
  getLiveCars: () => void;
  liveCars: any[];
  refreshTopThreeBids: (bidCarId: string) => Promise<any>;
  client: Client | null;
  subscriptions: React.MutableRefObject<Record<string, StompSubscription>>;
  connectWebSocket: (authToken?: string) => void;
  disconnectWebSocket: () => void;
  isAuthenticated: boolean;
  connectionError: string | null;
  connectionStatus: string;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

interface BidUserData {
  userId: string;
  bidCarId: string;
  amount: number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// ✅ SINGLE API ENDPOINT
const API_ENDPOINT =
  'https://caryanamindia.prodchunca.in.net/BeadingCarController/all';

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>('disconnected');
  const stompClientRef = useRef<Client | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [topThreeBidsAmount, setTopThreeBidsAmount] = useState<any[]>([]);
  const [topThreeBidsAmountArray, setTopThreeBidsAmountArray] = useState<any[]>(
    [],
  );
  const [liveCars, setLiveCars] = useState<any[]>([]);
  const subscriptions = useRef<Record<string, StompSubscription>>({});
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isConnecting = useRef(false);
  const authTokenRef = useRef<string | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const TOKEN_KEY = 'auth_token';
  const USER_ID_KEY = 'user_id';

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        authTokenRef.current = token;
        console.log('✅ Loaded stored token');
      }
    } catch (error) {
      console.error('❌ Error loading stored token:', error);
    }
  };

  const clearConnectionTimeout = () => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  };

  // ✅ FETCH LIVE CARS VIA HTTP
  const fetchLiveCarsViaHTTP = async () => {
    console.log('🌐 Fetching live cars from API...');

    try {
      console.log(`🔗 Calling API: ${API_ENDPOINT}`);

      const headers: any = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (authTokenRef.current) {
        headers['Authorization'] = `Bearer ${authTokenRef.current}`;
      }

      const response = await fetch(API_ENDPOINT, {
        method: 'GET',
        headers: headers,
        timeout: 10000,
      } as any);

      console.log(`📡 API Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Successfully fetched data`);
        console.log(
          `🚗 Received ${Array.isArray(data) ? data.length : 0} cars`,
        );

        if (Array.isArray(data) && data.length > 0) {
          // Transform data to match expected format
          const transformedData = data.map((car: any) => ({
            id: car.id || car.carId || car.bidCarId || String(Math.random()),
            imageUrl: car.imageUrl || car.image || car.carImage,
            isScrap: car.isScrap || car.scrap || false,
            city: car.city || car.location || 'Unknown',
            rtoCode: car.rtoCode || car.rto || 'N/A',
            make: car.make || car.brand || car.manufacturer || 'Car',
            model: car.model || car.modelName || 'Model',
            variant: car.variant || car.variantName || 'Variant',
            engine: car.engine || car.engineCapacity || '1.0L',
            kmsDriven: car.kmsDriven || car.kilometers || car.mileage || 0,
            owner: car.owner || car.ownerType || '1st Owner',
            fuelType: car.fuelType || car.fuel || 'Petrol',
            remainingTime: car.remainingTime || car.timeLeft || '01:30:00',
            currentBid:
              car.currentBid || car.highestBid || car.startingBid || 0,
            ...car,
          }));

          setLiveCars(transformedData);
          console.log('✅ Live cars updated');
          console.log('📋 First car details:', {
            id: transformedData[0]?.id,
            make: transformedData[0]?.make,
            model: transformedData[0]?.model,
            currentBid: transformedData[0]?.currentBid,
          });
          console.log('📄 Full first car data:', transformedData[0]);
          return true;
        }
      }
    } catch (error) {
      console.log(`❌ Failed to fetch from API:`, error);
    }

    console.warn('⚠️ API request failed');
    return false;
  };

  const connectWebSocket = async (authToken?: string) => {
    clearConnectionTimeout();

    if (authToken) {
      authTokenRef.current = authToken;
      await AsyncStorage.setItem(TOKEN_KEY, authToken);
      console.log('✅ Token stored for connection');
    }

    if (isConnecting.current) {
      console.log('🔄 Connection already in progress...');
      return;
    }

    console.log('🚀 STEP 2: Connecting to API...');
    console.log('🔐 Token available:', !!authTokenRef.current);

    setConnectionStatus('connecting');
    setConnectionError(null);
    isConnecting.current = true;

    const success = await fetchLiveCarsViaHTTP();

    if (success) {
      setIsConnected(true);
      setIsAuthenticated(true);
      setConnectionStatus('connected');
      setConnectionError(null);
      reconnectAttempts.current = 0;
      isConnecting.current = false;
      clearConnectionTimeout();
      console.log('✅ Successfully connected and fetched live cars');
    } else {
      setConnectionStatus('error');
      setConnectionError('Unable to connect to API');
      isConnecting.current = false;
      handleReconnect();
    }
  };

  const handleReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current += 1;
      console.log(
        `🔄 Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`,
      );

      setTimeout(() => {
        if (!isConnecting.current && authTokenRef.current) {
          console.log('🔄 Attempting to reconnect...');
          connectWebSocket();
        }
      }, 3000);
    } else {
      console.error('🛑 Max reconnection attempts reached');
      setConnectionError(
        'Unable to connect to server. Please restart the app.',
      );
    }
  };

  const setupSubscriptions = (stompClient: Client) => {
    try {
      console.log('📡 Setting up subscriptions...');

      if (!subscriptions.current['/topic/liveCars']) {
        const liveCarsSubscription = stompClient.subscribe(
          '/topic/liveCars',
          (message: IMessage) => {
            try {
              console.log('📨 Received live cars data through subscription');
              const carsData = JSON.parse(message.body);
              console.log(
                `🚗 Received ${
                  Array.isArray(carsData) ? carsData.length : 0
                } live cars`,
              );

              if (Array.isArray(carsData) && carsData.length > 0) {
                const transformedData = carsData.map((car: any) => ({
                  id:
                    car.id ||
                    car.carId ||
                    car.bidCarId ||
                    String(Math.random()),
                  imageUrl: car.imageUrl || car.image || car.carImage,
                  isScrap: car.isScrap || car.scrap || false,
                  city: car.city || car.location || 'Unknown',
                  rtoCode: car.rtoCode || car.rto || 'N/A',
                  make: car.make || car.brand || car.manufacturer || 'Car',
                  model: car.model || car.modelName || 'Model',
                  variant: car.variant || car.variantName || 'Variant',
                  engine: car.engine || car.engineCapacity || '1.0L',
                  kmsDriven:
                    car.kmsDriven || car.kilometers || car.mileage || 0,
                  owner: car.owner || car.ownerType || '1st Owner',
                  fuelType: car.fuelType || car.fuel || 'Petrol',
                  remainingTime:
                    car.remainingTime || car.timeLeft || '01:30:00',
                  currentBid:
                    car.currentBid || car.highestBid || car.startingBid || 0,
                  ...car,
                }));

                setLiveCars(transformedData);
                console.log('✅ Live cars updated in UI state');
                console.log('📋 First car details:', {
                  id: transformedData[0]?.id,
                  make: transformedData[0]?.make,
                  model: transformedData[0]?.model,
                  currentBid: transformedData[0]?.currentBid,
                });
              } else {
                console.warn('⚠️ Received empty or invalid cars array');
                setLiveCars([]);
              }
            } catch (error) {
              console.error('❌ Error parsing live cars data:', error);
            }
          },
          {id: 'liveCars-subscription'},
        );
        subscriptions.current['/topic/liveCars'] = liveCarsSubscription;
        console.log('✅ Subscribed to /topic/liveCars');
      }

      if (!subscriptions.current['/topic/bids']) {
        subscriptions.current['/topic/bids'] = stompClient.subscribe(
          '/topic/bids',
          (message: IMessage) => {
            try {
              const bidData = JSON.parse(message.body);
              console.log('💰 Received bid update:', bidData);
            } catch (error) {
              console.error('❌ Error parsing bid:', error);
            }
          },
          {id: 'bids-subscription'},
        );
        console.log('✅ Subscribed to /topic/bids');
      }

      console.log('🎉 All subscriptions set up successfully');
    } catch (error) {
      console.error('❌ Error setting up subscriptions:', error);
    }
  };

  const getLiveCars = () => {
    console.log('📡 Requesting live cars...');
    fetchLiveCarsViaHTTP();
  };

  const getTopThreeBids = (bidCarId: string) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      console.log(`📡 Requesting top three bids for car: ${bidCarId}`);
      try {
        stompClientRef.current.publish({
          destination: '/app/topThreeBids',
          body: JSON.stringify({bidCarId}),
        });
      } catch (error) {
        console.error('❌ Error getting top bids:', error);
      }
    } else {
      console.warn('⚠️ Cannot get top bids: Not connected');
    }
  };

  const refreshTopThreeBids = (bidCarId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (
        bidCarId &&
        stompClientRef.current &&
        stompClientRef.current.connected
      ) {
        try {
          stompClientRef.current.publish({
            destination: '/app/topBids',
            body: JSON.stringify({bidCarId}),
          });

          if (!subscriptions.current[`/topic/topBids_${bidCarId}`]) {
            subscriptions.current[`/topic/topBids_${bidCarId}`] =
              stompClientRef.current.subscribe(
                `/topic/topBids/${bidCarId}`,
                (message: IMessage) => {
                  try {
                    const topBid = JSON.parse(message.body);
                    setTopThreeBidsAmountArray(topBid);
                    resolve(topBid);
                  } catch (error) {
                    console.error('❌ Error parsing top bid:', error);
                    reject(error);
                  }
                },
              );
          }
        } catch (error) {
          console.error('❌ Error refreshing top bids:', error);
          reject(error);
        }
      } else {
        reject('Not authenticated or client not initialized');
      }
    });
  };

  const placeBid = (userData: BidUserData): Promise<any> => {
    const bid = {
      placedBidId: null,
      userId: userData.userId,
      bidCarId: userData.bidCarId,
      dateTime: new Date().toISOString(),
      amount: userData.amount,
    };

    return new Promise((resolve, reject) => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        try {
          stompClientRef.current.publish({
            destination: '/app/placeBid',
            body: JSON.stringify(bid),
          });
          resolve({status: 'success', message: 'Bid placed successfully'});
        } catch (error) {
          console.error('❌ Error placing bid:', error);
          reject(error);
        }
      } else {
        reject('Not authenticated or Stomp client is not initialized.');
      }
    });
  };

  const disconnectWebSocket = () => {
    console.log('🛑 Disconnecting...');
    setConnectionStatus('disconnected');
    isConnecting.current = false;
    clearConnectionTimeout();

    if (stompClientRef.current) {
      try {
        Object.keys(subscriptions.current).forEach(key => {
          try {
            subscriptions.current[key].unsubscribe();
          } catch (error) {
            console.error(`❌ Error unsubscribing from ${key}:`, error);
          }
        });
        subscriptions.current = {};

        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      } catch (error) {
        console.error('❌ Error during disconnect:', error);
      }
    }

    setIsConnected(false);
    setIsAuthenticated(false);
    setClient(null);
    setLiveCars([]);
    setTopThreeBidsAmount([]);
    setTopThreeBidsAmountArray([]);
    reconnectAttempts.current = 0;
  };

  useEffect(() => {
    return () => {
      clearConnectionTimeout();
    };
  }, []);

  const contextValue: WebSocketContextType = {
    isConnected,
    placeBid,
    getTopThreeBids,
    topThreeBidsAmount,
    topThreeBidsAmountArray,
    getLiveCars,
    liveCars,
    refreshTopThreeBids,
    client,
    subscriptions,
    connectWebSocket,
    disconnectWebSocket,
    isAuthenticated,
    connectionError,
    connectionStatus,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
