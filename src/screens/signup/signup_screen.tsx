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
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- Add this import
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../components/appnavigator';
 
/**
 * SignUpScreen component handles user registration UI and logic.
 * @returns {JSX.Element}
 */
const SignUpScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { width } = useWindowDimensions();
 
  /**
   * Handles the sign up action.
   */
  const handleSignUp = () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    navigation.navigate('Home');
  };
 
  /**
   * Navigates back to the Login screen.
   */
  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };
 
  // Responsive width for form container
  const formWidth = width > 500 ? 400 : '90%';
 
  return (
    <SafeAreaView style={styles.safeArea}> {/* <-- Wrap everything in SafeAreaView */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.inner, { width: formWidth }]}>
            <Text style={styles.title}>Sign up</Text>
            {/* Removed car illustration */}
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#888"
            />
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
            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Sign up</Text>
            </TouchableOpacity>
            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Already have an account?</Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.loginText}> Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
 
export default SignUpScreen;
 
/**
 * Styles for the SignUpScreen component.
 */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 48, // extra space for scroll
  },
  inner: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    // width is set dynamically for responsiveness
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    marginTop: 24,
    textAlign: 'center',
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
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    justifyContent: 'center',
  },
  bottomText: {
    color: '#222',
    fontSize: 16,
  },
  loginText: {
    color: '#1976d2',
    fontSize: 18,
    fontWeight: '500',
  },
});
 
 