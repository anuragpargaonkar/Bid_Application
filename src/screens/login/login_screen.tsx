import React, {useState} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../components/appnavigator';

const LoginScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    navigation.navigate('Home');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset flow goes here.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <Text style={styles.title}>Welcome Back </Text>
          <Text style={styles.subtitle}>Log in to continue</Text>

          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}>
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
            <Text style={styles.signUpText}>
              Don’t have an account?{' '}
              <Text style={styles.signUpLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: '88%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 28,
  },
  input: {
    width: '100%',
    height: 54,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#2563eb',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  orText: {
    marginHorizontal: 12,
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
  signUpText: {
    fontSize: 16,
    color: '#444',
  },
  signUpLink: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
