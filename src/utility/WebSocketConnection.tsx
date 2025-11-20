// WebSocketConnection.tsx
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
 
const API_ENDPOINT_WS = 'ws://192.168.1.72:8086/Aucbidding/websocket';
// const API_ENDPOINT_HTTP =
//   'https://caryanamindia.prodchunca.in.net/biddingHTTP/liveCars';
 
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>('disconnected');
  const [client, setClient] = useState<Client | null>(null);
 
  const [topThreeBidsAmount, setTopThreeBidsAmount] = useState<any[]>([]);
  const [topThreeBidsAmountArray, setTopThreeBidsAmountArray] = useState<any[]>(
    [],
  );
  const [liveCars, setLiveCars] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptions = useRef<Record<string, StompSubscription>>({});
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isConnecting = useRef(false);
  const authTokenRef = useRef<string | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stompClientRef = useRef<Client | null>(null);
 
  const TOKEN_KEY = 'auth_token';
 
  // --- Load Stored Token ---
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
 
  // --- Fetch Live Cars via HTTP API ---
  const fetchLiveCarsViaHTTP = async () => {
    console.log('🌐 Fetching live cars from API...');
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (authTokenRef.current)
        headers['Authorization'] = `Bearer ${authTokenRef.current}`;
 
      // const response = await fetch(API_ENDPOINT_HTTP, {method: 'GET', headers});
      const response = await fetch(API_ENDPOINT_WS, { method: 'GET', headers });
      console.log(`🌐 Fetch data:  ${response}`);
      console.log(`📡 Live Cars API Response: ${response.status}`);
 
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
 
      const carsData = await response.json();
      console.log('🌐 Live Cars Data received from API', carsData);
      if (Array.isArray(carsData)) {
        const transformedData = carsData.map((car: any) => ({
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
          currentBid: car.currentBid || car.highestBid || car.startingBid || 0,
          ...car,
        }));
        setLiveCars(transformedData);
        console.log(`🚗 Live cars fetched: ${transformedData.length}`);
      } else {
        console.warn('⚠️ Unexpected data format from live cars API');
      }
 
      return true;
    } catch (error) {
      console.error('❌ Failed to fetch live cars:', error);
      return false;
    }
  };
 
  const connectLiveCarsSocket = () => {
    console.log('📡 Connecting to WebSocket...');
 
    // Append auth token if needed
    const urlWithToken = authTokenRef.current
      ? `${API_ENDPOINT_WS}?token=${authTokenRef.current}`
      : API_ENDPOINT_WS;
 
    const ws = new WebSocket(urlWithToken);
 
    ws.onopen = () => {
      console.log('✅ WebSocket Connected');
      // You can send an initial request if required by your backend
      // ws.send(JSON.stringify({ action: 'subscribe', topic: 'liveCars' }));
    };
 
    ws.onmessage = (e) => console.log('Received:', e.data);
    // ws.onmessage = (event) => {
    //   try {
    //     const data = JSON.parse(event.data);
    //     console.log('📩 Message received:', data);
 
    //     if (Array.isArray(data)) {
    //       // Replace entire list if data is an array
    //       const transformedData = data.map((car: any) => ({
    //         id: car.id || car.carId || car.bidCarId || String(Math.random()),
    //         imageUrl: car.imageUrl || car.image || car.carImage,
    //         isScrap: car.isScrap ?? car.scrap ?? false,
    //         city: car.city || car.location || 'Unknown',
    //         rtoCode: car.rtoCode || car.rto || 'N/A',
    //         make: car.make || car.brand || car.manufacturer || 'Car',
    //         model: car.model || car.modelName || 'Model',
    //         variant: car.variant || car.variantName || 'Variant',
    //         engine: car.engine || car.engineCapacity || '1.0L',
    //         kmsDriven: car.kmsDriven || car.kilometers || car.mileage || 0,
    //         owner: car.owner || car.ownerType || '1st Owner',
    //         fuelType: car.fuelType || car.fuel || 'Petrol',
    //         remainingTime: car.remainingTime || car.timeLeft || '01:30:00',
    //         currentBid: car.currentBid || car.highestBid || car.startingBid || 0,
    //         ...car,
    //       }));
 
    //       setLiveCars(transformedData);
    //       console.log(`🚗 Live cars updated: ${transformedData.length}`);
    //     } else if (data && data.carId) {
    //       // Update a single car in real-time
    //       setLiveCars((prev) => {
    //         const updated = [...prev];
    //         const index = updated.findIndex(
    //           (c) => c.id === data.id || c.carId === data.carId
    //         );
    //         if (index >= 0) updated[index] = { ...updated[index], ...data };
    //         else updated.push(data);
    //         return updated;
    //       });
    //     } else {
    //       console.warn('⚠️ Unexpected data format:', data);
    //     }
    //   } catch (err) {
    //     console.error('❌ Failed to parse WebSocket message:', err);
    //   }
    // };
 
    ws.onerror = (error) => {
      console.error('❌ WebSocket Error:', error.message);
    };
 
    ws.onclose = (event) => {
      console.warn(`🔒 WebSocket Closed (code: ${event.code}). Reconnecting...`);
      setTimeout(connectWebSocket, 5000); // auto-reconnect after 5 seconds
    };
 
    wsRef.current = ws;
    return true;
  };
  // --- Connect WebSocket ---
  const connectWebSocket = async (authToken?: string) => {
    clearConnectionTimeout();
    if (authToken) {
      authTokenRef.current = authToken;
      await AsyncStorage.setItem(TOKEN_KEY, authToken);
      console.log('✅ Token stored for WebSocket connection');
    }
    if (isConnecting.current) {
      console.log('🔄 Connection already in progress...');
      return;
    }
 
    setConnectionStatus('connecting');
    setConnectionError(null);
    isConnecting.current = true;
 
    // Step 1: Fetch live cars via API first
    const success = await connectLiveCarsSocket();
 
    // Step 2: Setup WebSocket for real-time updates if API call works
    if (success) {
      setupWebSocketClient();
      setIsConnected(true);
      setIsAuthenticated(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      isConnecting.current = false;
      console.log('✅ Connected via API & WebSocket');
    } else {
      setConnectionStatus('error');
      setConnectionError('Unable to fetch live cars');
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
        if (!isConnecting.current && authTokenRef.current) connectWebSocket();
      }, 3000);
    } else {
      console.error('🛑 Max reconnection attempts reached');
      setConnectionError(
        'Unable to connect to server. Please restart the app.',
      );
    }
  };
 
  // --- Setup WebSocket Client ---
  const setupWebSocketClient = () => {
    if (stompClientRef.current && stompClientRef.current.connected) return;
 
    const client = new Client({
      brokerURL: API_ENDPOINT_WS,
      connectHeaders: {Authorization: `Bearer ${authTokenRef.current}`},
      debug: msg => console.log('[STOMP DEBUG]', msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
 
    client.onConnect = () => {
      console.log('✅ STOMP Connected');
      setIsConnected(true);
 
      const liveCarsSub = client.subscribe(
        '/topic/liveCars',
        (message: IMessage) => {
          try {
            const carsData = JSON.parse(message.body);
            if (Array.isArray(carsData)) {
              const transformedData = carsData.map((car: any) => ({
                id:
                  car.id || car.carId || car.bidCarId || String(Math.random()),
                imageUrl: car.imageUrl || car.image || car.carImage,
                city: car.city || 'Unknown',
                make: car.make || 'Car',
                model: car.model || 'Model',
                currentBid: car.currentBid || 0,
                ...car,
              }));
              setLiveCars(transformedData);
              console.log(
                `🚗 Updated via WebSocket: ${transformedData.length} cars`,
              );
            }
          } catch (err) {
            console.error('❌ Error parsing /topic/liveCars message:', err);
          }
        },
      );
 
      subscriptions.current['/topic/liveCars'] = liveCarsSub;
    };
 
    client.onWebSocketClose = () => {
      console.warn('⚠️ WebSocket closed');
      setConnectionStatus('disconnected');
      handleReconnect();
    };
 
    client.activate();
    stompClientRef.current = client;
    setClient(client);
  };
 
  const getLiveCars = () => {
    connectLiveCarsSocket();
  };
 
  const placeBid = (userData: BidUserData): Promise<any> => {
    const bid = {
      placedBidId: null,
      userId: userData.userId,
      bidCarId: userData.bidCarId,
      amount: userData.amount,
      dateTime: new Date().toISOString(),
    };
 
    return new Promise((resolve, reject) => {
      if (stompClientRef.current?.connected) {
        try {
          stompClientRef.current.publish({
            destination: '/app/placeBid',
            body: JSON.stringify(bid),
          });
          resolve({status: 'success', message: 'Bid placed successfully'});
        } catch (error) {
          console.error('Error placing bid:', error);
          reject(error);
        }
      } else reject('STOMP client not connected.');
    });
  };
 
  const disconnectWebSocket = () => {
    setConnectionStatus('disconnected');
    isConnecting.current = false;
    clearConnectionTimeout();
 
    Object.values(subscriptions.current).forEach(sub => sub.unsubscribe());
    subscriptions.current = {};
 
    stompClientRef.current?.deactivate();
    stompClientRef.current = null;
 
    setIsConnected(false);
    setIsAuthenticated(false);
    setClient(null);
    setLiveCars([]);
    setTopThreeBidsAmount([]);
    setTopThreeBidsAmountArray([]);
  };
 
  const contextValue: WebSocketContextType = {
    isConnected,
    placeBid,
    getTopThreeBids: () => {},
    topThreeBidsAmount,
    topThreeBidsAmountArray,
    getLiveCars,
    liveCars,
    refreshTopThreeBids: async () => [],
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
  if (!context)
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
};
 