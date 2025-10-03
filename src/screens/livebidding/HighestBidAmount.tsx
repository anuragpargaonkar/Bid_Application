// components/HighestBidAmount.tsx
import React, { useEffect } from "react";
import { Text } from "react-native";
import useWebSocket from "../../Utilies/websocket";

interface HighestBidAmountProps {
  bidCarId: string; // Updated to match your car ID naming
}

const HighestBidAmount: React.FC<HighestBidAmountProps> = ({ bidCarId }) => {
  const { isConnected, getTopThreeBids, topThreeBidsAmount } = useWebSocket();

  useEffect(() => {
    if (isConnected && bidCarId) {
      getTopThreeBids(bidCarId);
    }
  }, [isConnected, bidCarId]);

  return <Text>{topThreeBidsAmount[0]?.amount ?? "-"}</Text>;
};

export default HighestBidAmount;
