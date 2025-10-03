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
 
