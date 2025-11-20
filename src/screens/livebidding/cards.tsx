// components/Card.tsx
import React, {useEffect, useState} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {useWebSocket} from '../../utility/WebSocketConnection';
dayjs.extend(duration);

export type RootStackParamList = {
  Home: undefined;
  BiddingCarDetail: {bidCarId: string; beadingCarId: string};
};

interface CardProps {
  cardData: {
    bidCarId: string;
    beadingCarId: string;
    basePrice: number;
    closingTime: string;
    year?: string;
    brand?: string;
    model?: string;
    kmDriven?: string;
    ownerSerial?: string;
    fuelType?: string;
    registration?: string;
    area?: string;
    city?: string;
    imageUrl?: string;
  };
}

const Card: React.FC<CardProps> = ({cardData}) => {
  const closeTime = cardData.closingTime;
  const [timeLeft, setTimeLeft] = useState('');
  const [highestBid, setHighestBid] = useState<number>(cardData.basePrice);

  const {client, isConnected} = useWebSocket();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Timer
  useEffect(() => {
    const updateTimer = () => {
      const now = dayjs();
      const closingTime = dayjs(closeTime);

      if (closingTime.isBefore(now)) {
        setTimeLeft('00:00');
        return;
      }

      const diff = closingTime.diff(now);
      const remainingDuration = dayjs.duration(diff);
      const minutes = String(remainingDuration.minutes()).padStart(2, '0');
      const seconds = String(remainingDuration.seconds()).padStart(2, '0');
      setTimeLeft(`${minutes}m : ${seconds}s`);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [closeTime]);

  // WebSocket top bid subscription
  useEffect(() => {
    if (cardData.bidCarId && isConnected && client) {
      const subscription = client.subscribe(
        `/topic/topBids/${cardData.bidCarId}`,
        (message: any) => {
          const topBid = JSON.parse(message.body);
          setHighestBid(topBid?.amount);
        },
      );

      client.publish({
        destination: `/app/topBids/${cardData.bidCarId}`,
        body: JSON.stringify({}),
      });

      return () => subscription.unsubscribe();
    }
  }, [cardData.bidCarId, isConnected, client]);

  const remainingMinutes = parseInt(timeLeft.split('m')[0]) || 0;
  const isLastCall = remainingMinutes < 2;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('BiddingCarDetail', {
          bidCarId: cardData.bidCarId,
          beadingCarId: cardData.beadingCarId,
        })
      }>
      <Image
        source={{uri: cardData.imageUrl || 'https://i.imgur.com/B94FvV7.jpeg'}}
        style={styles.image}
      />
      <View style={styles.content}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>
            {`${cardData.year || ''} ${cardData.brand || ''} ${
              cardData.model || ''
            }`}
          </Text>
          <Icon name="heart-outline" size={22} color="#444" />
        </View>

        <View style={styles.rowWrap}>
          <Text style={styles.tag}>{cardData.kmDriven} km</Text>
          <Text style={styles.tag}>{cardData.ownerSerial} owner</Text>
          <Text style={styles.tag}>{cardData.fuelType}</Text>
          <Text style={styles.tag}>{cardData.registration}</Text>
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.bidBox}>
            <Text style={styles.bidText}>Highest Bid ₹ {highestBid}</Text>
          </View>
          <View style={styles.timerBox}>
            <Text
              style={[
                styles.timerLabel,
                isLastCall ? styles.red : styles.green,
              ]}>
              {isLastCall ? 'Last Call' : 'Timer'}
            </Text>
            <Text
              style={[styles.timer, isLastCall ? styles.red : styles.green]}>
              {timeLeft}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Icon name="map-marker" size={14} color="#555" />
          <Text style={styles.location}>
            {cardData.area} {cardData.city}
          </Text>
        </View>

        <TouchableOpacity style={styles.viewBtn}>
          <Text style={styles.viewText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default Card;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {width: '100%', height: 180},
  content: {padding: 12},
  row: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  rowWrap: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 8},
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  title: {fontSize: 16, fontWeight: 'bold', color: '#222', flex: 1},
  tag: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    marginRight: 6,
    borderRadius: 6,
    color: '#444',
  },
  bidBox: {
    backgroundColor: '#9FA8DA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bidText: {fontSize: 14, fontWeight: 'bold', color: '#fff'},
  timerBox: {alignItems: 'center'},
  timerLabel: {fontSize: 14, fontWeight: '600'},
  timer: {fontSize: 13, fontWeight: '500'},
  red: {color: 'red'},
  green: {color: 'green'},
  location: {fontSize: 12, color: '#555', marginLeft: 4},
  viewBtn: {
    marginTop: 12,
    backgroundColor: '#9FA8DA',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewText: {color: '#fff', fontWeight: 'bold', fontSize: 14},
});
