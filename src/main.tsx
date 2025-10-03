import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import WebSocketConnection, { WebSocketProvider } from "../src/utility/WebSocketConnection";
import AppNavigator from "./components/appnavigator"; // Your navigation stack

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <WebSocketProvider>
        <WebSocketConnection />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </WebSocketProvider>
    </SafeAreaProvider>
  );
};

export default App;
