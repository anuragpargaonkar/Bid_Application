import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AccountScreen = () => {
  const [doNotDisturb, setDoNotDisturb] = useState(false);

  return (
    <View style={styles.container}>
      {/* ===== Scrollable Content ===== */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{paddingBottom: 20}}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <Ionicons name="headset-outline" size={28} color="#000" />
        </View>

        {/* Top Banner */}
        <View style={styles.topBanner}>
          <Text style={styles.topBannerText}>Get unlimited app access</Text>
          <Text style={styles.topBannerSub}>
            Buy <Text style={{color: '#4B23A0', fontWeight: '700'}}>Basic</Text>{' '}
            at just ₹500 / month
          </Text>
          <TouchableOpacity style={{marginTop: 6}}>
            <Text style={styles.knowMore}>Know more →</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard}>
          <Ionicons name="person-circle-outline" size={54} color="#6A6A6A" />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>A3 MOTORS</Text>
            <Text style={styles.profileDetails}>7755994123</Text>
            <Text style={styles.profileDetails}>ID: 117103</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={28} color="#666" />
        </TouchableOpacity>

        {/* ===== Payment + Sales agent cards ===== */}
        <View style={styles.twoCards}>
          {/* Payment Card */}
          <View style={styles.bigCard}>
            <Ionicons
              name="wallet-outline"
              size={36}
              color="#000"
              style={{marginBottom: 12}}
            />
            <Text style={styles.bigCardTitle}>Payment details</Text>
            <TouchableOpacity style={styles.rechargeBtn}>
              <Text style={styles.bigRechargeText}>₹0 | RECHARGE NOW</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.bigOrangeLink}>Recharge more →</Text>
            </TouchableOpacity>
          </View>

          {/* Sales Agent Card */}
          <View style={styles.bigCard}>
            <Ionicons
              name="person-outline"
              size={36}
              color="#000"
              style={{marginBottom: 12}}
            />
            <Text style={styles.bigCardTitle}>Sales agent</Text>
            <Text style={styles.bigCardSub}>Organic Mumbai</Text>

            {/* Call agent button at the bottom */}
            <TouchableOpacity style={{marginTop: 'auto'}}>
              <Text style={styles.bigOrangeLink}>📞 Call agent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Story Banner ===== */}
        <View style={styles.storyBanner}>
          <Text style={styles.storyText}>
            Your stories now have a new destination
          </Text>
          <Text style={styles.bigCardSub}>Follow CARS24 Partners </Text>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===== Fixed Bottom Section ===== */}
      <View style={styles.bottomSection}>
        {/* Do not disturb */}
        <View style={styles.largeListItem}>
          <View style={{flexDirection: 'column'}}>
            <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
              <Ionicons
                name="moon-outline"
                size={24}
                color="#000"
                style={{marginTop: 4}} // <-- lowered the icon
              />
              <Text style={styles.largeListTitle}> Do not disturb</Text>
            </View>
            <Text style={styles.largeListSubTitle}>
              {' '}
              Pause calls from CARS24 team
            </Text>
          </View>
          <Switch
            trackColor={{false: '#ccc', true: '#4B23A0'}}
            thumbColor={doNotDisturb ? '#fff' : '#f4f3f4'}
            value={doNotDisturb}
            onValueChange={setDoNotDisturb}
            style={{transform: [{scaleX: 1.3}, {scaleY: 1.3}]}}
          />
        </View>

        {/* CARS24 rewards with rupee icon */}
        <TouchableOpacity style={styles.largeListItem}>
          <View style={{flexDirection: 'column'}}>
            <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
              <Ionicons
                name="cash-outline"
                size={24}
                color="#000"
                style={{marginTop: 4}} // <-- lowered the icon
              />
              <Text style={styles.largeListTitle}> CARS24 Rewards</Text>
            </View>
            <Text style={styles.largeListSubTitle}> View your Rewards</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={28} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f9f9f9'},
  scrollArea: {flex: 1},

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  headerTitle: {fontSize: 20, fontWeight: '600', color: '#000'},

  /* Top Banner */
  topBanner: {
    backgroundColor: '#EEE6FA',
    margin: 12,
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  topBannerText: {fontSize: 18, color: '#444', marginBottom: 6},
  topBannerSub: {fontSize: 18, color: '#222', fontWeight: '600'},
  knowMore: {color: '#FF6600', fontSize: 16},

  /* Profile Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 14,
    padding: 18,
    borderRadius: 14,
    elevation: 2,
  },
  profileText: {flex: 1, marginLeft: 12},
  profileName: {fontSize: 18, fontWeight: '700', color: '#000'},
  profileDetails: {fontSize: 14, color: '#666', marginTop: 3},

  /* Two Cards container */
  twoCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 14,
  },
  bigCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginHorizontal: 6,
    elevation: 3,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  bigCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    color: '#000',
    textAlign: 'left',
  },
  bigCardSub: {
    fontSize: 16,
    color: '#555',
    marginBottom: 14,
    textAlign: 'left',
  },
  rechargeBtn: {
    backgroundColor: '#D32F2F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  bigRechargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
  },
  bigOrangeLink: {
    color: '#FF6600',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },

  /* Story Banner */
  storyBanner: {
    backgroundColor: '#FFE0B2',
    marginHorizontal: 12,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  storyText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '700',
  },
  followBtn: {
    backgroundColor: '#FF6600',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  followText: {color: '#fff', fontWeight: '700', fontSize: 16},

  /* Bottom Section */
  bottomSection: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
  },
  largeListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  largeListTitle: {fontSize: 18, fontWeight: '600', color: '#000'},
  largeListSubTitle: {fontSize: 14, color: '#666', marginTop: 4},
});

export default AccountScreen;
