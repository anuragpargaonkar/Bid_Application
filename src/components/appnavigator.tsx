// AppNavigator.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {Image} from 'react-native';

// Screens
import LoginScreen from '../screens/login/login_screen';
import HomeScreen from '../screens/home/home_screen';
import MyCarsScreen from '../screens/mycars/mycars_screen';
import OrdersScreen from '../screens/orders/orders_screen';
import AddOnsScreen from '../screens/addons/addons_screen';
import AccountScreen from '../screens/account/account_screen';

// Icons
import homeIcon from '../assets/images/home1.png';
import mycarsIcon from '../assets/images/my-car.png';
import ordersIcon from '../assets/images/orders.png';
import addonsIcon from '../assets/images/Addones.png';
import accountIcon from '../assets/images/Account.png';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}: {route: {name: string}}) => ({
        tabBarIcon: ({focused}: {focused: boolean}) => {
          let iconSource;

          switch (route.name) {
            case 'Home':
              iconSource = homeIcon;
              break;
            case 'MyCars':
              iconSource = mycarsIcon;
              break;
            case 'Orders':
              iconSource = ordersIcon;
              break;
            case 'Addons':
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyCars" component={MyCarsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Addons" component={AddOnsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {/* First show login */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* After login, show bottom navigation */}
        <Stack.Screen name="Home" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
