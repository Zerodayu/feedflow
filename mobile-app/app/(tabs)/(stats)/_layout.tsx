import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSegments } from 'expo-router';
import { mainColors } from '@/utils/global-theme';


export default function Layout() {
  const segments = useSegments();
  const activeTab = segments[segments.length - 1];

  return (
    <Tabs style={{ flex: 1, height: '20%' }}>
      <TabList style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: mainColors.accent,
      }}>
        <TabTrigger name="home" href="/" asChild>
          <TouchableOpacity style={{
            borderBottomWidth: activeTab === '(stats)' ? 2 : 0,
            borderBottomColor: activeTab === '(stats)' ? mainColors.primary : mainColors.background,
            width: "50%",
            paddingVertical: 10,
            alignContent: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{
              fontWeight: activeTab === '(stats)' ? "bold" : "normal"
            }}>Home</Text>
          </TouchableOpacity>
        </TabTrigger>
        <TabTrigger name="temp" href="/temp" asChild>
          <TouchableOpacity style={{
            borderBottomWidth: activeTab === 'temp' ? 2 : 0,
            borderBottomColor: activeTab === 'temp' ? mainColors.primary : mainColors.background,
            width: "50%",
            paddingVertical: 10,
            alignContent: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{
              fontWeight: activeTab === 'temp' ? "bold" : "normal"
            }}>Temp</Text>
          </TouchableOpacity>
        </TabTrigger>
      </TabList>
      <TabSlot />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBtn: {
    width: 100,
    paddingVertical: 10
  }
})