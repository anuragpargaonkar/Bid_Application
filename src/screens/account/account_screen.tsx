// src/screens/Home/HomeScreen.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const AccountScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Account Section */}
      <View style={styles.accountSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.accountText}>
          This is your account section. You can display user details, balance,
          settings, and more here.
        </Text>
      </View>
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', paddingTop: 40},
  accountSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sectionTitle: {fontWeight: 'bold', fontSize: 24, marginBottom: 10},
  accountText: {fontSize: 16, textAlign: 'center', color: '#555'},
});
