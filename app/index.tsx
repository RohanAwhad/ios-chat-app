import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, TextInput, ScrollView, Keyboard, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';

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
  const scrollViewRef = useRef<ScrollView>(null);
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

    let accumulatedContent = '';

    try {
      const apiKey = await AsyncStorage.getItem('openai-api-key');
      if (!apiKey) {
        Alert.alert('Error', 'Please set your API key in settings first');
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId)); // Remove placeholder
        return;
      }

      const currentChatMessages = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4', // Consider making this configurable or using a newer model like gpt-4o-mini
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...currentChatMessages
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        let errorMessage = `API Error: ${response.status}`;
        if (errorData && errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
        
        if (response.status === 401) {
          Alert.alert('Error', 'Invalid API key - please check your settings.');
        } else {
          Alert.alert('Error', errorMessage);
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in the buffer
        buffer = lines.pop() || ''; 

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            if (data === '[DONE]') {
              // Optional: Handle stream completion if needed, though loop break handles it
              break; 
            }
            try {
              const parsed = JSON.parse(data);
              const deltaContent = parsed.choices[0]?.delta?.content;
              if (deltaContent) {
                accumulatedContent += deltaContent;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            } catch (e) {
              console.error('Error parsing stream data:', e, 'Data:', data);
            }
          }
        }
         // Check if [DONE] was in the processed lines and break outer loop
        if (lines.some(line => line.substring(6).trim() === '[DONE]')) {
          break;
        }
      }
    } catch (error: any) {
      console.error('API call failed:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Error: ${error.message || 'Failed to get response'}` }
            : msg
        ).filter(msg => !(msg.id === assistantMessageId && accumulatedContent === '' && error)) // Clean up empty error assistant message
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 90, android: 100 })} // Adjusted for iOS header
    >
      <ScrollView
        keyboardShouldPersistTaps="always"
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardDismissMode="interactive"
      >
        {messages.map((message) => (
          <ThemedView
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === 'user' 
                ? { ...styles.userBubble, backgroundColor: theme === 'light' ? Colors.light.tint : Colors.dark.tint } 
                : { ...styles.assistantBubble, backgroundColor: theme === 'light' ? Colors.light.icon : Colors.dark.icon },
              message.role === 'user' 
                ? { alignSelf: 'flex-end' } 
                : { alignSelf: 'flex-start' }
            ]}
          >
            <ThemedText 
              style={[
                styles.messageText, 
                message.role === 'user' 
                  ? { color: theme === 'light' ? Colors.dark.text : Colors.light.text } // User text color based on bubble
                  : { color: theme === 'light' ? Colors.dark.text : Colors.light.text }  // Assistant text color (can be different)
              ]}
            >
              {message.content}
            </ThemedText>
          </ThemedView>
        ))}
      </ScrollView>

      <ThemedView 
        style={[
          styles.inputContainer, 
          { borderTopColor: theme === 'light' ? Colors.light.icon : Colors.dark.icon }
        ]}
      >
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
  },
  messagesContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%', // Slightly increased max width
    paddingHorizontal: 14, // Adjusted padding
    paddingVertical: 10,  // Adjusted padding
    borderRadius: 18,    // More rounded bubbles
    minWidth: '10%',     // Ensure very short messages still have some width
  },
  userBubble: {
    // alignSelf will be set dynamically
  },
  assistantBubble: {
    // alignSelf will be set dynamically
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22, // Added for better readability
    // color is now set dynamically
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Align items to center for multiline input
    gap: 8, // Reduced gap
    paddingVertical: 8,
    paddingHorizontal: 12, // Added horizontal padding
    borderTopWidth: 1,
    // borderTopColor is set dynamically
  },
  input: {
    flex: 1,
    borderWidth: 1.5, // Slightly thicker border
    // borderColor is set dynamically in the component
    borderRadius: 20, // More rounded input
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 8, // Adjust padding for iOS multiline
    paddingBottom: Platform.OS === 'ios' ? 12 : 8, // Adjust padding for iOS multiline
    fontSize: 16, // Ensure input text size matches message text
    minHeight: 44, // Adjusted min height
    maxHeight: 120,
  },
  sendButton: {
    padding: 10, // Slightly larger touch target
    justifyContent: 'center',
    alignItems: 'center',
    height: 44, // Match minHeight of input
    width: 44,  // Match minHeight of input
  },
});
