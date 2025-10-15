// Login.tsx - FIXED NAVIGATION TYPING
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
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import {useWebSocket} from '../../utility/WebSocketConnection';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width, height} = Dimensions.get('window');

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';

// Define Root Stack Param List
type RootStackParamList = {
  Login: undefined;
  Home: {
    token: string;
    userId: string;
    userInfo: any;
  };
  ForgotPassword: undefined;
};

// Define navigation prop type
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const Login = () => {
  const [username, setUsername] = useState('asif.attar@caryanam.in');
  const [password, setPassword] = useState('Pass@123');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {connectWebSocket, isConnected, connectionStatus} = useWebSocket();

  // Store authentication data
  const storeAuthData = async (token: string, userId: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      console.log('✅ Auth data stored successfully');
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
    }
  };

  // Parse JWT token to extract user info
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
      console.log('🔐 STEP 1: Attempting login...');

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

      console.log('📡 Login response status:', response.status);

      // Get response as text first to handle both JSON and plain token responses
      const responseText = await response.text();
      console.log('📄 Login response text:', responseText);

      let token: string | null = null;

      // Try to parse as JSON first
      try {
        const data = JSON.parse(responseText);
        if (data.token) {
          token = data.token;
        } else if (typeof data === 'string' && data.length > 100) {
          // If it's a string that looks like a JWT token
          token = data;
        }
      } catch (jsonError) {
        // If JSON parsing fails, check if it's a plain token
        if (
          responseText &&
          responseText.length > 100 &&
          responseText.includes('.')
        ) {
          token = responseText;
        }
      }

      if (response.ok && token) {
        console.log('✅ Login successful, token received');

        // Parse JWT token to get user info
        const decodedToken = parseJwt(token);
        console.log('🔓 Decoded token:', decodedToken);

        const userId = decodedToken?.userId || decodedToken?.sub || username;

        // STEP 1: Store JWT token and user data
        await storeAuthData(token, userId);

        Alert.alert('Success', 'Login Successful! Connecting to live bids...');

        // STEP 2: Connect WebSocket with authentication token
        console.log('🔗 STEP 2: Connecting WebSocket with token...');
        connectWebSocket(token);

        // Navigate to Home screen with properly typed parameters
        setTimeout(() => {
          navigation.navigate('Home', {
            token: token,
            userId: userId,
            userInfo: decodedToken,
          });
        }, 1500);
      } else {
        // Handle different error response formats
        let errorMessage = 'Invalid credentials';

        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          if (responseText && responseText.length < 100) {
            errorMessage = responseText;
          }
        }

        Alert.alert('Login Failed', errorMessage);
        console.error('❌ Login failed:', errorMessage);
      }
    } catch (error: any) {
      console.error('💥 Network Error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to server. Please check your internet connection.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A5B80" />

      <ImageBackground style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={['rgba(142,158,171,0.7)', 'rgba(74,91,128,0.7)']}
          style={styles.gradientOverlay}
        />
      </ImageBackground>

      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>

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

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />

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
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  background: {...StyleSheet.absoluteFillObject, width, height},
  gradientOverlay: {...StyleSheet.absoluteFillObject},
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginTop: height * 0.05,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#000',
    alignSelf: 'flex-start',
    borderBottomWidth: 3,
    borderBottomColor: '#2c3e94',
    paddingBottom: 5,
  },
  label: {fontSize: 16, marginBottom: 6, color: '#000', fontWeight: '500'},
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forgotContainer: {alignItems: 'flex-end', marginBottom: 16},
  forgotText: {color: '#2c3e94', fontSize: 14, fontWeight: '500'},
  loginButton: {
    backgroundColor: '#2c3e94',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#2c3e94',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#6c7a9c',
    shadowOpacity: 0.1,
  },
  loginButtonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default Login;
