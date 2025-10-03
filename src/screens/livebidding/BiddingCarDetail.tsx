import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BiddingCarDetailsProps {
  title: string;
  subtitle: string;
  info: string;
}

const BiddingCarDetails: React.FC<BiddingCarDetailsProps> = ({ title, subtitle, info }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text style={styles.info}>{info}</Text>
    </View>
  );
};

export default BiddingCarDetails;

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#555" },
  info: { fontSize: 14, fontWeight: "600", color: "#000" },
});
