import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const theme = useColorScheme() ?? 'light';

  useEffect(() => {
    const loadApiKeys = async () => {
      const [openai, gemini, anthropic, deepseek] = await Promise.all([
        AsyncStorage.getItem('openai-api-key'),
        AsyncStorage.getItem('gemini-api-key'),
        AsyncStorage.getItem('anthropic-api-key'),
        AsyncStorage.getItem('deepseek-api-key'),
      ]);
      if (openai) setOpenaiApiKey(openai);
      if (gemini) setGeminiApiKey(gemini);
      if (anthropic) setAnthropicApiKey(anthropic);
      if (deepseek) setDeepseekApiKey(deepseek);
    };
    loadApiKeys();
  }, []);

  const handleSave = async (storageKey: string, value: string) => {
    if (!value.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    try {
      await AsyncStorage.setItem(storageKey, value.trim());

      Alert.alert('Success', 'API key saved successfully');
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode="interactive"
      >


      <ThemedText type="title" style={styles.title}>API Settings</ThemedText>
      
      {/* OpenAI API Key */}
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
        value={openaiApiKey}
        onChangeText={setOpenaiApiKey}
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
        onPress={() => handleSave('openai-api-key', openaiApiKey)}
      >
        <ThemedText style={[styles.buttonText, { color: theme === 'light' ? Colors.dark.text : Colors.light.text }]}>Save OpenAI Key</ThemedText>
        <IconSymbol
          name="paperplane.fill"
          size={20}
          color="white"
          style={styles.buttonIcon}
        />
      </TouchableOpacity>

      {/* Gemini API Key */}
      <ThemedText type="defaultSemiBold" style={styles.label}>
        Gemini API Key:
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
        value={geminiApiKey}
        onChangeText={setGeminiApiKey}
        placeholder="Enter your Gemini API key"
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
        onPress={() => handleSave('gemini-api-key', geminiApiKey)}
      >
        <ThemedText style={[styles.buttonText, { color: theme === 'light' ? Colors.dark.text : Colors.light.text }]}>Save Gemini Key</ThemedText>
        <IconSymbol
          name="paperplane.fill"
          size={20}
          color="white"
          style={styles.buttonIcon}
        />
      </TouchableOpacity>

      {/* Anthropic API Key */}
      <ThemedText type="defaultSemiBold" style={styles.label}>
        Anthropic API Key:
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
        value={anthropicApiKey}
        onChangeText={setAnthropicApiKey}
        placeholder="Enter your Anthropic API key"
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
        onPress={() => handleSave('anthropic-api-key', anthropicApiKey)}
      >
        <ThemedText style={[styles.buttonText, { color: theme === 'light' ? Colors.dark.text : Colors.light.text }]}>Save Anthropic Key</ThemedText>
        <IconSymbol
          name="paperplane.fill"
          size={20}
          color="white"
          style={styles.buttonIcon}
        />
      </TouchableOpacity>

      {/* DeepSeek API Key */}
      <ThemedText type="defaultSemiBold" style={styles.label}>
        DeepSeek API Key:
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
        value={deepseekApiKey}
        onChangeText={setDeepseekApiKey}
        placeholder="Enter your DeepSeek API key"
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
        onPress={() => handleSave('deepseek-api-key', deepseekApiKey)}
      >
        <ThemedText style={[styles.buttonText, { color: theme === 'light' ? Colors.dark.text : Colors.light.text }]}>Save DeepSeek Key</ThemedText>
        <IconSymbol
          name="paperplane.fill"
          size={20}
          color="white"
          style={styles.buttonIcon}
        />
      </TouchableOpacity>

      <ThemedText type="subtitle" style={styles.note}>
        Your API keys are stored securely on your device and never sent anywhere except directly to their respective APIs (OpenAI, Gemini, Anthropic, DeepSeek).

      </ThemedText>
      </ScrollView>
    </ThemedView>

  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
    flexGrow: 1,
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
    marginBottom: 16,
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
