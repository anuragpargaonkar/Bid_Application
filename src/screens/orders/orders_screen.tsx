import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
 
const {width, height} = Dimensions.get('window');
const scale = width / 375; // base iPhone width for scaling
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
 
// ✅ Define your navigation route types
type RootStackParamList = {
  Home: undefined;
  Main: {screen: string} | undefined;
  Orders: undefined;
};
 
const OrderScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
 
  const [mainTab, setMainTab] = useState<
    'InNegotiation' | 'Procured' | 'RCTransfer'
  >('InNegotiation');
 
  const [subTab, setSubTab] = useState<'InNego' | 'Lost'>('InNego');
 
  const renderContent = () => {
    if (mainTab === 'InNegotiation') {
      if (subTab === 'InNego') {
        return (
          <View style={styles.emptyStateContainer}>
            <Image
              source={require('../../assets/images/car4.png')}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.title}>Nothing to see here</Text>
            <Text style={styles.subtitle}>
              Go back to home to participate in auctions
            </Text>
 
            {/* ✅ Updated Home button navigation */}
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => {
                try {
                  navigation.navigate('Home');
                } catch {
                  navigation.navigate('Main', {screen: 'Home'});
                }
              }}>
              <Text style={styles.homeButtonText}>Home</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <ScrollView style={{padding: responsive(16)}}>
            {lostCars.map(car => (
              <View key={car.id} style={styles.card}>
                <Text style={styles.lostDate}>LOST ON {car.date}</Text>
                <View style={styles.cardContent}>
                  <Image
                    source={car.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={{flex: 1, paddingLeft: responsive(10)}}>
                    <Text style={styles.carTitle}>{car.name}</Text>
                    <Text style={styles.carPrice}>{car.price}</Text>
                    <Text style={styles.carId}>Appt.ID- {car.id}</Text>
                  </View>
                </View>
              </View>
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
          <Text style={styles.title}>No data available</Text>
        </View>
      );
    }
  };
 
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>
 
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
 
      {mainTab === 'InNegotiation' && (
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
      )}
 
      {renderContent()}
    </View>
  );
};
 
export default OrderScreen;
 
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    fontSize: responsive(18),
    fontWeight: '600',
    marginVertical: responsive(10),
    marginLeft: responsive(16),
  },
  headerTitle: {
    fontSize: responsive(20),
    fontWeight: 'bold',
    color: '#000',
    marginRight: responsive(20),
  },
  mainTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: responsive(10),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  mainTabButton: {
    paddingVertical: responsive(8),
    paddingHorizontal: responsive(12),
  },
  mainTabText: {fontSize: responsive(16), color: '#555'},
  activeMainTab: {borderBottomWidth: 2, borderBottomColor: '#007AFF'},
  activeMainTabText: {color: '#007AFF', fontWeight: 'bold'},
 
  subTabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: responsive(10),
    borderWidth: 1,
    borderColor: '#f0a500',
    borderRadius: responsive(8),
    overflow: 'hidden',
  },
  subTabButton: {
    paddingVertical: responsive(6),
    paddingHorizontal: responsive(20),
    backgroundColor: '#fff',
  },
  subTabText: {color: '#555', fontSize: responsive(14)},
  activeSubTab: {backgroundColor: '#FFE5D1'},
  activeSubTabText: {color: '#FF7F50', fontWeight: 'bold'},
 
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsive(20),
  },
  image: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: responsive(20),
  },
  title: {fontSize: responsive(18), fontWeight: '600', marginBottom: responsive(8)},
  subtitle: {
    fontSize: responsive(14),
    color: '#888',
    textAlign: 'center',
    marginBottom: responsive(10),
  },
  homeButton: {
    backgroundColor: '#FFE5D1',
    paddingHorizontal: responsive(30),
    paddingVertical: responsive(10),
    borderRadius: responsive(6),
  },
  homeButtonText: {
    color: '#FF7F50',
    fontWeight: 'bold',
    fontSize: responsive(16),
  },
 
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: responsive(8),
    marginBottom: responsive(16),
    padding: responsive(10),
  },
  lostDate: {
    fontSize: responsive(12),
    color: '#FF7F7F',
    marginBottom: responsive(6),
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
  },
  cardImage: {
    width: responsive(80),
    height: responsive(60),
    borderRadius: responsive(4),
  },
  carTitle: {fontSize: responsive(15), fontWeight: '600'},
  carPrice: {color: '#000', marginVertical: responsive(4)},
  carId: {fontSize: responsive(12), color: '#666'},
 
  procuredContainer: {
    flex: 1,
    padding: responsive(16),
  },
  procuredBox: {
    backgroundColor: '#fff',
    borderRadius: responsive(12),
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    marginBottom: responsive(20),
  },
  procuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: responsive(14),
    paddingHorizontal: responsive(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  procuredRowHighlight: {
    backgroundColor: '#EAF4FF',
    borderBottomWidth: 0,
  },
  procuredLabel: {
    fontSize: responsive(14),
    color: '#333',
  },
  procuredAmount: {
    fontWeight: 'bold',
    color: '#000',
  },
  disabledRefreshButton: {
    marginTop: responsive(20),
    backgroundColor: '#e0e0e0',
    paddingVertical: responsive(10),
    paddingHorizontal: responsive(20),
    borderRadius: responsive(6),
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledRefreshText: {
    color: '#888',
    fontWeight: '600',
  },
});