import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const theme = useColorScheme() ?? 'light';

  useEffect(() => {
    const loadApiKey = async () => {
      const storedKey = await AsyncStorage.getItem('openai-api-key');
      if (storedKey) setApiKey(storedKey);
    };
    loadApiKey();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    try {
      await AsyncStorage.setItem('openai-api-key', apiKey.trim());
      Alert.alert('Success', 'API key saved successfully');
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>API Settings</ThemedText>
      
      <ThemedText type="defaultSemiBold" style={styles.label}>
        OpenAI API Key:
      </ThemedText>

      <TextInput
        style={[
          styles.input,
          {
            color: theme === 'light' ? Colors.light.text : Colors.dark.text,
            backgroundColor: theme === 'light' ? Colors.light.background : Colors.dark.background,
            borderColor: theme === 'light' ? Colors.light.icon : Colors.dark.icon
          }
        ]}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="Enter your OpenAI API key"
        placeholderTextColor={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: theme === 'light' ? Colors.light.tint : Colors.dark.tint }
        ]}
        onPress={handleSave}
      >
        <ThemedText style={styles.buttonText}>Save API Key</ThemedText>
        <IconSymbol
          name="paperplane.fill"
          size={20}
          color="white"
          style={styles.buttonIcon}
        />
      </TouchableOpacity>

      <ThemedText type="subtitle" style={styles.note}>
        Your API key is stored securely on your device and never sent anywhere except directly to OpenAI's API.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginTop: 2,
  },
  note: {
    marginTop: 24,
    opacity: 0.6,
    fontSize: 14,
  },
});
