// src/screens/Home/HomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const categories = ['PA Recommended', 'Service History', 'BMW X1', 'HONDA'];
const cars = [
  {
    id: '1',
    name: 'AC',
    year: 2005,
    model: '800',
    km: 71076,
    owner: '1st owner',
    fuel: 'Petrol',
    location: 'Mumbai • MH-01',
    engine: '1.0',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Maruti_800.jpg',
    isScrap: true,
    highestBid: '01:25:37',
  },
  // Add more car objects here
];

const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Top Search Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.location}>
          <Text style={styles.locationText}>MH</Text>
          <Ionicons name="chevron-down-outline" size={16} color="#000" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Make, model, year, Appt. id"
        />
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyText}>Buy Basic</Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Get used car loan for your customers
          </Text>
          <TouchableOpacity style={styles.exploreButton}>
            <Text style={styles.exploreText}>Explore →</Text>
          </TouchableOpacity>
          <Image
            source={{
              uri: 'https://upload.wikimedia.org/wikipedia/commons/7/79/2018_Volkswagen_Polo_GT_front.jpg',
            }}
            style={styles.bannerImage}
          />
        </View>
      </ScrollView>

      {/* Filter and Sort */}
      <View style={styles.filterSort}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={20} />
          <Text>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="swap-vertical-outline" size={20} />
          <Text>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tags */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat, index) => (
          <TouchableOpacity key={index} style={styles.categoryButton}>
            <Text>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Live Cars List */}
      <Text style={styles.sectionTitle}>Live cars</Text>
      <FlatList
        data={cars}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.carCard}>
            <Image source={{uri: item.image}} style={styles.carImage} />
            {item.isScrap && (
              <View style={styles.scrapBadge}>
                <Text style={styles.scrapText}>SCRAP CAR</Text>
              </View>
            )}
            <View style={styles.carDetails}>
              <Text style={styles.locationText}>{item.location}</Text>
              <Text style={styles.carName}>
                {item.year} {item.model}
              </Text>
              <Text>
                {item.km.toLocaleString()} km • {item.owner} • {item.fuel}
              </Text>
              <Text>Engine {item.engine}</Text>
              <Text>Highest Bid: {item.highestBid}</Text>
            </View>
          </View>
        )}
      />

      {/* Low Account Balance */}
      <View style={styles.lowBalance}>
        <Text style={styles.lowBalanceText}>
          Low Account Balance. Deposit Rs. 10000 to continue bidding.
        </Text>
      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', paddingTop: 40},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  locationText: {fontWeight: 'bold'},
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  buyButton: {
    marginLeft: 10,
    backgroundColor: '#dcdcff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buyText: {color: '#4b4bff'},
  banner: {
    flexDirection: 'row',
    backgroundColor: '#4b4bff',
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  bannerText: {color: '#fff', flex: 1, fontWeight: 'bold'},
  exploreButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  exploreText: {color: '#4b4bff'},
  bannerImage: {width: 80, height: 50, resizeMode: 'contain'},
  filterSort: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  filterButton: {flexDirection: 'row', alignItems: 'center'},
  sortButton: {flexDirection: 'row', alignItems: 'center'},
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  sectionTitle: {fontWeight: 'bold', fontSize: 18, margin: 10},
  carCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
  },
  carImage: {width: '100%', height: 150},
  scrapBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff4d4d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scrapText: {color: '#fff', fontSize: 12, fontWeight: 'bold'},
  carDetails: {padding: 10},
  carName: {fontWeight: 'bold', fontSize: 16, marginVertical: 4},
  lowBalance: {backgroundColor: '#ff4d4d', padding: 10, alignItems: 'center'},
  lowBalanceText: {color: '#fff', textAlign: 'center'},
});
