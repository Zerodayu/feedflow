import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { Text } from 'react-native';
import { useSegments } from 'expo-router';


export default function Layout() {
  const segments = useSegments();
  const activeTab = segments[segments.length - 1];
  
  return (
     <Tabs style={{ flex: 1, height: '20%' }}>
      <TabSlot />
      <TabList>
        <TabTrigger name="home" href="/">
          <Text style={{ color: activeTab === '(stats)' ? 'red' : 'black' }}>Home</Text>
        </TabTrigger>
        <TabTrigger name="article" href="/temp">
          <Text style={{ color: activeTab === 'temp' ? 'red' : 'black' }}>Temp</Text>
        </TabTrigger>
      </TabList>
    </Tabs>
  )
}