// src/screens/Auth/LoginStyles.ts

import {StyleSheet} from 'react-native';

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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIconFront: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  passwordInput: {
    paddingLeft: 10,
    flex: 1,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginTop: -10,
    marginBottom: 15,
  },
  forgotText: {
    color: '#61AFFE',
    fontSize: 14,
    fontWeight: '500',
  },
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

export default styles;
