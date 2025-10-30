// App.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/components/appnavigator';
import { WebSocketProvider } from './src/utility/WebSocketConnection';
import { WishlistProvider } from './src/context/WishlistContext';

const App = () => {
  return (
    <WishlistProvider>
      <WebSocketProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </WebSocketProvider>
    </WishlistProvider>
  );
};

export default App;
