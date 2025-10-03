// components/TopBiddingAmount.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

interface TopBiddingAmountProps {
  bidCarId?: string; // optional prop if you want to pass it later
}

const TopBiddingAmount: React.FC<TopBiddingAmountProps> = ({ bidCarId }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        <Icon name="bolt" size={16} color="#000" /> Fair market value: ₹ 2,79,241
        <Icon name="info-circle" size={16} color="#000" style={styles.infoIcon} />
      </Text>
    </View>
  );
};

export default TopBiddingAmount;

const styles = StyleSheet.create({
  container: { marginTop: 16, marginLeft: -12, marginRight: -12 },
  text: { fontSize: 16, color: "#000", flexDirection: "row", alignItems: "center" },
  infoIcon: { marginLeft: "auto" },
});
