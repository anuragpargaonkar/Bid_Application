// src/screens/bottomnavigation/bottomnavigation_screen.tsx
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Image} from 'react-native';

// Screens
import HomeScreen from '../../screens/home/home_screen';
import MyCarsScreen from '../../screens/mycars/mycars_screen';
import OrdersScreen from '../../screens/orders/orders_screen';
import AddOnsScreen from '../../screens/addons/addons_screen';
import AccountScreen from '../../screens/account/account_screen';

// Icons
import homeIcon from '../../assets/images/home1.png';
import mycarsIcon from '../../assets/images/my-car.png';
import ordersIcon from '../../assets/images/orders.png';
import addonsIcon from '../../assets/images/Addones.png';
import accountIcon from '../../assets/images/Account.png';

const Tab = createBottomTabNavigator();

const BottomNavigationScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}: {route: {name: string}}) => ({
        tabBarIcon: ({focused}: {focused: boolean}) => {
          let iconSource;

          switch (route.name) {
            case 'HomeTab':
              iconSource = homeIcon;
              break;
            case 'MyCars':
              iconSource = mycarsIcon;
              break;
            case 'Orders':
              iconSource = ordersIcon;
              break;
            case 'WinZone':
              iconSource = addonsIcon;
              break;
            case 'Account':
              iconSource = accountIcon;
              break;
          }

          return (
            <Image
              source={iconSource}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? '#007bff' : '#888',
              }}
              resizeMode="contain"
            />
          );
        },
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#888',
      })}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{title: 'Home'}}
      />
      <Tab.Screen name="MyCars" component={MyCarsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="WinZone" component={AddOnsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

export default BottomNavigationScreen;
