// Login.tsx - FINAL (Dealer validation + Centered Logo + Curved Card)

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import {useWebSocket} from '../../utility/WebSocketConnection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {width, height} = Dimensions.get('window');

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const USER_EMAIL_KEY = 'user_email';
const DEALER_ID_KEY = 'dealerId';
const USER_DATA_KEY = 'userData';

type RootStackParamList = {
  Login: undefined;
  Home: {
    token: string;
    userId: string;
    userInfo: any;
  };
  ForgotPassword: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {connectWebSocket} = useWebSocket();

  const storeAuthData = async (
    token: string,
    userId: string,
    email: string,
    dealerId: string | null,
    fullUserData: any,
  ) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      await AsyncStorage.setItem(USER_EMAIL_KEY, email);

      if (dealerId) {
        await AsyncStorage.setItem(DEALER_ID_KEY, dealerId);
        console.log('✅ Dealer ID stored:', dealerId);
      } else {
        console.warn('⚠️ No dealer ID found in login response');
      }

      await AsyncStorage.setItem(
        USER_DATA_KEY,
        JSON.stringify({
          id: userId,
          userId: userId,
          email: email,
          dealerId: dealerId,
          ...fullUserData,
        }),
      );

      console.log('✅ Auth data stored successfully');
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
    }
  };

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Error parsing JWT token:', error);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Validation Error', 'Username and Password are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        'https://caryanamindia.prodchunca.in.net/jwt/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
          }),
        },
      );

      const responseText = await response.text();
      console.log('=== LOGIN RESPONSE ===');
      console.log('Response text:', responseText);

      let token: string | null = null;
      try {
        const data = JSON.parse(responseText);
        if (data.token) token = data.token;
        else if (typeof data === 'string' && data.length > 100) token = data;
      } catch {
        if (responseText && responseText.length > 100 && responseText.includes('.')) {
          token = responseText;
        }
      }

      if (response.ok && token) {
        const decodedToken = parseJwt(token);
        const userId =
          decodedToken?.userId ||
          decodedToken?.sub ||
          decodedToken?.id ||
          username;
        const userEmail = decodedToken?.email || username;

        const dealerId =
          decodedToken?.dealerId ||
          decodedToken?.dealer_id ||
          decodedToken?.dealerID ||
          decodedToken?.DealerId ||
          decodedToken?.dealer ||
          null;

        console.log('User ID:', userId);
        console.log('Dealer ID:', dealerId);

        // Always store auth data and connect WebSocket
        await storeAuthData(token, userId, userEmail, dealerId, decodedToken);
        connectWebSocket(token);

        // 🔒 Check dealer access
        if (!dealerId) {
          Alert.alert('Access Denied', 'You are not a dealer. Only dealers can log in.');
          setLoading(false);
          return;
        }

        // ✅ Dealer can continue to Home
        Alert.alert('Success', 'Login Successful! Connecting to live bids...');
        setTimeout(() => {
          navigation.navigate('Home', {
            token: token,
            userId: userId,
            userInfo: decodedToken,
          });
        }, 1000);
      } else {
        let errorMessage = 'Invalid credentials';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (responseText && responseText.length < 100) {
            errorMessage = responseText;
          }
        }
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      Alert.alert(
        'Connection Error',
        'Unable to connect to server. Please check your internet connection.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#051A2F', '#051A2F', '#051A2F']}
      style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#051A2F" />

      {/* Top Curved Section with Centered Logo */}
      <View style={styles.topCurvedSection}>
        <Image
          source={require('../../assets/images/logo1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* White Full Curved Card Section */}
      <View style={styles.cardContainer}>
        <View style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Username/Email</Text>
            <TextInput
              placeholder="Enter username or email"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIconFront}>
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
              <TextInput
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>LOGIN</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  topCurvedSection: {
    paddingTop: 150,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 100,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 40,
    marginHorizontal: 20,
    marginBottom: 150,
    paddingTop: 40,
    paddingHorizontal: 30,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  content: {flex: 1},
  formGroup: {marginBottom: 20},
  label: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    color: '#333',
    fontSize: 15,
  },
  passwordContainer: {flexDirection: 'row', alignItems: 'center'},
  eyeIconFront: {position: 'absolute', right: 15, top: 15, zIndex: 1},
  passwordInput: {paddingLeft: 10, flex: 1},
  forgotContainer: {alignItems: 'flex-end', marginTop: -10, marginBottom: 15},
  forgotText: {color: '#61AFFE', fontSize: 14, fontWeight: '500'},
  loginButton: {
    backgroundColor: '#61AFFE',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#61AFFE',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginButtonDisabled: {opacity: 0.6},
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
});

export default Login;
