// src/screens/Home/AddOnsScreen.tsx
 
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
 
const { width } = Dimensions.get('window');
 
interface FinalBid {
  finalBidId: number;
  bidCarId: number;
  price: number;
  buyerDealerId: number;
  sellerDealerId: number | null;
  beadingCarId: number | null;
  createdAt?: string;
  updatedAt?: string;
}
 
const COLORS = {
  primary: '#262a4f',
  secondary: '#a9acd6',
  background: '#f5f6fa',
  white: '#FFFFFF',
  textDark: '#0F172A',
  textGray: '#374151',
};
 
const AddOnsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [finalBids, setFinalBids] = useState<FinalBid[]>([]);
  const [displayedBids, setDisplayedBids] = useState<FinalBid[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<FinalBid | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);
 
  const flatListRef = useRef<FlatList<FinalBid>>(null);
 
  // animations
  const itemAnims = useRef<Animated.Value[]>([]);
  const modalAnim = useRef(new Animated.Value(0)).current;
  const refreshSpin = useRef(new Animated.Value(0)).current;
 
  const ITEMS_PER_PAGE = 6;
 
  useEffect(() => {
    fetchFinalBids();
  }, []);
 
  useEffect(() => {
    itemAnims.current = displayedBids.map(() => new Animated.Value(0));
    animateListIn();
  }, [displayedBids]);
 
  const fetchFinalBids = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token found');
 
      const response = await fetch('https://caryanamindia.prodchunca.in.net/Bid/finalBids', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
 
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const bids = json.finalBids || [];
      bids.sort((a: FinalBid, b: FinalBid) => {
        if (a.updatedAt && b.updatedAt)
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        return b.finalBidId - a.finalBidId;
      });
      setFinalBids(bids);
      setDisplayedBids(bids.slice(0, ITEMS_PER_PAGE));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };
 
  const loadMore = () => {
    if (loading) return;
    const nextPage = page + 1;
    const startIndex = nextPage * ITEMS_PER_PAGE - ITEMS_PER_PAGE;
    const newItems = finalBids.slice(startIndex, nextPage * ITEMS_PER_PAGE);
    if (newItems.length > 0) {
      setDisplayedBids(prev => [...prev, ...newItems]);
      setPage(nextPage);
    }
  };
 
  const animateListIn = () => {
    const animations = itemAnims.current.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 450,
        delay: i * 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    Animated.stagger(60, animations).start();
  };
 
  const onRefreshPress = () => {
    refreshSpin.setValue(0);
    Animated.timing(refreshSpin, {
      toValue: 1,
      duration: 700,
      easing: Easing.inOut(Easing.linear),
      useNativeDriver: true,
    }).start(() => refreshSpin.setValue(0));
    fetchFinalBids();
  };
 
  const openDetails = (bid: FinalBid) => {
    setSelectedBid(bid);
    setModalVisible(true);
    modalAnim.setValue(0);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.back(0.6)),
      useNativeDriver: true,
    }).start();
  };
 
  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedBid(null);
    });
  };
 
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (distanceFromBottom < 60) {
      setShowScrollButton(false);
    } else {
      setShowScrollButton(true);
    }
  };
 
  const scrollToBottom = () => {
    if (flatListRef.current && finalBids.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };
 
  const spin = refreshSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
 
  const renderBidCard = ({ item, index }: { item: FinalBid; index: number }) => {
    const anim = itemAnims.current[index] || new Animated.Value(1);
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
    const opacity = anim;
 
    return (
      <Animated.View style={[styles.card, { transform: [{ translateY }], opacity }]}>
        <TouchableOpacity activeOpacity={0.95} onPress={() => openDetails(item)} style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.carIdText}>🏁 Car ID</Text>
              <Text style={styles.carIdNumber}>#{item.bidCarId}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.priceLabel}>Winning</Text>
              <Text style={styles.priceValue}>₹{item.price.toLocaleString('en-IN')}</Text>
            </View>
          </View>
 
          <View style={styles.cardBody}>
            <View style={styles.detailRowSmall}>
              <Text style={styles.smallLabel}>Buyer Dealer</Text>
              <Text style={styles.smallValue}>ID {item.buyerDealerId}</Text>
            </View>
            <View style={styles.detailRowSmall}>
              <Text style={styles.smallLabel}>Seller Dealer</Text>
              <Text style={styles.smallValue}>{item.sellerDealerId ?? '—'}</Text>
            </View>
            <View style={styles.detailRowSmall}>
              <Text style={styles.smallLabel}>Beading ID</Text>
              <Text style={styles.smallValue}>{item.beadingCarId ?? '—'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
 
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button - No Zoom Animation */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>WinZone</Text>
            <Text style={styles.subTitle}>Latest auction winners</Text>
          </View>
 
          <TouchableOpacity activeOpacity={0.85} onPress={onRefreshPress}>
            <Animated.View style={[styles.refreshButton, { transform: [{ rotate: spin }] }]}>
              <Text style={styles.refreshIcon}>⟳</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
 
      {/* Content */}
      <View style={styles.contentWrap}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.errorText}>❌ {error}</Text>
        ) : displayedBids.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="car-outline" size={80} color="#a9acd6" />
            <Text style={styles.emptyTitle}>No final bids</Text>
            <Text style={styles.emptySub}>Try refreshing or check back later.</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayedBids}
            keyExtractor={item => item.finalBidId.toString()}
            renderItem={renderBidCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        )}
      </View>
 
      {/* Floating Scroll Button */}
      {showScrollButton && displayedBids.length > 0 && (
        <TouchableOpacity style={styles.scrollButton} onPress={scrollToBottom}>
          <Icon name="arrow-down" size={24} color="#fff" />
        </TouchableOpacity>
      )}
 
      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <Animated.View style={[styles.modalOverlay, { opacity: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  { scale: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Car Details</Text>
            </View>
 
            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedBid ? (
                <>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Car ID</Text>
                    <Text style={styles.modalValue}>#{selectedBid.bidCarId}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Winning Price</Text>
                    <Text style={[styles.modalValue, { color: COLORS.primary, fontWeight: '700' }]}>
                      ₹{selectedBid.price.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Buyer Dealer ID</Text>
                    <Text style={styles.modalValue}>{selectedBid.buyerDealerId}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Seller Dealer ID</Text>
                    <Text style={styles.modalValue}>{selectedBid.sellerDealerId ?? 'N/A'}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalLabel}>Beading Car ID</Text>
                    <Text style={styles.modalValue}>{selectedBid.beadingCarId ?? 'N/A'}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.modalValue}>No details available.</Text>
              )}
            </ScrollView>
 
            <Pressable style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};
 
export default AddOnsScreen;
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  header: {
    paddingBottom: 10,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    elevation: 8,
    backgroundColor: COLORS.white,
    shadowColor: '#64748B',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  headerTitle: { 
    fontSize: 20, 
    color: COLORS.primary, 
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  
  contentWrap: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 96 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 6,
    shadowColor: '#64748B',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
  },
  cardHeader: {
    backgroundColor: COLORS.primary,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carIdText: { color: COLORS.secondary, fontSize: 11, fontWeight: '700' },
  carIdNumber: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 },
  priceLabel: { color: COLORS.secondary, fontSize: 12 },
  priceValue: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 4 },
  cardBody: { padding: 12, backgroundColor: '#FBFDFF' },
  detailRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEF2FF',
  },
  smallLabel: { fontSize: 13, color: COLORS.textGray, fontWeight: '600' },
  smallValue: { fontSize: 13, color: COLORS.textDark, fontWeight: '700' },
  scrollButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: COLORS.primary,
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#64748B',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.primary, marginTop: 8 },
  emptySub: { fontSize: 13, color: '#777', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(4,6,10,0.45)', alignItems: 'center', justifyContent: 'center' },
  modalContainer: { width: width * 0.94, backgroundColor: COLORS.white, borderRadius: 18, overflow: 'hidden' },
  modalHeader: { paddingVertical: 14, alignItems: 'center', backgroundColor: COLORS.primary },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modalContent: { paddingHorizontal: 18, paddingVertical: 16 },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E6EEF8',
  },
  modalLabel: { fontSize: 14, color: COLORS.textGray, fontWeight: '700' },
  modalValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '600' },
  closeButton: {
    margin: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
});