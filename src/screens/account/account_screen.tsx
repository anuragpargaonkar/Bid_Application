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
import { launchImageLibrary } from 'react-native-image-picker';

const TOKEN_KEY = 'auth_token';

const AccountScreen = ({ navigation }: any) => {
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [dealerData, setDealerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  // ---------- JWT PARSE ----------
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

  // ---------- FETCH DEALER + PHOTO ----------
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
      const userId = decoded?.userId;
      if (!dealerId || !userId) {
        Alert.alert('Error', 'User or Dealer ID not found.');
        setLoading(false);
        return;
      }

      // Dealer info
      const dealerRes = await fetch(
        `https://caryanamindia.prodchunca.in.net/dealer/${dealerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      const dealerJson = await dealerRes.json();
      if (dealerRes.ok && dealerJson?.dealerDto) {
        setDealerData(dealerJson.dealerDto);
      }

      // Profile photo
      const photoRes = await fetch(
        `https://caryanamindia.prodchunca.in.net/ProfilePhoto/getbyuserid?userId=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (photoRes.ok) {
        const blob = await photoRes.blob();
        const imageUrl = URL.createObjectURL(blob);
        setPhotoUrl(imageUrl);
      } else {
        setPhotoUrl(null);
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error);
      Alert.alert('Error', 'Unable to fetch dealer data.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- ADD IMAGE ----------
  const handleAddImage = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return Alert.alert('Error', 'Missing token.');
      const decoded = parseJwt(token);
      const userId = decoded?.userId;

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel || !result.assets?.length) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.fileName || 'photo.jpg',
        type: file.type || 'image/jpeg',
      } as any);

      setLoading(true);
      const res = await fetch(
        `http://caryanamindia.prodchunca.in.net/ProfilePhoto/add?userId=${userId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        },
      );

      if (res.ok) {
        Alert.alert('Success', 'Profile photo added successfully.');
        fetchDealerData();
      } else {
        Alert.alert('Error', 'Failed to upload photo.');
      }
    } catch (error) {
      console.error('Add image error:', error);
      Alert.alert('Error', 'Could not upload photo.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- DELETE IMAGE ----------
  const handleDeleteImage = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return Alert.alert('Error', 'Missing token.');
      const decoded = parseJwt(token);
      const userId = decoded?.userId;

      setLoading(true);
      const res = await fetch(
        `http://caryanamindia.prodchunca.in.net/ProfilePhoto/deletebyuserid?userId=${userId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        setPhotoUrl(null);
        Alert.alert('Deleted', 'Profile photo removed successfully.');
      } else {
        Alert.alert('Error', 'Failed to delete photo.');
      }
    } catch (error) {
      console.error('Delete image error:', error);
      Alert.alert('Error', 'Could not delete photo.');
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

  // ---------- LOGOUT ----------
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

  // ---------- EFFECT ----------
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    fetchDealerData();
  }, []);

  // ---------- UI ----------
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
        {/* TOP BANNER */}
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
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.profileAvatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={64} color="#262A4F" />
          )}
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

        {/* LOGOUT */}
        <TouchableOpacity
          style={[styles.largeListItem, styles.logoutListItem]}
          onPress={confirmLogout}>
          <View style={styles.listTextContainer}>
            <View style={styles.listIconText}>
              <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
              <Text style={[styles.largeListTitle, styles.logoutTitle]}>
                Logout
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* PROFILE DETAIL MODAL */}
      <Modal transparent visible={modalVisible} onRequestClose={closeModal}>
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
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={120}
                    color="#ccc"
                  />
                )}
                <View style={styles.imageButtonRow}>
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={handleAddImage}>
                    <Text style={styles.addImageText}>ADD IMAGE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteImageButton}
                    onPress={handleDeleteImage}>
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
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollArea: { flex: 1 },
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
    fontWeight: '600',
  },
  topBannerSub: { fontSize: 14, color: '#333' },
  highlight: { color: '#262A4F', fontWeight: '700' },
  knowMore: {
    color: '#262A4F',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginTop: 18,
    marginHorizontal: 14,
    padding: 14,
    borderRadius: 16,
    elevation: 3,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 10,
  },
  profileText: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: '#262A4F' },
  profileDetails: { color: '#666', fontSize: 13 },
  twoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginHorizontal: 14,
  },
  bigCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    elevation: 3,
    marginHorizontal: 4,
  },
  bigCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262A4F',
    marginTop: 10,
  },
  bigCardSub: { fontSize: 13, color: '#666', marginTop: 4 },
  rechargeBtn: { marginTop: 10 },
  bigRechargeText: {
    color: '#262A4F',
    fontWeight: '700',
    fontSize: 13,
  },
  bigAccentLink: {
    color: '#A9ACD6',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 8,
  },
  storyBanner: {
    backgroundColor: COLORS.white,
    marginTop: 20,
    marginHorizontal: 14,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
  },
  storyText: { fontSize: 15, fontWeight: '600', color: '#262A4F' },
  followBtn: {
    marginTop: 8,
    backgroundColor: '#262A4F',
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 18,
  },
  followText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  largeListItem: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 16,
    elevation: 3,
  },
  listTextContainer: { flex: 1 },
  listIconText: { flexDirection: 'row', alignItems: 'center' },
  largeListTitle: { fontSize: 15, color: '#262A4F', fontWeight: '600' },
  listSubAligned: { color: '#666', fontSize: 13, marginLeft: 28 },
  logoutListItem: { marginTop: 20 },
  logoutTitle: { color: '#D32F2F' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    elevation: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  imageButtonRow: { flexDirection: 'row', gap: 8 },
  addImageButton: {
    backgroundColor: '#262A4F',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addImageText: { color: '#fff', fontWeight: '600' },
  deleteImageButton: {
    backgroundColor: '#ccc',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteImageText: { color: '#000', fontWeight: '600' },
  detailBox: {
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: { fontWeight: '600', color: '#262A4F' },
  detailValue: { color: '#333' },
  editButton: {
    marginTop: 14,
    backgroundColor: '#262A4F',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: { color: '#fff', fontWeight: '700' },
});
