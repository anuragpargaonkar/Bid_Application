// components/LiveBid.tsx
import React, { useEffect } from "react";
import { View, FlatList } from "react-native";
import Card from "./cards";
import { useWebSocket } from "../../utility/WebSocketConnection";

interface LiveCar {
  bidCarId: string;
  beadingCarId: string;
  basePrice: number;
  closingTime: string;
  [key: string]: any;
}

const LiveBid: React.FC = () => {
  const { getLiveCars, liveCars } = useWebSocket();

  useEffect(() => {
    getLiveCars();
  }, [getLiveCars]);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={liveCars as LiveCar[]}
        keyExtractor={(item) => item.bidCarId}
        renderItem={({ item }) => <Card cardData={item} />}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
      />
    </View>
  );
};

export default LiveBid;
