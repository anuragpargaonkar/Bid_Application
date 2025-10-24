// ForgotPassword.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
 
const { width, height } = Dimensions.get('window');
 
// Navigation types
type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};
 
type ForgotPasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ForgotPassword',
  'Please enter your email to reset your password'
>
 
const ForgotPassword = () => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
 
  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Validation Error', 'Please enter your email.');
      return;
    }
 
    setLoading(true);
 
    try {
      const response = await fetch(
        'https://caryanamindia.prodchunca.in.net/cars/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ email: trimmedEmail }),
        }
      );
 
      const data = await response.json();
 
      if (response.ok) {
        Alert.alert(
          'Success',
          'Password reset link has been sent to your email.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        const message =
          data.message ||
          'Email not supported or invalid. Please check and try again.';
        Alert.alert('Error', message);
      }
    } catch (error: any) {
      console.error('💥 Network Error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to server. Please check your internet connection.'
      );
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
 
        <Text style={styles.label}>Enter your email</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#999"
        />
 
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>
 
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginTop: height * 0.05,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#2c3e94',
    alignSelf: 'center',
  },
  label: { fontSize: 16, marginBottom: 8, color: '#000', fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#2c3e94',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#6c7a9c' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backButton: { marginTop: 20, alignItems: 'center' },
  backText: { color: '#2c3e94', fontWeight: '500' },
});
 
export default ForgotPassword;
 
 