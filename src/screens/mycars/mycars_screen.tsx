import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
 
const MyCarsScreen = () => {
  const [selectedTab, setSelectedTab] = useState("Live bid");
 
  const tabs = [
    { id: "Live bid", label: "Live bid", count: 0 },
    { id: "OCB nego", label: "OCB nego", count: 0 },
    { id: "Wishlist", label: "Wishlist", count: 0 },
  ];
 
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>My Cars</Text>
 
      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label} {tab.count}
            </Text>
            {selectedTab === tab.id && <View style={styles.activeLine} />}
          </TouchableOpacity>
        ))}
      </View>
 
      {/* Empty State */}
      <View style={styles.emptyContainer}>
        <Image
          source={require("../../assets/images/hammer.png")}
          style={styles.emptyImage}
        />
        <Text style={styles.emptyTitle}>You haven't placed any bids, yet</Text>
        <Text style={styles.emptySubtitle}>
          You are missing out on great deals.{"\n"}Browse now and start bidding!
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>View all auctions</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
 
export default MyCarsScreen;
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
    marginLeft: 16,
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  activeLine: {
    marginTop: 4,
    height: 2,
    width: "100%",
    backgroundColor: "#007AFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyImage: {
    height: 180,
    aspectRatio: 1,
    marginBottom: 16,
    resizeMode: "contain",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#E66100",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
 
 