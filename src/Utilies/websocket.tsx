import { useState, useEffect, useRef } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface BidUserData {
  userId: string;
  bidCarId: string;
  amount: number;
}

export interface WebSocketHookReturn {
  isConnected: boolean;
  topThreeBidsAmount: any[];
  client: Client | null;
  placeBid: (userData: BidUserData) => void;
  getTopThreeBids: (payload: any) => void;
  getTopBidByCarId: (carId: string) => void;
  getAllLiveCars: () => void;
  connect: () => void;
  disconnect: () => void;
}

const useWebSocket = (): WebSocketHookReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [topThreeBidsAmount, setTopThreeBidsAmount] = useState<any[]>([]);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Record<string, StompSubscription>>({});

  const connect = async () => {
    if (clientRef.current?.active) {
      console.log("WebSocket already connected");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("JWT_TOKEN");
      console.log("WebSocket connect - Retrieved JWT token:", token);
      if (!token) {
        console.error("No JWT token found for WebSocket connection");
        return;
      }

      const socket = new SockJS("https://caryanamindia.prodchunca.in.net/Aucbidding");
      const client = new Client({
        webSocketFactory: () => socket as any,
        reconnectDelay: 5000,
        debug: () => {},
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        onConnect: () => {
          console.log("✅ STOMP Connected");
          setIsConnected(true);

          if (!subscriptionsRef.current["/topic/topThreeBids"]) {
            subscriptionsRef.current["/topic/topThreeBids"] = client.subscribe(
              "/topic/topThreeBids",
              (message: IMessage) => {
                try {
                  const data = JSON.parse(message.body);
                  setTopThreeBidsAmount(data);
                } catch (error) {
                  console.error("Failed to parse topThreeBids:", error);
                }
              }
            );
          }

          if (!subscriptionsRef.current["/topic/liveCars"]) {
            subscriptionsRef.current["/topic/liveCars"] = client.subscribe(
              "/topic/liveCars",
              (message: IMessage) => {
                console.log("Live cars update:", message.body);
              }
            );
          }
        },
        onStompError: (frame) =>
          console.error("❌ STOMP Error:", frame.headers["message"]),
        onDisconnect: () => setIsConnected(false),
      });

      client.activate();
      clientRef.current = client;
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  };

  const disconnect = () => {
    clientRef.current?.deactivate();
    clientRef.current = null;
    subscriptionsRef.current = {};
    setIsConnected(false);
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  const placeBid = (userData: BidUserData) => {
    if (!clientRef.current) return;
    const bid = {
      placedBidId: null,
      userId: userData.userId,
      bidCarId: userData.bidCarId,
      dateTime: new Date().toISOString(),
      amount: userData.amount,
    };
    clientRef.current.publish({
      destination: "/app/placeBid",
      body: JSON.stringify(bid),
    });
  };

  const getTopThreeBids = (payload: any) => {
    clientRef.current?.publish({
      destination: "/app/topThreeBids",
      body: JSON.stringify(payload),
    });
  };

  const getTopBidByCarId = (carId: string) => {
    clientRef.current?.publish({
      destination: `/app/topBids/${carId}`,
      body: JSON.stringify({ bidCarId: carId }),
    });
  };

  const getAllLiveCars = () => {
    clientRef.current?.publish({
      destination: "/app/liveCars",
      body: JSON.stringify({}),
    });
  };

  return {
    isConnected,
    topThreeBidsAmount,
    client: clientRef.current,
    placeBid,
    getTopThreeBids,
    getTopBidByCarId,
    getAllLiveCars,
    connect,
    disconnect,
  };
};

export default useWebSocket;
