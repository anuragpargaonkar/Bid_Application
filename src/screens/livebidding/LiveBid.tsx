// components/LiveBid.tsx
import React, { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import Card from "./cards";
import useWebSocket from "../../Utilies/websocket";

interface LiveCar {
  bidCarId: string;
  beadingCarId: string;
  basePrice: number;
  closingTime: string;
  [key: string]: any;
}

const LiveBid: React.FC = () => {
  const { getAllLiveCars } = useWebSocket();
  const [liveCars, setLiveCars] = useState<LiveCar[]>([]);

  useEffect(() => {
    getAllLiveCars(); // You may want to update your hook to set liveCars in state
  }, []);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={liveCars}
        keyExtractor={(item) => item.bidCarId}
        renderItem={({ item }) => <Card cardData={item} />}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
      />
    </View>
  );
};

export default LiveBid;
