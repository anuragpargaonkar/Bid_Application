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
  Linking,
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

      const dealerRes = await fetch(
        `https://caryanamindia.prodchunca.in.net/dealer/${dealerId}`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        },
      );

      const dealerJson = await dealerRes.json();
      if (dealerRes.ok && dealerJson?.dealerDto) setDealerData(dealerJson.dealerDto);

      const photoRes = await fetch(
        `https://caryanamindia.prodchunca.in.net/ProfilePhoto/getbyuserid?userId=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (photoRes.ok) {
        const blob = await photoRes.blob();
        const imageUrl = URL.createObjectURL(blob);
        setPhotoUrl(imageUrl);
      } else setPhotoUrl(null);
    } catch (error) {
      console.error('Error fetching dealer data:', error);
      Alert.alert('Error', 'Unable to fetch dealer data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return Alert.alert('Error', 'Missing token.');
      const decoded = parseJwt(token);
      const userId = decoded?.userId;

      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
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
        `https://caryanamindia.prodchunca.in.net/ProfilePhoto/add?userId=${userId}`,
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
      } else Alert.alert('Error', 'Failed to upload photo.');
    } catch (error) {
      console.error('Add image error:', error);
      Alert.alert('Error', 'Could not upload photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return Alert.alert('Error', 'Missing token.');
      const decoded = parseJwt(token);
      const userId = decoded?.userId;

      setLoading(true);
      const res = await fetch(
        `https://caryanamindia.prodchunca.in.net/ProfilePhoto/deletebyuserid?userId=${userId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.ok) {
        setPhotoUrl(null);
        Alert.alert('Deleted', 'Profile photo removed successfully.');
      } else Alert.alert('Error', 'Failed to delete photo.');
    } catch (error) {
      console.error('Delete image error:', error);
      Alert.alert('Error', 'Could not delete photo.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(modalAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setModalVisible(false),
    );
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            navigation.replace('Login');
          } catch {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    fetchDealerData();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/images/logo1.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.subTitle}>Manage your account</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} activeOpacity={0.85}>
            <Image
              source={require('../../assets/images/image.png')}
              style={styles.logoutIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.topBanner}>
          <Text style={styles.topBannerText}>Get unlimited app access</Text>
          <Text style={styles.topBannerSub}>
            Buy <Text style={styles.highlight}>Basic</Text> at just ₹500 / month
          </Text>
          <TouchableOpacity style={{ marginTop: 8 }}>
            <Text style={styles.knowMore}>Know more</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.profileCard} onPress={openModal}>
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
              {dealerData?.mobileNo || (loading ? 'Loading...' : 'Mobile not available')}
            </Text>
            <Text style={styles.profileDetails}>
              Shop: {dealerData?.shopName || (loading ? 'Loading...' : '—')}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color="#A9ACD6" />
        </TouchableOpacity>

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

        <View style={styles.storyBanner}>
          <Text style={styles.storyText}>Your stories now have a new destination</Text>
          <Text style={styles.bigCardSub}>Follow Caryanam Partners</Text>

          {/* SOCIAL ICONS */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => Linking.openURL('mailto:info@caryanam.in')}>
              <Ionicons name="mail-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => Linking.openURL('https://www.instagram.com/caryanamindia_/')}>
              <Ionicons name="logo-instagram" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() =>
                Linking.openURL('https://www.facebook.com/p/CaryanamIndia-61564972127778/')
              }>
              <Ionicons name="logo-facebook" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Do not disturb</Text>
          <Switch value={doNotDisturb} onValueChange={setDoNotDisturb} thumbColor="#262A4F" />
        </View>

        <TouchableOpacity style={styles.rewardsCard}>
          <Ionicons name="gift-outline" size={28} color="#262A4F" />
          <Text style={styles.rewardsText}>My rewards</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutCard} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={28} color="#262A4F" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalBackdrop}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  opacity: modalAnim,
                  transform: [
                    {
                      translateY: modalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}>
              <Text style={styles.modalTitle}>Profile Photo</Text>
              <TouchableOpacity onPress={handleAddImage}>
                <Text style={styles.modalOption}>Add / Change Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteImage}>
                <Text style={styles.modalOption}>Delete Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#262A4F" />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FB' },
  header: { paddingHorizontal: 20, paddingTop: 20 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    backgroundColor: 'transparent',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    backgroundColor: '#051A2F',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: 40, height: 40, borderRadius: 12 },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#262A4F' },
  subTitle: { fontSize: 12, color: '#8C91C1' },
  logoutButton: { padding: 4 },
  logoutIcon: { width: 30, height: 20 },
  scrollArea: { marginTop: 20 },
  topBanner: {
    backgroundColor: '#262A4F',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  topBannerText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  topBannerSub: { color: '#E5E7FF', fontSize: 13, marginTop: 4 },
  highlight: { color: '#FFD700' },
  knowMore: { color: '#61AFFE', fontSize: 13 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
  profileText: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: '#262A4F' },
  profileDetails: { fontSize: 13, color: '#8C91C1', marginTop: 2 },
  twoCards: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20 },
  bigCard: {
    backgroundColor: '#fff',
    flex: 0.48,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  bigCardTitle: { fontSize: 15, fontWeight: '600', color: '#262A4F', marginTop: 8 },
  bigCardSub: { color: '#8C91C1', fontSize: 13, marginTop: 4 },
  rechargeBtn: {
    backgroundColor: '#262A4F',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  bigRechargeText: { color: '#fff', textAlign: 'center', fontSize: 13 },
  bigAccentLink: { color: '#61AFFE', fontSize: 13, marginTop: 6 },
  storyBanner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  storyText: { fontSize: 15, fontWeight: '600', color: '#262A4F' },
  socialRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  socialIcon: {
    backgroundColor: '#262A4F',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  settingsTitle: { fontSize: 15, fontWeight: '600', color: '#262A4F' },
  rewardsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 20,
    alignItems: 'center',
    elevation: 2,
  },
  rewardsText: { marginLeft: 10, fontSize: 15, color: '#262A4F', fontWeight: '500' },
  logoutCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 20,
    alignItems: 'center',
    elevation: 2,
  },
  logoutText: { marginLeft: 10, fontSize: 15, color: '#262A4F', fontWeight: '500' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 40,
    padding: 20,
    borderRadius: 16,
    elevation: 5,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#262A4F', marginBottom: 12 },
  modalOption: { fontSize: 14, color: '#61AFFE', marginVertical: 6 },
  modalCancel: { fontSize: 14, color: '#FF3B30', marginTop: 10 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AccountScreen;
