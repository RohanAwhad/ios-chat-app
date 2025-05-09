import { Stack, router } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODELS } from '@/constants/Models';

export default function Layout() {
  const colorScheme = useColorScheme() ?? 'light';
  const [selectedModel, setSelectedModel] = useState<keyof typeof MODELS>('GPT_4O');
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      const savedModel = await AsyncStorage.getItem('selected-model');
      if (savedModel && Object.keys(MODELS).includes(savedModel)) {
        setSelectedModel(savedModel as keyof typeof MODELS);
      }
    };
    loadModel();
  }, []);

  const handleModelSelect = async (modelKey: keyof typeof MODELS) => {
    setSelectedModel(modelKey);
    setShowModels(false);
    await AsyncStorage.setItem('selected-model', modelKey);
  };

  
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
