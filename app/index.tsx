import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, TextInput, ScrollView, Keyboard, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import axios from 'axios';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  id: string;
};



export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef < ScrollView
  keyboardShouldPersistTaps = "handled" > (null);
  const theme = useColorScheme() ?? 'light';

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: inputText,
      id: Date.now().toString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    Keyboard.dismiss();

    // Create assistant message
    const assistantMessageId = Date.now().toString() + '-assistant';
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: assistantMessageId,
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const apiKey = await AsyncStorage.getItem('openai-api-key');
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const updatedMessages = [...messages, userMessage];
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
          ],
          stream: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          responseType: 'stream',
        }
      );

      const stream = response.data;
      const decoder = new TextDecoder();
      let content = '';
      let buffer = '';

      stream.on('data', (chunk) => {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0].delta?.content || '';
              content += delta;

              setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content }
                  : msg
              ));

              scrollViewRef.current?.scrollToEnd({ animated: true });
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }

        buffer = lines[lines.length - 1];
      });

      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });

    } catch (error) {
      console.error('API call failed:', error);
      if (error.message.includes('401')) {
        Alert.alert('Error', 'Invalid API key - please check your settings');
      } else if (error.message.includes('API key not found')) {
        Alert.alert('Error', 'Please set your API key in settings first');
      } else {
        Alert.alert('Error', 'Failed to connect to OpenAI API');
      }
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: 'Error: Failed to get response' }
          : msg
      ));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 100 })}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
        contentContainerStyle={[styles.messagesContainer, { paddingBottom: 20 }]}
        keyboardDismissMode="interactive"
      >
        {messages.map((message) => (
          <ThemedView
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble
            ]}
          >
            <ThemedText style={styles.messageText}>
              {message.content}
            </ThemedText>
          </ThemedView>
        ))}
      </ScrollView>

      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              color: theme === 'light' ? Colors.light.text : Colors.dark.text,
              backgroundColor: theme === 'light' ? Colors.light.background : Colors.dark.background,
            }
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim()}
          style={styles.sendButton}
        >
          <IconSymbol
            name="paperplane.fill"
            size={24}
            color={theme === 'light' ? Colors.light.tint : Colors.dark.tint}
          />
        </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    flexGrow: 1,
    paddingVertical: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.tint,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.icon,
  },
  messageText: {
    fontSize: 16,
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.icon,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    maxHeight: 120,
  },
  sendButton: {
    padding: 8,
  },
});
