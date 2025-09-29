import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../components/appnavigator';
 
/**
 * LoginScreen component for user authentication.
 * @returns {JSX.Element}
 */
const LoginScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
 
  /**
   * Handles login action.
   */
  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    navigation.navigate('Home');
  };
 
  /**
   * Navigates to the SignUp screen.
   */
  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };
 
  /**
   * Handles forgot password action.
   */
  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset flow goes here.');
  };
 
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>Log in</Text>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log in</Text>
          </TouchableOpacity>
          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
 
export default LoginScreen;
 
/**
 * Styles for the LoginScreen component.
 */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff.',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: '90%',
    alignItems: 'center',
    marginTop: -40,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    marginTop: 24,
  },
  input: {
    width: '100%',
    height: 54,
    borderColor: '#e5e5e5',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 14,
    backgroundColor: '#fafbfc',
    fontSize: 18,
    color: '#222',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotPasswordText: {
    color: '#1976d2',
    fontSize: 15,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: '#1976d2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  orText: {
    marginHorizontal: 12,
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  signUpText: {
    color: '#1976d2',
    fontSize: 20,
    fontWeight: '500',
    marginTop: 0,
  },
});
 
 