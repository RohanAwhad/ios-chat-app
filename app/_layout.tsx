import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Chat',
          headerRight: () => (
            <IconSymbol
              name="gearshape.fill"
              size={24}
              color={Colors.light.tint}
              onPress={() => router.navigate('/settings')}
            />
          ),
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
