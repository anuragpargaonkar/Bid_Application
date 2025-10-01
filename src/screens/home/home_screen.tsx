import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useWebSocket } from "../../utility/WebSocketConnection";

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'OCB'>('LIVE');
  const { liveCars, getLiveCars } = useWebSocket();

  // Fetch live cars when the component mounts
  useEffect(() => {
    getLiveCars();
  }, [getLiveCars]);

  // Placeholder for banner image
  const bannerImageSource = require('../../assets/images/car2.png');

  // Render a single car card
  const renderCarCard = (car: any) => (
    <View style={styles.card}>
      <Image
        source={car.imageUrl ? { uri: car.imageUrl } : require('../../assets/images/car1.png')}
        style={styles.carImage}
      />
      <TouchableOpacity style={styles.heartIcon}>
        <Ionicons name="heart-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {car.isScrap && (
        <View style={styles.scrapBadge}>
          <Text style={styles.scrapText}>SCRAP CAR</Text>
        </View>
      )}

      <View style={styles.cardDetails}>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={14} color="#555" />
          <Text style={styles.locationTextSmall}>
            {car.city || "Mumbai"} • {car.rtoCode || "MH-01"}
          </Text>
        </View>
        <View style={styles.carHeaderRow}>
          <Text style={styles.carTitle}>{car.make} {car.model}</Text>
          <View style={styles.engineTag}>
            <Text style={styles.engineText}>ENGINE {car.engine || "1.0"}</Text>
            <Ionicons name="star" size={10} color="#d32f2f" style={{ marginLeft: 2 }} />
          </View>
        </View>
        <Text style={styles.carSubtitle}>{car.variant || ""}</Text>
        <Text style={styles.carInfo}>
          {car.kmsDriven || 0} km • {car.owner || "1st owner"} • {car.fuelType || ""}
        </Text>

        <View style={styles.bidSection}>
          <Text style={styles.highestBid}>Highest Bid</Text>
          <View style={styles.timerContainer}>
            {car.remainingTime?.split(':').map((value: string, index: number) => (
              <React.Fragment key={index}>
                <View style={styles.timerBox}>
                  <Text style={styles.highestBidValue}>{value}</Text>
                </View>
                {index < (car.remainingTime?.split(':').length || 0) - 1 && (
                  <Text style={styles.timerSeparator}>:</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  // Render tabs
  const renderTab = (tabName: 'LIVE' | 'OCB', count: number) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity
        style={styles.tabContainer}
        onPress={() => setActiveTab(tabName)}
        activeOpacity={0.8}
      >
        <Text style={styles.tabText}>{tabName}</Text>
        <Text style={[
          styles.tabText,
          isActive ? styles.liveCount : styles.defaultCount
        ]}>
          {count}
        </Text>
        {isActive && <View style={styles.activeTabIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.location}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#888" style={{ marginRight: 2 }} />
            <Text style={styles.rtoText}>RTO</Text>
            <Text style={styles.locationText}>MH</Text>
            <Ionicons name="chevron-down-outline" size={16} color="#000" />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#aaa" />
            <TextInput
              style={styles.searchInput}
              placeholder="Make, model, year, Appt. id"
              placeholderTextColor="#aaa"
            />
          </View>

          <TouchableOpacity style={styles.buyBasicButton}>
            <Text style={styles.buyBasicText}>Buy{"\n"}Basic</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollViewContent}>
          <View style={styles.tabs}>
            {renderTab('LIVE', liveCars?.length || 0)}
            {renderTab('OCB', 443)}
          </View>

          <View style={styles.banner}>
            <View>
              <Text style={styles.bannerTitle}>New launch</Text>
              <Text style={styles.bannerDesc}>
                Get used car loan for your customers{"\n"}Instant valuation | 100% digital
              </Text>
              <TouchableOpacity style={styles.exploreBtn}>
                <Text style={styles.exploreText}>Explore →</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={bannerImageSource}
              style={styles.bannerImage}
            />
          </View>

          <View style={styles.filterSort}>
            <TouchableOpacity style={styles.filterButton}>
              <MaterialCommunityIcons name="tune-variant" size={18} color="#000" />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortButton}>
              <MaterialCommunityIcons name="swap-vertical" size={18} color="#000" />
              <Text style={styles.filterText}>Sort</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
            {["PA Recommended", "Service History", "BMW X1", "HONDA", "Maruti", "Ford"].map(
              (tag, i) => (
                <TouchableOpacity key={i} style={styles.tagBtn}>
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          <Text style={styles.liveCarsHeader}>Live cars</Text>

          {/* --- Render live cars only --- */}
          {liveCars && liveCars.length > 0 ? (
            liveCars.map((car, index) => (
              <View key={index}>
                {renderCarCard(car)}
              </View>
            ))
          ) : (
            <Text style={{ padding: 10, color: '#555' }}>No live cars available</Text>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      <View style={styles.warningFixedContainer}>
        <View style={styles.warningIconText}>
          <MaterialCommunityIcons name="wallet-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.warningText}>
            <Text style={{ fontWeight: '700' }}>Low Account Balance</Text>
            {"\n"}
            Account balance is below Min. Balance Rs. 10000. Booking limit exceeded. Deposit Rs. 10000 to continue bidding.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

// Keep all previous styles as-is
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  appContainer: { flex: 1 },
  scrollViewContent: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", padding: 10, paddingRight: 5, justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: '#eee' },
  location: { flexDirection: "row", alignItems: "center" },
  rtoText: { fontSize: 14, color: '#888', marginRight: 2 },
  locationText: { fontSize: 16, fontWeight: "700", marginHorizontal: 2 },
  searchBar: { flex: 1, flexDirection: "row", backgroundColor: "#f2f2f2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginHorizontal: 10, alignItems: "center", height: 36 },
  searchInput: { flex: 1, fontSize: 14, marginLeft: 5, paddingVertical: 0 },
  buyBasicButton: { backgroundColor: '#7b3aed', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  buyBasicText: { color: "#fff", fontWeight: "700", fontSize: 10, lineHeight: 12, textAlign: 'center' },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee" },
  tabContainer: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, position: 'relative' },
  tabText: { fontSize: 14, fontWeight: "500", color: "#555" },
  defaultCount: { color: "#555", fontWeight: "500", marginLeft: 4 },
  liveCount: { color: "#d32f2f", fontWeight: "700", marginLeft: 4 },
  activeTabIndicator: { position: 'absolute', bottom: -1, left: '25%', right: '25%', height: 3, backgroundColor: "#007bff" },
  banner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 10, marginTop: 10, backgroundColor: "#2f5c9e", borderRadius: 8, padding: 15, overflow: 'hidden' },
  bannerTitle: { color: "#fff", fontWeight: "700", marginBottom: 5, fontSize: 12 },
  bannerDesc: { color: "#fff", fontSize: 13, marginBottom: 10, lineHeight: 18 },
  exploreBtn: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: "flex-start" },
  exploreText: { color: "#2f5c9e", fontWeight: "600", fontSize: 14 },
  bannerImage: { width: 100, height: 70, resizeMode: 'contain', position: 'absolute', right: 0, bottom: 0 },
  filterSort: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#eee" },
  filterButton: { flexDirection: 'row', alignItems: 'center' },
  sortButton: { flexDirection: 'row', alignItems: 'center' },
  filterText: { fontSize: 14, fontWeight: "500", marginLeft: 5 },
  tagsRow: { paddingVertical: 10, paddingHorizontal: 5 },
  tagBtn: { borderWidth: 1, borderColor: "#ccc", borderRadius: 15, paddingHorizontal: 12, paddingVertical: 5, marginHorizontal: 5, backgroundColor: '#fff', height: 30, justifyContent: 'center' },
  tagText: { fontSize: 12, color: "#333", fontWeight: '500' },
  liveCarsHeader: { fontSize: 18, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, marginTop: 5 },
  card: { backgroundColor: "#fff", margin: 10, marginTop: 5, borderRadius: 8, overflow: "hidden", elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84 },
  carImage: { width: "100%", height: 200, resizeMode: 'cover' },
  heartIcon: { position: 'absolute', top: 10, right: 10, padding: 5 },
  scrapBadge: { position: "absolute", top: 15, left: 10, backgroundColor: "#d32f2f", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  scrapText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  cardDetails: { padding: 10, paddingBottom: 0 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  locationTextSmall: { fontSize: 12, color: "#555" },
  carHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carTitle: { fontSize: 18, fontWeight: "700" },
  engineTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, height: 25 },
  engineText: { fontSize: 12, fontWeight: '600', color: '#333' },
  carSubtitle: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  carInfo: { fontSize: 12, color: "#555", marginBottom: 10 },
  bidSection: { flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', paddingHorizontal: 10, paddingVertical: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  highestBid: { fontSize: 13, fontWeight: "600" },
  timerContainer: { flexDirection: 'row', alignItems: 'center' },
  timerBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d32f2f', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  highestBidValue: { fontSize: 14, fontWeight: "700", color: "#d32f2f" },
  timerSeparator: { fontSize: 14, fontWeight: "700", color: "#000", marginHorizontal: 4 },
  warningFixedContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: "#d32f2f", paddingHorizontal: 15, paddingVertical: 10, zIndex: 10 },
  warningIconText: { flexDirection: 'row', alignItems: 'flex-start' },
  warningText: { flex: 1, color: "#fff", fontSize: 13, lineHeight: 18 },
});
