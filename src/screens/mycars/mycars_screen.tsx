// src/screens/Home/MyCarsScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useWebSocket } from "../../utility/WebSocketConnection";

const { width } = Dimensions.get("window");

/* --------------------------------------------------------------
   Types
   -------------------------------------------------------------- */
interface Car {
  id: string;
  imageUrl?: string;
  isScrap?: boolean;
  city?: string;
  rtoCode?: string;
  make?: string;
  model?: string;
  variant?: string;
  kmsDriven?: number;
  owner?: string;
  fuelType?: string;
  currentBid?: number;
  auctionStartTime?: string | number;
  auctionEndTime?: string | number;
  startTime?: string | number;
  endTime?: string | number;
  createdAt?: string | number;
  beadingCarId?: string;
  bidCarId?: string;
}

interface LivePriceData {
  price: number;
}

const AUCTION_DURATION_MS = 30 * 60 * 1000;

/* --------------------------------------------------------------
   Shared Hook
   -------------------------------------------------------------- */
const useCarData = (liveCars: Car[]) => {
  const [carAuctionTimes, setCarAuctionTimes] = useState<
    Record<string, { start: number; end: number }>
  >({});
  const [countdownTimers, setCountdownTimers] = useState<Record<string, string>>(
    {}
  );
  const [filteredLiveCars, setFilteredLiveCars] = useState<Car[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, LivePriceData>>({});
  const [carImageData, setCarImageData] = useState<Record<string, string>>({});
  const [carDetailsData, setCarDetailsData] = useState<Record<string, any>>({});
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const parseDateTime = (dateTime: any): number | null => {
    if (!dateTime) return null;
    if (typeof dateTime === "number") return dateTime;
    const ts = new Date(dateTime).getTime();
    return isNaN(ts) ? null : ts;
  };

  const formatCountdown = (ms: number): string => {
    if (ms <= 0) return "00:00:00";
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(sec).padStart(2, "0")}`;
  };

  useEffect(() => {
    const now = Date.now();
    const newTimes = { ...carAuctionTimes };
    let changed = false;

    liveCars.forEach((car) => {
      if (car.id && !carAuctionTimes[car.id]) {
        const start =
          parseDateTime(car.auctionStartTime) ||
          parseDateTime(car.startTime) ||
          parseDateTime(car.createdAt) ||
          now;
        const end =
          parseDateTime(car.auctionEndTime) ||
          parseDateTime(car.endTime) ||
          start + AUCTION_DURATION_MS;
        newTimes[car.id] = { start, end };
        changed = true;
      }
    });
    if (changed) setCarAuctionTimes(newTimes);
  }, [liveCars]);

  useEffect(() => {
    if (Object.keys(carAuctionTimes).length === 0) return;
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    countdownInterval.current = setInterval(() => {
      const now = Date.now();
      const timers: Record<string, string> = {};
      const active: Car[] = [];
      const expired: string[] = [];

      liveCars.forEach((car) => {
        const times = carAuctionTimes[car.id];
        if (!times) return;
        const remain = times.end - now;
        if (remain > 0) {
          timers[car.id] = formatCountdown(remain);
          active.push(car);
        } else {
          expired.push(car.id);
        }
      });

      setCountdownTimers(timers);
      setFilteredLiveCars(active);

      if (expired.length) {
        setCarAuctionTimes((prev) => {
          const copy = { ...prev };
          expired.forEach((id) => delete copy[id]);
          return copy;
        });
      }
    }, 1000);

    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [liveCars, carAuctionTimes]);

  const fetchLivePrice = async (bidCarId: string) => {
    try {
      const res = await fetch(
        `https://caryanamindia.prodchunca.in.net/Bid/getliveValue?bidCarId=${bidCarId}`
      );
      const json = await res.json();
      const price = json?.object?.price ?? 0;
      setLivePrices((prev) => ({ ...prev, [bidCarId]: { price } }));
    } catch (e) {
      console.error("live price error", e);
    }
  };

  const fetchCarImageAndDetails = async (beadingCarId: string, bidCarId: string) => {
    try {
      const imgRes = await fetch(
        `https://caryanamindia.prodchunca.in.net/uploadFileBidCar/getByBidCarID?beadingCarId=${beadingCarId}`
      );
      const txt = await imgRes.text();
      let arr: any[] = [];
      try {
        const parsed = JSON.parse(txt);
        arr = Array.isArray(parsed)
          ? parsed
          : parsed?.object ?? parsed?.data ?? [];
      } catch {}
      const cover = arr.find(
        (i) =>
          typeof i.documentType === "string" &&
          i.documentType.toLowerCase().includes("coverimage")
      );
      if (cover?.documentLink) {
        setCarImageData((prev) => ({
          ...prev,
          [beadingCarId]: cover.documentLink,
        }));
      }

      const detRes = await fetch(
        `https://caryanamindia.prodchunca.in.net/BeadingCarController/getByBidCarId/${bidCarId}`
      );
      const detTxt = await detRes.text();
      let details: any = null;
      try {
        details = detTxt ? JSON.parse(detTxt) : null;
      } catch {}
      if (details) {
        setCarDetailsData((prev) => ({ ...prev, [bidCarId]: details }));
      }

      fetchLivePrice(bidCarId);
    } catch (e) {
      console.error("fetchCarImageAndDetails error", e);
    }
  };

  useEffect(() => {
    liveCars.forEach((car) => {
      const beading = car.beadingCarId || car.id;
      const bid = car.bidCarId || car.id;
      if (!carImageData[beading] || !carDetailsData[bid]) {
        fetchCarImageAndDetails(beading, bid);
      }
    });
  }, [liveCars, carImageData, carDetailsData]);

  useEffect(() => {
    const ids = liveCars.map((c) => c.bidCarId || c.id).filter(Boolean);
    if (!ids.length) return;
    const int = setInterval(() => ids.forEach(fetchLivePrice), 3000);
    return () => clearInterval(int);
  }, [liveCars]);

  return {
    filteredLiveCars,
    countdownTimers,
    livePrices,
    carImageData,
    carDetailsData,
  };
};

/* --------------------------------------------------------------
   MyCarsScreen – Enhanced UI
   -------------------------------------------------------------- */
const MyCarsScreen = ({ navigation }: any) => {
  const [selectedTab, setSelectedTab] = useState("Live bid");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const { liveCars, getLiveCars, isConnected, connectWebSocket } = useWebSocket();

  // Refresh animation
  const refreshSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isConnected) connectWebSocket();
    else getLiveCars();
  }, [isConnected]);

  const { filteredLiveCars, countdownTimers, livePrices, carImageData, carDetailsData } =
    useCarData(liveCars);

  const toggleWishlist = (carId: string) => {
    setWishlist((prev) => {
      const copy = new Set(prev);
      copy.has(carId) ? copy.delete(carId) : copy.add(carId);
      return copy;
    });
  };

  const onRefreshPress = () => {
    refreshSpin.setValue(0);
    Animated.timing(refreshSpin, {
      toValue: 1,
      duration: 700,
      easing: Easing.inOut(Easing.linear),
      useNativeDriver: true,
    }).start(() => refreshSpin.setValue(0));
    getLiveCars();
  };

  const spin = refreshSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const dataToShow =
    selectedTab === "Wishlist"
      ? filteredLiveCars.filter((c) => wishlist.has(c.id))
      : selectedTab === "Live bid"
      ? filteredLiveCars
      : [];

  const renderCarItem = ({ item }: { item: Car }) => {
    const carId = item.id;
    const beadingId = item.beadingCarId || carId;
    const bidId = item.bidCarId || carId;
    const isWishlisted = wishlist.has(carId);

    const imageUrl =
      carImageData[beadingId] ||
      carImageData[bidId] ||
      item.imageUrl ||
      "https://photos.caryanamindia.com/1453c850-c6a4-4d46-ab36-6c4dbab27f4c-crysta%201%20-%20Copy.jpg";

    const details = carDetailsData[bidId] || {};
    const live = livePrices[bidId] || { price: item.currentBid ?? 0 };
    const timer = countdownTimers[carId] || "00:30:00";

    return (
      <Animated.View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.carImage} />

        <TouchableOpacity
          style={styles.heartIcon}
          onPress={() => toggleWishlist(carId)}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={24}
            color={isWishlisted ? "#e74c3c" : "#fff"}
          />
        </TouchableOpacity>

        {item.isScrap && (
          <View style={styles.scrapBadge}>
            <Text style={styles.scrapText}>SCRAP CAR</Text>
          </View>
        )}

        <View style={styles.cardDetails}>
          <Text style={styles.carName}>
            {details.brand || item.make} {details.model || item.model} (
            {(details.variant || item.variant || "").trim()})
          </Text>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#777" />
            <Text style={styles.locationTextSmall}>
              {details.city || item.city} • {details.registration || item.rtoCode}
            </Text>
          </View>

          <Text style={styles.carInfo}>
            {(details.kmDriven ?? item.kmsDriven ?? 0).toLocaleString()} km •{" "}
            {details.ownerSerial || item.owner} Owner •{" "}
            {details.fuelType || item.fuelType}
          </Text>

          <View style={styles.bidSection}>
            <View>
              <Text style={styles.highestBid}>Live Bid</Text>
              <Text style={styles.bidAmount}>₹{live.price.toLocaleString()}</Text>
            </View>
            <View style={styles.timerContainer}>
              <Text style={styles.timeRemaining}>Time Left:</Text>
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>{timer}</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header – Same as WinZone (AddOnsScreen) */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Cars</Text>
            <Text style={styles.subTitle}>Your live auction cars</Text>
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={onRefreshPress}>
            <Animated.View
              style={[styles.refreshButton, { transform: [{ rotate: spin }] }]}
            >
              <Text style={styles.refreshIcon}>⟳</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {["Live bid", "OCB nego", "Wishlist"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.activeTabButton,
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Car List */}
      {dataToShow.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={80} color="#a9acd6" />
          <Text style={styles.emptyTitle}>No cars available</Text>
          <Text style={styles.emptySubtitle}>
            Start exploring and bid your favorite cars now!
          </Text>
        </View>
      ) : (
        <FlatList
          data={dataToShow}
          keyExtractor={(i) => i.id}
          renderItem={renderCarItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </SafeAreaView>
  );
};

export default MyCarsScreen;

/* --------------------------------------------------------------
   Styles – Header matches AddOnsScreen exactly
   -------------------------------------------------------------- */
const COLORS = {
  primary: "#262a4f",
  secondary: "#a9acd6",
  background: "#f5f6fa",
  white: "#FFFFFF",
  textDark: "#0F172A",
  textGray: "#374151",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  /* ---------- HEADER (WinZone Style) ---------- */
  header: {
    paddingBottom: 10,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    elevation: 8,
    backgroundColor: COLORS.white,
    shadowColor: "#64748B",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: "700",
  },
  subTitle: {
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIcon: { fontSize: 18, fontWeight: "700", color: COLORS.primary },

  /* ---------- TABS ---------- */
  tabRow: {
    flexDirection: "row",
    marginTop: 16,
    marginHorizontal: 12,
    backgroundColor: "#e9e9f2",
    borderRadius: 30,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "700",
  },

  /* ---------- CARD ---------- */
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  carImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  heartIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#00000060",
    borderRadius: 20,
    padding: 6,
  },
  scrapBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#e63946",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scrapText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cardDetails: { padding: 10 },
  carName: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationTextSmall: { fontSize: 12, color: "#666", marginLeft: 4 },
  carInfo: { fontSize: 12, color: "#777", marginTop: 4 },

  bidSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  highestBid: { fontSize: 12, color: "#777" },
  bidAmount: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  timerContainer: { flexDirection: "row", alignItems: "center" },
  timeRemaining: { fontSize: 10, color: "#777", marginRight: 4 },
  timerBox: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  /* ---------- EMPTY STATE ---------- */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    color: COLORS.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 4,
  },
});