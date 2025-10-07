// App.tsx
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/components/appnavigator';
import { WebSocketProvider } from './src/utility/WebSocketConnection';

const App = () => {
  return (
    <WebSocketProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </WebSocketProvider>
  );
};

export default App;
