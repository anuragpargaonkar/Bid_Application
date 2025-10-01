import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";

// Screens
import LoginScreen from "../screens/login/login_screen";
import BottomNavigationScreen from "../components/BottomNavigation/bottomnavigation_screen";
import SignUpScreen from "../screens/signup/signup_screen";

// WebSocket Context
import WebSocketConnection, { WebSocketProvider } from "../utility/WebSocketConnection";

export type RootStackParamList = {
  Login: undefined;
  Home: undefined; // BottomNavigationScreen
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <WebSocketProvider>
      {/* Initialize WebSocket connection once at app level */}
      <WebSocketConnection />

      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={BottomNavigationScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </WebSocketProvider>
  );
};

export default AppNavigator;
