// src/screens/Home/HomeScreen.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const AddOnsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Addons Section */}
      <View style={styles.addonsSection}>
        <Text style={styles.sectionTitle}>Addons</Text>
        <Text style={styles.addonsText}>
          This is your Addons section. You can display extra features, offers,
          or tools available to the user here.
        </Text>
      </View>
    </View>
  );
};

export default AddOnsScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', paddingTop: 40},
  addonsSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sectionTitle: {fontWeight: 'bold', fontSize: 24, marginBottom: 10},
  addonsText: {fontSize: 16, textAlign: 'center', color: '#555'},
});
