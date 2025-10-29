// ForgotPassword.tsx - FINAL (Green Theme + Full Curved Card)

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
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

// Navigation types
type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

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
    <LinearGradient
      colors={['#1a4d3e', '#2d5f4f', '#1a4d3e']}
      style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a4d3e" />

      {/* Top Section */}
      <View style={styles.topCurvedSection}>
        <Text style={styles.title}>Forgot Password</Text>
      </View>

      {/* Full Curved White Card */}
      <View style={styles.cardContainer}>
        <View style={styles.content}>
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
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  topCurvedSection: {
    paddingTop: 150,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    borderBottomWidth: 3,
    borderBottomColor: '#fff',
    paddingBottom: 5,
  },

  cardContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 40,
    marginHorizontal: 20,
    marginBottom: 300,
    paddingTop: 40,
    paddingHorizontal: 30,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },

  content: { flex: 1, justifyContent: 'flex-start' },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
    fontWeight: '500',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    color: '#333',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#5a8a74',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#5a8a74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 1 },
  backButton: { marginTop: 25, alignItems: 'center' },
  backText: { color: '#1a4d3e', fontWeight: '500', fontSize: 14 },
});

export default ForgotPassword;
