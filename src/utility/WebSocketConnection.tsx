/* eslint-disable @typescript-eslint/no-unused-vars */
// WebSocketConnection.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

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
}

// Define props for provider
interface WebSocketProviderProps {
  children: ReactNode;
}

// Define type for placeBid
interface BidUserData {
  userId: string;
  bidCarId: string;
  amount: number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [topThreeBidsAmount, setTopThreeBidsAmount] = useState<any[]>([]);
  const [topThreeBidsAmountArray, setTopThreeBidsAmountArray] = useState<any[]>(
    []
  );
  const [liveCars, setLiveCars] = useState<any[]>([]);
  const subscriptions = useRef<Record<string, StompSubscription>>({});

  useEffect(() => {
    const socket = new SockJS(
      "https://caryanamindia.prodchunca.in.net/Aucbidding"
    );

    const stompClient = new Client({
      webSocketFactory: () => socket as any,
      debug: () => {}, // disable logs
      onConnect: () => {
        setIsConnected(true);
        setClient(stompClient);

        if (!subscriptions.current["/topic/bids"]) {
          subscriptions.current["/topic/bids"] = stompClient.subscribe(
            "/topic/bids",
            (message: IMessage) => {
              const bid = JSON.parse(message.body);
              console.log("Received bid:", bid);
            }
          );
        }

        if (!subscriptions.current["/topic/topThreeBids"]) {
          subscriptions.current["/topic/topThreeBids"] = stompClient.subscribe(
            "/topic/topThreeBids",
            (message: IMessage) => {
              const topBids = JSON.parse(message.body);
              setTopThreeBidsAmount(topBids);
            }
          );
        }

        if (!subscriptions.current["/topic/liveCars"]) {
          subscriptions.current["/topic/liveCars"] = stompClient.subscribe(
            "/topic/liveCars",
            (message: IMessage) => {
              const cars = JSON.parse(message.body);
              setLiveCars([...cars]);
            }
          );
        }

        stompClient.publish({ destination: `/app/topBids` }); // corrected destination
        stompClient.publish({ destination: "/app/liveCars" });
      },
      onStompError: (frame) => {
        console.log("STOMP Error:", frame);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  const getLiveCars = () => {
    if (client) {
      client.publish({
        destination: "/app/liveCars",
      });
    }
  };

  const getTopThreeBids = (bidCarId: string) => {
    if (client) {
      const bidRequest = { bidCarId };

      client.publish({
        destination: "/app/topThreeBids",
        body: JSON.stringify(bidRequest),
      });

      // Check if a subscription already exists for this bidCarId
      if (!subscriptions.current[`/topic/topThreeBids_${bidCarId}`]) {
        subscriptions.current[`/topic/topThreeBids_${bidCarId}`] = client.subscribe(
          `/topic/topThreeBids`,
          (message: IMessage) => {
            const topBids = JSON.parse(message.body);
            setTopThreeBidsAmount(topBids);
          },
          { ack: "client" }
        );
      }
    }
  };

  const refreshTopThreeBids = (bidCarId: string): Promise<any> => {
    return new Promise((resolve) => {
      if (bidCarId && client) {
        client.publish({ destination: `/app/topBids` }); // corrected destination

        // Check if a subscription already exists for this bidCarId
        if (!subscriptions.current[`/topic/topBids_${bidCarId}`]) {
          subscriptions.current[`/topic/topBids_${bidCarId}`] = client.subscribe(
            `/topic/topBids/${bidCarId}`, // corrected destination
            (message: IMessage) => {
              const topBid = JSON.parse(message.body);
              setTopThreeBidsAmountArray(topBid);
              resolve(topBid);
            }
          );
        }
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
      if (client) {
        client.publish({
          destination: "/app/placeBid",
          body: JSON.stringify(bid),
        });

        //  const bidSubscriptionKey = `/topic/bids_${userData.bidCarId}_${userData.userId}`;

        // Check if a subscription already exists
        if (!subscriptions.current["/topic/bids"]) {
          subscriptions.current["/topic/bids"] = client.subscribe(
            "/topic/bids",
            (message: IMessage) => {
              const response = JSON.parse(message.body);
              if (response?.status) {
                resolve(response);
              }
            }
          );
        }
      } else {
        reject("Stomp client is not initialized.");
      }
    });
  };

  return (
    <WebSocketContext.Provider
      value={{
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
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

const WebSocketConnection: React.FC = () => {
  return <></>;
};

export default WebSocketConnection;