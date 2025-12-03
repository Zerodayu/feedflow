import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSegments } from 'expo-router';
import { mainColors } from '@/utils/global-theme';

type Nav = {
  name: string;
  label: string;
  href: any;
}

const NavsMap: Nav[] = [
  { name: 'index', label: 'Temp', href: '/' },
  { name: 'feed', label: 'Feed', href: '/feed' },
]

export default function Layout() {
  const segments = useSegments();
  const activeTab = segments[segments.length - 1];

  return (
    <Tabs
      style={{
        flex: 1,
        height: '20%',
        paddingHorizontal: 10,
        backgroundColor: mainColors.background
      }}>
      <TabList style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: mainColors.accent,
        borderRadius: mainColors.md,
        padding: 6,
      }}>
        {NavsMap.map((nav) => (
          <TabTrigger key={nav.name} name={nav.name} href={nav.href} asChild>
            <TouchableOpacity style={{
              backgroundColor: activeTab === nav.name || (nav.name === 'index' && activeTab === '(stats)')
                ? mainColors.primary + 50
                : mainColors.accent,
              width: "50%",
              paddingVertical: 10,
              alignContent: 'center',
              justifyContent: 'center',
              borderRadius: mainColors.sm
            }}>
              <Text style={{
                fontWeight: activeTab === nav.name || (nav.name === 'index' && activeTab === '(stats)')
                  ? "bold"
                  : "normal"
              }}>
                {nav.label}
              </Text>
            </TouchableOpacity>
          </TabTrigger>
        ))}
      </TabList>
      <TabSlot />
    </Tabs>
  )
}