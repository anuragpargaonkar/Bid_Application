// src/screens/OrderScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const scale = width / 375;
const responsive = (size: number) => Math.round(size * scale);

const lostCars = [
  {
    id: '10695486765',
    date: '21-08-2025',
    name: '2004 QUALIS GS G4',
    price: '₹ 1,41,000',
    image: require('../../assets/images/car1.png'),
  },
  {
    id: '10601821706',
    date: '01-03-2025',
    name: '2012 Vento COMFORTLINE 1.6',
    price: '₹ 1,96,000',
    image: require('../../assets/images/car2.png'),
  },
  {
    id: '12584789725',
    date: '08-05-2024',
    name: '2012 A Star VXI (ABS) AT',
    price: '₹ 1,44,600',
    image: require('../../assets/images/car3.png'),
  },
  {
    id: '10319486766',
    date: '27-04-2024',
    name: '2015 Wagon R Stingray VXI',
    price: '₹ 2,76,600',
    image: require('../../assets/images/car4.png'),
  },
];

type RootStackParamList = {
  Home: undefined;
  Main: { screen: string } | undefined;
  Orders: undefined;
};

const OrderScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [mainTab, setMainTab] = useState<
    'InNegotiation' | 'Procured' | 'RCTransfer'
  >('InNegotiation');

  const [subTab, setSubTab] = useState<'InNego' | 'Lost'>('InNego');

  // Refresh animation (same as WinZone)
  const refreshSpin = React.useRef(new Animated.Value(0)).current;

  const onRefreshPress = () => {
    refreshSpin.setValue(0);
    Animated.timing(refreshSpin, {
      toValue: 1,
      duration: 700,
      easing: Easing.inOut(Easing.linear),
      useNativeDriver: true,
    }).start(() => refreshSpin.setValue(0));
    // Add your refresh logic here
  };

  const spin = refreshSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderContent = () => {
    if (mainTab === 'InNegotiation') {
      if (subTab === 'InNego') {
        return (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="car-outline" size={80} color="#a9acd6" />
            <Text style={styles.title}>Nothing to see here</Text>
            <Text style={styles.subtitle}>
              Go back to home to participate in auctions
            </Text>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => {
                try {
                  navigation.navigate('Home');
                } catch {
                  navigation.navigate('Main', { screen: 'Home' });
                }
              }}>
              <Text style={styles.homeButtonText}>Home</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <ScrollView style={{ padding: responsive(16) }}>
            {lostCars.map(car => (
              <Animated.View key={car.id} style={styles.card}>
                <Text style={styles.lostDate}>LOST ON {car.date}</Text>
                <View style={styles.cardContent}>
                  <Image
                    source={car.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, paddingLeft: responsive(10) }}>
                    <Text style={styles.carTitle}>{car.name}</Text>
                    <Text style={styles.carPrice}>{car.price}</Text>
                    <Text style={styles.carId}>Appt.ID- {car.id}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        );
      }
    } else if (mainTab === 'Procured') {
      return (
        <View style={styles.procuredContainer}>
          <View style={styles.procuredBox}>
            <View style={styles.procuredRow}>
              <Text style={styles.procuredLabel}>Total Payable</Text>
              <Text style={styles.procuredAmount}>₹ 0</Text>
            </View>
            <View style={styles.procuredRow}>
              <Text style={styles.procuredLabel}>Account Balance</Text>
              <Text style={styles.procuredAmount}>₹ 0</Text>
            </View>
            <View style={[styles.procuredRow, styles.procuredRowHighlight]}>
              <Text style={styles.procuredLabel}>Pending deposit</Text>
              <Text style={styles.procuredAmount}>₹ 0</Text>
            </View>
          </View>

          <View style={styles.emptyStateContainer}>
            <Text style={styles.subtitle}>
              Oops, you have no procured cars.
            </Text>
            <Text style={styles.subtitle}>Keep Bidding!</Text>
            <TouchableOpacity style={styles.disabledRefreshButton}>
              <Text style={styles.disabledRefreshText}>REFRESH</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="car-outline" size={80} color="#a9acd6" />
          <Text style={styles.title}>No data available</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* WinZone Header – Identical to AddOnsScreen */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Orders</Text>
            <Text style={styles.subTitle}>Track your bids & wins</Text>
          </View>

          <TouchableOpacity activeOpacity={0.85} onPress={onRefreshPress}>
            <Animated.View
              style={[styles.refreshButton, { transform: [{ rotate: spin }] }]}>
              <Text style={styles.refreshIcon}>⟳</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tabs */}
      <View style={styles.mainTabs}>
        {['In Negotiation', 'Procured', 'RC Transfer'].map(tab => {
          const value = tab.replace(' ', '') as
            | 'InNegotiation'
            | 'Procured'
            | 'RCTransfer';
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.mainTabButton,
                mainTab === value && styles.activeMainTab,
              ]}
              onPress={() => setMainTab(value)}>
              <Text
                style={[
                  styles.mainTabText,
                  mainTab === value && styles.activeMainTabText,
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sub Tabs */}
      {mainTab === 'InNegotiation' && (
        <View style={styles.subTabsContainer}>
          <View style={styles.subTabs}>
            {['InNego', 'Lost'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.subTabButton,
                  subTab === tab && styles.activeSubTab,
                ]}
                onPress={() => setSubTab(tab as any)}>
                <Text
                  style={[
                    styles.subTabText,
                    subTab === tab && styles.activeSubTabText,
                  ]}>
                  {tab === 'InNego' ? 'In nego 0' : 'Lost'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {renderContent()}
    </SafeAreaView>
  );
};

export default OrderScreen;

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

  /* ---------- HEADER (Exact WinZone Style) ---------- */
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
  refreshIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },

  /* ---------- MAIN TABS ---------- */
  mainTabs: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 12,
    backgroundColor: '#e9e9f2',
    borderRadius: 30,
    padding: 4,
  },
  mainTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: 'center',
  },
  mainTabText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  activeMainTab: {
    backgroundColor: COLORS.primary,
  },
  activeMainTabText: {
    color: '#fff',
    fontWeight: '700',
  },

  /* ---------- SUB TABS ---------- */
  subTabsContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subTabs: {
    flexDirection: 'row',
    backgroundColor: '#e9e9f2',
    borderRadius: 30,
    padding: 4,
  },
  subTabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  subTabText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  activeSubTab: {
    backgroundColor: COLORS.primary,
  },
  activeSubTabText: {
    color: '#fff',
    fontWeight: '700',
  },

  /* ---------- CONTENT ---------- */
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive(20),
  },
  title: {
    fontSize: responsive(16),
    fontWeight: '600',
    marginTop: responsive(8),
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: responsive(13),
    color: '#777',
    textAlign: 'center',
    marginTop: responsive(4),
  },
  homeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsive(30),
    paddingVertical: responsive(10),
    borderRadius: responsive(25),
    marginTop: responsive(20),
  },
  homeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: responsive(16),
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: responsive(16),
    padding: responsive(10),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lostDate: {
    fontSize: responsive(12),
    color: COLORS.primary,
    marginBottom: responsive(6),
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
  },
  cardImage: {
    width: responsive(80),
    height: responsive(60),
    borderRadius: responsive(8),
  },
  carTitle: { fontSize: responsive(15), fontWeight: '600', color: COLORS.primary },
  carPrice: { color: '#000', marginVertical: responsive(4), fontWeight: '700' },
  carId: { fontSize: responsive(12), color: '#777' },

  procuredContainer: {
    flex: 1,
    padding: responsive(16),
  },
  procuredBox: {
    backgroundColor: '#fff',
    borderRadius: responsive(12),
    overflow: 'hidden',
    marginBottom: responsive(20),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  procuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: responsive(14),
    paddingHorizontal: responsive(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  procuredRowHighlight: {
    backgroundColor: COLORS.secondary,
    borderBottomWidth: 0,
  },
  procuredLabel: {
    fontSize: responsive(14),
    color: COLORS.primary,
  },
  procuredAmount: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  disabledRefreshButton: {
    marginTop: responsive(20),
    backgroundColor: COLORS.primary,
    paddingVertical: responsive(10),
    paddingHorizontal: responsive(20),
    borderRadius: responsive(25),
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledRefreshText: {
    color: '#fff',
    fontWeight: '700',
  },
});