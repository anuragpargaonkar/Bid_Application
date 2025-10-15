// src/screens/Home/AddOnsScreen.tsx
 
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
interface FinalBid {
  finalBidId: number;
  bidCarId: number;
  price: number;
  buyerDealerId: number;
  sellerDealerId: number | null;
  beadingCarId: number | null;
}
 
const AddOnsScreen: React.FC = () => {
  const [finalBids, setFinalBids] = useState<FinalBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    fetchFinalBids();
  }, []);
 
  const fetchFinalBids = async () => {
    try {
      setLoading(true);
      setError(null);
 
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token found');
 
      const response = await fetch(
        'https://caryanamindia.prodchunca.in.net/Bid/finalBids',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
 
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
 
      const json = await response.json();
      console.log('🏁 Winning cars raw:', json);
 
      const bids = json.finalBids || [];
      setFinalBids(bids);
    } catch (err: any) {
      console.error('❌ Error fetching final bids:', err);
      setError(err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };
 
  const renderBidCard = ({item}: {item: FinalBid}) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.carIdText}>🚗 Car ID: {item.bidCarId}</Text>
        <Text style={styles.priceText}>₹{item.price}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}>🧑 Buyer Dealer ID: {item.buyerDealerId}</Text>
        <Text style={styles.infoText}>
          🧑‍💼 Seller Dealer ID: {item.sellerDealerId ?? 'N/A'}
        </Text>
      </View>
    </View>
  );
 
  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>🏁 Final Bids</Text>
 
      <TouchableOpacity style={styles.refreshButton} onPress={fetchFinalBids}>
        <Text style={styles.refreshText}>🔄 Refresh</Text>
      </TouchableOpacity>
 
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>❌ {error}</Text>
      ) : finalBids.length === 0 ? (
        <Text style={styles.emptyText}>📭 No final bids available.</Text>
      ) : (
        <>
          <Text style={styles.countText}>Found: {finalBids.length} entries</Text>
          <FlatList
            data={finalBids}
            keyExtractor={(item) => item.finalBidId.toString()}
            renderItem={renderBidCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};
 
export default AddOnsScreen;
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  refreshButton: {
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 20,
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
  },
  countText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  carIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
});
 
 