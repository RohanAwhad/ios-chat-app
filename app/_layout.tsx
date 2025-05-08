import { Stack, router } from 'expo-router';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function Layout() {
  const colorScheme = useColorScheme() ?? 'light';
  
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Chat',
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerTintColor: Colors[colorScheme].text,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <IconSymbol
                name="plus"
                size={24}
                color={Colors[colorScheme].tint}
                onPress={() => {
                  router.navigate('/');
                  router.setParams({ newChat: 'true' });
                }}
              />
              <IconSymbol
                name="gearshape.fill"
                size={24}
                color={Colors[colorScheme].tint}
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
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },
          headerTintColor: Colors[colorScheme].text,
        }}
      />
    </Stack>
  );
}
