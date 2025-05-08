import { Stack, router } from 'expo-router';
import { View } from 'react-native';
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
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <IconSymbol
                name="plus"
                size={24}
                color={Colors.light.tint}
                onPress={() => {
                  router.navigate('/');
                  router.setParams({ newChat: 'true' });
                }}
              />
              <IconSymbol
                name="gearshape.fill"
                size={24}
                color={Colors.light.tint}
                onPress={() => router.navigate('/settings')}
              />
            </View>
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
