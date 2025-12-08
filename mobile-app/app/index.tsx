import { mainColors } from '@/utils/global-theme';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { ArrowRight } from 'lucide-react-native'
import { router } from 'expo-router';

export default function Index() {
  const next = () => {
    router.push('/setup');
  }

  return (
    <View style={styles.base}>
      <View style={styles.boxUp}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: 300, height: 300, marginTop: 20 }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.text}>Ready to make fish farming easier and smarter?</Text>
      <View style={styles.boxDown}>
        <TouchableOpacity onPress={next} style={styles.nextButton}>
          <ArrowRight color={mainColors.foreground} />
          <Text style={styles.nextButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: mainColors.background,
  },
  boxUp: {
    flex: 2,
    width: "100%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxDown: {
    flex: 1,
    width: "100%",
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: mainColors.foreground,
  },
  nextButton: {
    flexDirection: "row",
    backgroundColor: mainColors.accent,
    borderWidth: 2,
    borderColor: mainColors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
    width: "100%",
    borderRadius: mainColors.radius,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: mainColors.foreground,
  },
});