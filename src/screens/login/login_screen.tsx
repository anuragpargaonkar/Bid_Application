// Login.tsx - UPDATED PASSWORD FIELD WITH EYE ICON IN FRONT & CENTERED TITLE
 
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
import Ionicons from 'react-native-vector-icons/Ionicons';
 
const {width, height} = Dimensions.get('window');
 
// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
 
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
  const [username, setUsername] = useState('asif.attar@caryanam.in');
  const [password, setPassword] = useState('Pass@123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
 
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {connectWebSocket} = useWebSocket();
 
  const storeAuthData = async (token: string, userId: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_ID_KEY, userId);
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
 
      let token: string | null = null;
      try {
        const data = JSON.parse(responseText);
        if (data.token) {
          token = data.token;
        } else if (typeof data === 'string' && data.length > 100) {
          token = data;
        }
      } catch (jsonError) {
        if (
          responseText &&
          responseText.length > 100 &&
          responseText.includes('.')
        ) {
          token = responseText;
        }
      }
 
      if (response.ok && token) {
        const decodedToken = parseJwt(token);
        const userId = decodedToken?.userId || decodedToken?.sub || username;
 
        await storeAuthData(token, userId);
 
        Alert.alert('Success', 'Login Successful! Connecting to live bids...');
        connectWebSocket(token);
 
        setTimeout(() => {
          navigation.navigate('Home', {
            token: token,
            userId: userId,
            userInfo: decodedToken,
          });
        }, 1500);
      } else {
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
      }
    } catch (error: any) {
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
        {/* Centered Title */}
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
        <View style={styles.passwordContainer}>
          {/* Eye Icon in front */}
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
    alignSelf: 'center', // centered title
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
    color: 'black',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIconFront: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  passwordInput: {
    paddingLeft: 10,
    flex: 1,
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
});
 
export default Login;