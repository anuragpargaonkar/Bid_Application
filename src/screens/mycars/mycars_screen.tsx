import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useWebSocket } from "../../utility/WebSocketConnection";
 
const MyCarsScreen = () => {
  const [selectedTab, setSelectedTab] = useState("Live bid");
 
  // WebSocket context
  const { liveCars, getLiveCars, isConnected, connectWebSocket } = useWebSocket();
 
  useEffect(() => {
    if (!isConnected) {
      connectWebSocket(); // connect if not connected
    } else {
      getLiveCars(); // fetch cars after connection
    }
  }, [isConnected]);
 
  const tabs = [
    { id: "Live bid", label: "Live bid" },
    { id: "OCB nego", label: "OCB nego" },
    { id: "Wishlist", label: "Wishlist" },
  ];
 
  const renderCarItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image
        source={
          item.imageUrl
            ? { uri: item.imageUrl }
            : require("../../assets/images/car1.png")
        }
        style={styles.carImage}
      />
      <View style={styles.cardDetails}>
        <Text style={styles.carTitle}>
          {item.make} {item.model} {item.variant}
        </Text>
        <Text style={styles.carSubtitle}>
          {item.city} • {item.kmsDriven} km • {item.owner}
        </Text>
        <View style={styles.bidRow}>
          <Text style={styles.priceText}>₹ {item.currentBid?.toLocaleString()}</Text>
          <Text style={styles.timeText}>⏱ {item.remainingTime}</Text>
        </View>
      </View>
    </View>
  );
 
  const showEmptyState = liveCars.length === 0;
 
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
              {tab.label}
            </Text>
            {selectedTab === tab.id && <View style={styles.activeLine} />}
          </TouchableOpacity>
        ))}
      </View>
 
      {/* Live Cars or Empty State */}
      {showEmptyState ? (
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
      ) : (
        <FlatList
          data={liveCars}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCarItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
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
  card: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginVertical: 6,
    overflow: "hidden",
  },
  carImage: {
    width: 120,
    height: 90,
    resizeMode: "cover",
  },
  cardDetails: {
    flex: 1,
    padding: 10,
  },
  carTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  carSubtitle: {
    fontSize: 13,
    color: "#777",
    marginVertical: 4,
  },
  bidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E66100",
  },
  timeText: {
    fontSize: 12,
    color: "#555",
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
