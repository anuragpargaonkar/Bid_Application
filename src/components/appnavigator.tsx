import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
 
// Screens
import LoginScreen from '../screens/login/login_screen';
import BottomNavigationScreen from '../components/BottomNavigation/bottomnavigation_screen';
import SignUpScreen from '../screens/signup/signup_screen';
// import BiddingScreen from '../screens/bidding/bidding_screen';
 
/**
 * Define the navigation stack parameter list.
 * This should match the names used in Stack.Screen 'name' props.
 * The 'undefined' means the screen takes no parameters.
 * You might need to add other screens like 'SignUp' here as well.
 * but based on your LoginScreen, these two are necessary for now.
 */
export type RootStackParamList = {
  Login: undefined;
  Home: undefined; // Assuming 'Home' is the BottomNavigationScreen
  SignUp: undefined;
  Bidding: { car: { id: string; title: string; subtitle: string; info: string; time: string; imageSource: any; } };
  // Add other screens here, e.g., 'ForgotPassword': {userId: string};
};
 
// Create a stack navigator with the defined parameter list
const Stack = createNativeStackNavigator<RootStackParamList>();
 
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {/* First show login */}
        <Stack.Screen name="Login" component={LoginScreen} />
 
        {/* After login, show bottom navigation */}
        <Stack.Screen name="Home" component={BottomNavigationScreen} />
        {/* <Stack.Screen name="Bidding" component={BiddingScreen} /> */}
 
 
        {/* You'll need a SignUp screen component if the LoginScreen uses it */}
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        {/* For now, keeping only the screens defined in the initial components, but leaving a comment for SignUp. */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
 
export default AppNavigator;
 
 