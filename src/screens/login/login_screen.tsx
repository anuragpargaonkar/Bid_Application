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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
 
const {width, height} = Dimensions.get('window');
 
// Import your local background image
// import BackgroundImage from '../../../assets/images/image.png';
 
// ------------------------------
// Main Login Component
// ------------------------------
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
 
  const navigation = useNavigation<any>();
 
  // ------------------------------
  // Handle Login
  // ------------------------------
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Validation Error', 'Username and Password are required');
      return;
    }
 
    try {
      setLoading(true);
      const response = await fetch('https://caryanamindia.prodchunca.in.net/jwt/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password}),
      });
 
      const data = await response.json();
 
      if (response.ok) {
        Alert.alert('Success', 'Login Successful');
        navigation.navigate('Home'); // Navigate to Home
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Network Error:', error);
    } finally {
      setLoading(false);
    }
  };
 
  // ------------------------------
  // Render
  // ------------------------------
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A5B80" />
 
      {/* Background Image */}
      <ImageBackground
        // source={BackgroundImage}
        style={styles.background}
        resizeMode="cover">
        {/* Optional Gradient Overlay */}
        <LinearGradient
          colors={['rgba(142,158,171,0.7)', 'rgba(74,91,128,0.7)']}
          style={styles.gradientOverlay}
        />
      </ImageBackground>
 
      {/* Form Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>
 
        {/* Username Input */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          placeholder="Enter username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          placeholderTextColor="#999"
        />
 
        {/* Password Input */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#999"
        />
 
        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotContainer}
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
 
        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}>
          <Text style={styles.loginButtonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
 
        {/* Sign Up Link */}
        {/* <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </View>
  );
};
 
export default Login;
 
// ------------------------------
// Styles
// ------------------------------
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
  loginButtonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {fontSize: 14, color: '#000'},
  signupLink: {fontSize: 14, color: '#2c3e94', fontWeight: '600'},
});
 
