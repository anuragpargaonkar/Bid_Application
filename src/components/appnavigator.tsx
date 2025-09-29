// AppNavigator.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';

// Screens
import LoginScreen from '../screens/login/login_screen';
import BottomNavigationScreen from '../components/BottomNavigation/bottomnavigation_screen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {/* First show login */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* After login, show bottom navigation */}
        <Stack.Screen name="Home" component={BottomNavigationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
