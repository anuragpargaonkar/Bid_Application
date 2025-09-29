import React, { useState } from "react";
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
 
const HomeScreen: React.FC = () => {
  // State to manage the active tab: 'LIVE' or 'OCB'
  const [activeTab, setActiveTab] = useState<'LIVE' | 'OCB'>('LIVE');
 
  // Placeholder assets - Use distinct placeholder paths if you have multiple car photos!
  const carImageSource1 = require('../../assets/images/car1.png'); // Renamed for clarity
  const carImageSource2 = require('../../assets/images/car2.png'); // Renamed for clarity
  const bannerImageSource = require('../../assets/images/car3.png');
 
  // Function to render a single Car Card component
  const renderCarCard = (carDetails: { title: string, subtitle: string, info: string, time: string, imageSource: any, isScrap: boolean }) => (
    <View style={styles.card}>
      <Image
        // The style={styles.carImage} property correctly applies resizeMode: 'cover'
        source={carDetails.imageSource}
        style={styles.carImage}
      />
      {/* Heart Icon */}
      <TouchableOpacity style={styles.heartIcon}>
        <Ionicons name="heart-outline" size={24} color="#fff" />
      </TouchableOpacity>
 
      {carDetails.isScrap && (
        <View style={styles.scrapBadge}>
          <Text style={styles.scrapText}>SCRAP CAR</Text>
        </View>
      )}
 
      <View style={styles.cardDetails}>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={14} color="#555" />
          <Text style={styles.locationTextSmall}> Mumbai • MH-01</Text>
        </View>
        <View style={styles.carHeaderRow}>
          <Text style={styles.carTitle}>{carDetails.title}</Text>
          <View style={styles.engineTag}>
            <Text style={styles.engineText}>ENGINE 1.0</Text>
            <Ionicons name="star" size={10} color="#d32f2f" style={{ marginLeft: 2 }} />
          </View>
        </View>
        <Text style={styles.carSubtitle}>{carDetails.subtitle}</Text>
        <Text style={styles.carInfo}>
          {carDetails.info}
        </Text>
 
        {/* PERFECTED Bid/Timer Section: Highest Bid on left, timer boxes on right */}
        <View style={styles.bidSection}>
          <Text style={styles.highestBid}>Highest Bid</Text>
          <View style={styles.timerContainer}>
            {carDetails.time.split(':').map((value, index) => (
              <React.Fragment key={index}>
                <View style={styles.timerBox}>
                  <Text style={styles.highestBidValue}>{value}</Text>
                </View>
                {index < carDetails.time.split(':').length - 1 && (
                  <Text style={styles.timerSeparator}>:</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
 
 
  // Helper function to render the tabs with conditional styling
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
        {/* Top Bar (Header) */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.location}>
            {/* Location icon before RTO MH */}
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
 
        {/* Scrollable Content */}
        <ScrollView style={styles.scrollViewContent}>
          {/* Tabs */}
          <View style={styles.tabs}>
            {renderTab('LIVE', 99)}
            {renderTab('OCB', 443)}
          </View>
 
          {/* Banner */}
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
            {/* Placeholder for LOANS24 Image */}
            <Image
              source={bannerImageSource}
              style={styles.bannerImage}
            />
          </View>
 
          {/* Filter / Sort */}
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
 
          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
            {["PA Recommended", "Service History", "BMW X1", "HONDA", "Maruti", "Ford"].map(
              (tag, i) => (
                <TouchableOpacity key={i} style={styles.tagBtn}>
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
 
          {/* Car Card - "Live cars" Header */}
          <Text style={styles.liveCarsHeader}>Live cars</Text>
 
          {/* --- CAR CARD 1 --- */}
          {renderCarCard({
            title: '2005 800',
            subtitle: 'AC',
            info: '71,076 km • 1st owner • Petrol',
            time: '01:25:37',
            imageSource: carImageSource1,
            isScrap: true,
          })}
         
          {/* --- CAR CARD 2 --- */}
          {renderCarCard({
            title: '2019 Honda City',
            subtitle: 'VX MT',
            info: '25,000 km • 2nd owner • Diesel',
            time: '00:05:59',
            imageSource: carImageSource2,
            isScrap: false,
          })}
 
 
          {/* Add some padding for the fixed warning bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
 
      {/* Warning Banner (Fixed at the bottom of the content) */}
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
 
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  appContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flex: 1,
  },
  // --- Header/Top Bar Styles ---
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    paddingRight: 5,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
  },
  rtoText: {
    fontSize: 14,
    color: '#888',
    marginRight: 2,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 2,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 10,
    alignItems: "center",
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 5,
    paddingVertical: 0,
  },
  buyBasicButton: {
    backgroundColor: '#7b3aed',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  buyBasicText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  // --- Tabs Styles ---
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },
  defaultCount: {
    color: "#555",
    fontWeight: "500",
    marginLeft: 4,
  },
  liveCount: {
    color: "#d32f2f",
    fontWeight: "700",
    marginLeft: 4,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: "#007bff",
  },
  // --- Banner Styles ---
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 10,
    backgroundColor: "#2f5c9e",
    borderRadius: 8,
    padding: 15,
    overflow: 'hidden',
  },
  bannerTitle: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 5,
    fontSize: 12,
  },
  bannerDesc: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  exploreBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  exploreText: {
    color: "#2f5c9e",
    fontWeight: "600",
    fontSize: 14,
  },
  bannerImage: {
    width: 100,
    height: 70,
    resizeMode: 'contain',
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  // --- Filter / Sort Styles ---
  filterSort: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  // --- Tags Styles ---
  tagsRow: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tagBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    height: 30,
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 12,
    color: "#333",
    fontWeight: '500',
  },
  // --- Live Cars Header ---
  liveCarsHeader: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
  },
  // --- Car Card Styles ---
  card: {
    backgroundColor: "#fff",
    margin: 10,
    marginTop: 5,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  carImage: {
    width: "100%",
    height: 200,
    resizeMode: 'cover', // <-- Confirmed and used here for "perfect fit"
  },
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  scrapBadge: {
    position: "absolute",
    top: 15,
    left: 10,
    backgroundColor: "#d32f2f",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  scrapText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardDetails: {
    padding: 10,
    paddingBottom: 0,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  locationTextSmall: {
    fontSize: 12,
    color: "#555",
  },
  carHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  engineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    height: 25,
  },
  engineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  carSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  carInfo: {
    fontSize: 12,
    color: "#555",
    marginBottom: 10,
  },
  // --- Bid/Timer Section (Perfect Match) ---
  bidSection: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  highestBid: {
    fontSize: 13,
    fontWeight: "600",
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  highestBidValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#d32f2f",
  },
  timerSeparator: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginHorizontal: 4,
  },
  // --- Fixed Warning Banner ---
  warningFixedContainer: {
    position: 'absolute',
    bottom: 55,
    left: 0,
    right: 0,
    backgroundColor: "#d32f2f",
    paddingHorizontal: 15,
    paddingVertical: 10,
    zIndex: 10,
  },
  warningIconText: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
  },
  // --- Bottom Navigation Bar ---
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  navItem: {
    alignItems: 'center',
    padding: 5,
  },
  navText: {
    fontSize: 10,
    color: '#555',
    marginTop: 2,
  },
});