import { Stack, router } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODELS } from '@/constants/Models';

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
    zIndex: 1,
  },
  dropdown: {
    width: '60%',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  checkIcon: {
    marginLeft: 8,
  },
});

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
    <>
      <Stack>

      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => (
            <TouchableOpacity onPress={() => setShowModels(!showModels)}>
              <ThemedText 
                type="defaultSemiBold"
                lightColor={Colors.light.text}
                darkColor={Colors.dark.text}
              >
                {MODELS[selectedModel].name}
              </ThemedText>
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: Colors[colorScheme].background,
          },

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

      {showModels && (
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowModels(false)}
        >
          <ThemedView style={[
            styles.dropdown,
            {
              borderColor: Colors[colorScheme].icon,
            }
          ]}>
            {Object.keys(MODELS).map((modelKey) => (
              <TouchableOpacity
                key={modelKey}
                onPress={() => handleModelSelect(modelKey as keyof typeof MODELS)}
                style={styles.dropdownItem}
              >
                <ThemedText 
                  type="defaultSemiBold"
                  lightColor={Colors.light.text}
                  darkColor={Colors.dark.text}
                >
                  {MODELS[modelKey as keyof typeof MODELS].name}
                </ThemedText>
                {modelKey === selectedModel && (
                  <IconSymbol
                    name="checkmark"
                    size={16}
                    color={Colors[colorScheme].tint}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ThemedView>
        </TouchableOpacity>
      )}
    </>

  );
}
