import { StyleSheet, Text, View, Image } from 'react-native'
import { mainColors } from '@/utils/global-theme'
import Constants from 'expo-constants'

export default function About() {
  return (
    <View style={styles.base}>
      <Text style={styles.title}>FeedFlow</Text>
      <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: 300, height: 300, marginTop: 20 }}
          resizeMode="contain"
        />
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>Version: {Constants.expoConfig?.version || 'N/A'}</Text>
          <Text style={styles.detailText}>Build: {Constants.expoConfig?.android?.versionCode || Constants.expoConfig?.ios?.buildNumber || 'N/A'}</Text>
          <Text style={styles.detailText}>Platform: {Constants.platform?.os}</Text>
          <Text style={styles.detailText}>Expo SDK: {Constants.expoConfig?.sdkVersion || Constants.expoRuntimeVersion || 'N/A'}</Text>
          <Text style={styles.detailText}>Theme: System</Text>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 14,
    backgroundColor: mainColors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: mainColors.primary,
  },
  detailsContainer: {
    marginTop: 20,
    gap: 10,
  },
  detailText: {
    fontSize: 16,
    color: mainColors.foreground,
  }
})