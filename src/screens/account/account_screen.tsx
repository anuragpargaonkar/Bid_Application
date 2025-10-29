// src/screens/AccountScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Easing,
  Alert,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

const AccountScreen = ({ navigation }: any) => {
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [dealerData, setDealerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  // ---------- JWT ----------
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT Parse Error:', error);
      return null;
    }
  };

  // ---------- FETCH DEALER ----------
  const fetchDealerData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        Alert.alert('Error', 'Missing authentication token.');
        setLoading(false);
        return;
      }

      const decoded = parseJwt(token);
      const dealerId = decoded?.dealerId;
      if (!dealerId) {
        Alert.alert('Error', 'Dealer ID not found in token.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://caryanamindia.prodchunca.in.net/dealer/${dealerId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      const json = await response.json();
      if (response.ok && json?.dealerDto) {
        setDealerData(json.dealerDto);
      } else {
        Alert.alert('Error', json?.exception || 'Failed to load dealer data.');
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error);
      Alert.alert('Error', 'Unable to fetch dealer data.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- MODAL ----------
  const openModal = () => {
    setModalVisible(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  // ---------- LOGOUT (shared) ----------
  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(TOKEN_KEY);
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  // ---------- EFFECTS ----------
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    fetchDealerData();
  }, []);

  // ---------- RENDER ----------
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.subTitle}>Manage your account</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={confirmLogout}
            activeOpacity={0.85}>
            <Image
              source={require('../../assets/images/image.png')}
              style={styles.logoutIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Top Banner */}
        <View style={styles.topBanner}>
          <Text style={styles.topBannerText}>Get unlimited app access</Text>
          <Text style={styles.topBannerSub}>
            Buy <Text style={styles.highlight}>Basic</Text> at just ₹500 / month
          </Text>
          <TouchableOpacity style={{ marginTop: 8 }}>
            <Text style={styles.knowMore}>Know more</Text>
          </TouchableOpacity>
        </View>

        {/* PROFILE CARD */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.profileCard}
          onPress={openModal}>
          <Ionicons name="person-circle-outline" size={64} color="#262A4F" />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>
              {dealerData
                ? `${dealerData.firstName} ${dealerData.lastName || ''}`
                : loading
                ? 'Loading...'
                : 'Name not available'}
            </Text>
            <Text style={styles.profileDetails}>
              {dealerData?.mobileNo ||
                (loading ? 'Loading...' : 'Mobile not available')}
            </Text>
            <Text style={styles.profileDetails}>
              Shop:{' '}
              {dealerData?.shopName || (loading ? 'Loading...' : '—')}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color="#A9ACD6" />
        </TouchableOpacity>

        {/* TWO CARDS */}
        <View style={styles.twoCards}>
          <View style={styles.bigCard}>
            <Ionicons name="wallet-outline" size={34} color="#262A4F" />
            <Text style={styles.bigCardTitle}>Payment details</Text>
            <TouchableOpacity style={styles.rechargeBtn}>
              <Text style={styles.bigRechargeText}>₹0 | RECHARGE NOW</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.bigAccentLink}>Recharge more</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bigCard}>
            <Ionicons name="person-outline" size={34} color="#262A4F" />
            <Text style={styles.bigCardTitle}>Sales agent</Text>
            <Text style={styles.bigCardSub}>Organic Mumbai</Text>
            <TouchableOpacity style={{ marginTop: 'auto' }}>
              <Text style={styles.bigAccentLink}>Call agent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* STORY BANNER */}
        <View style={styles.storyBanner}>
          <Text style={styles.storyText}>
            Your stories now have a new destination
          </Text>
          <Text style={styles.bigCardSub}>Follow Caryanam Partners</Text>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* DO NOT DISTURB */}
        <View style={styles.largeListItem}>
          <View style={styles.listTextContainer}>
            <View style={styles.listIconText}>
              <Ionicons name="moon-outline" size={24} color="#262A4F" />
              <Text style={styles.largeListTitle}> Do not disturb</Text>
            </View>
            <Text style={styles.listSubAligned}>
              Pause calls from Caryanam team
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#ccc', true: '#A9ACD6' }}
            thumbColor={doNotDisturb ? '#262A4F' : '#f4f3f4'}
            value={doNotDisturb}
            onValueChange={setDoNotDisturb}
            style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
          />
        </View>

        {/* REWARDS */}
        <TouchableOpacity style={styles.largeListItem}>
          <View style={styles.listTextContainer}>
            <View style={styles.listIconText}>
              <Ionicons name="cash-outline" size={24} color="#262A4F" />
              <Text style={styles.largeListTitle}> Caryanam Rewards</Text>
            </View>
            <Text style={styles.listSubAligned}>View your Rewards</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color="#A9ACD6" />
        </TouchableOpacity>

        {/* NEW LOGOUT ITEM – placed at the very bottom */}
        <TouchableOpacity
          style={[styles.largeListItem, styles.logoutListItem]}
          onPress={confirmLogout}>
          <View style={styles.listTextContainer}>
            <View style={styles.listIconText}>
              <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
              <Text style={[styles.largeListTitle, styles.logoutTitle]}>
                {' '}
                Logout
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* PROFILE DETAIL MODAL */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="none"
        onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: modalAnim,
              transform: [
                {
                  scale: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}>
          {loading ? (
            <ActivityIndicator size="large" color="#262A4F" />
          ) : dealerData ? (
            <>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require('../../assets/images/image.png')}
                  style={styles.profileImage}
                  resizeMode="contain"
                />
                <View style={styles.imageButtonRow}>
                  <TouchableOpacity style={styles.addImageButton}>
                    <Text style={styles.addImageText}>ADD IMAGE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteImageButton}>
                    <Text style={styles.deleteImageText}>DELETE IMAGE</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.detailBox}>
                <DetailRow label="First Name" value={dealerData.firstName} />
                <DetailRow label="Last Name" value={dealerData.lastName} />
                <DetailRow label="Mobile Number" value={dealerData.mobileNo} />
                <DetailRow label="Shop Name" value={dealerData.shopName} />
                <DetailRow label="Area" value={dealerData.area} />
                <DetailRow label="Email" value={dealerData.email} />
                <DetailRow label="City" value={dealerData.city} />
                <DetailRow label="Address" value={dealerData.address} />
              </View>

              <TouchableOpacity style={styles.editButton} onPress={closeModal}>
                <Text style={styles.editButtonText}>EDIT PROFILE</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text>No data available.</Text>
          )}
        </Animated.View>
      </Modal>
    </Animated.View>
  );
};

// ---------- DETAIL ROW ----------
const DetailRow = ({ label, value }: any) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || '—'}</Text>
  </View>
);

export default AccountScreen;

// -------------------------------------------------
// ------------------- STYLES ----------------------
// -------------------------------------------------
const COLORS = {
  primary: '#262a4f',
  secondary: '#a9acd6',
  background: '#f5f6fa',
  white: '#FFFFFF',
  textDark: '#0F172A',
  textGray: '#374151',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollArea: { flex: 1 },

  /* Header */
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
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  subTitle: { color: COLORS.secondary, fontSize: 12, marginTop: 2 },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: { width: 22, height: 22 },

  /* Top Banner */
  topBanner: {
    backgroundColor: '#A9ACD6',
    marginHorizontal: 14,
    marginTop: 16,
    paddingVertical: 26,
    paddingHorizontal: 22,
    borderRadius: 16,
  },
  topBannerText: {
    fontSize: 17,
    color: '#262A4F',
    marginBottom: 4,
    fontWeight: '500',
  },
  topBannerSub: { fontSize: 16, color: '#000', fontWeight: '600' },
  highlight: { color: '#262A4F', fontWeight: '700' },
  knowMore: { color: '#262A4F', fontSize: 15, fontWeight: '600' },

  /* Profile Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 16,
    padding: 18,
    borderRadius: 16,
    elevation: 3,
  },
  profileText: { flex: 1, marginLeft: 12 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#262A4F' },
  profileDetails: { fontSize: 14, color: '#555', marginTop: 2 },

  /* Two Cards */
  twoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginTop: 18,
  },
  bigCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    elevation: 2,
    borderColor: '#A9ACD6',
    borderWidth: 1,
  },
  bigCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginVertical: 8,
    color: '#262A4F',
  },
  bigCardSub: { fontSize: 15, color: '#555', marginBottom: 12 },
  rechargeBtn: {
    backgroundColor: '#262A4F',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  bigRechargeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  bigAccentLink: { color: '#262A4F', fontSize: 15, fontWeight: '600' },

  /* Story Banner */
  storyBanner: {
    backgroundColor: '#E6E7F3',
    marginHorizontal: 14,
    marginTop: 18,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
  },
  storyText: {
    fontSize: 18,
    color: '#262A4F',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  followBtn: {
    backgroundColor: '#262A4F',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 28,
    marginTop: 10,
  },
  followText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  /* List Items (Do Not Disturb, Rewards, Logout) */
  largeListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderRadius: 14,
    borderColor: '#A9ACD6',
    borderWidth: 1,
  },
  listTextContainer: { flexDirection: 'column', flex: 1 },
  listIconText: { flexDirection: 'row', alignItems: 'center' },
  largeListTitle: { fontSize: 17, fontWeight: '600', color: '#262A4F' },
  listSubAligned: { fontSize: 13, color: '#555', marginTop: 4, marginLeft: 28 },

  /* Logout List Item – special colour */
  logoutListItem: {
    marginTop: 20,
    borderColor: '#FFB4B4',
  },
  logoutTitle: { color: '#D32F2F' },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    position: 'absolute',
    top: '15%',
    left: '5%',
    right: '5%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    elevation: 10,
  },
  profileImageContainer: { alignItems: 'center', marginBottom: 16 },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
  },
  imageButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 10,
  },
  addImageButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  deleteImageButton: {
    backgroundColor: '#FFB4B4',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  addImageText: { color: '#fff', fontWeight: '600' },
  deleteImageText: { color: '#fff', fontWeight: '600' },

  detailBox: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#262A4F',
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    color: '#555',
    maxWidth: '60%',
    textAlign: 'right',
  },

  editButton: {
    backgroundColor: '#262A4F',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});