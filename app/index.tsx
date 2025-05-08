import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
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
  const params = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    if (params.newChat === 'true') {
      setMessages([]);
      router.setParams({ newChat: undefined });
    }
  }, [params.newChat]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useColorScheme() ?? 'light';

  const handleSend = async () => {
    console.log(inputText);
    if (!inputText.trim()) return;

    // Capture current input and then clear it for better UX.
    const currentInputText = inputText;
    setInputText('');
    Keyboard.dismiss();

    const timestamp = Date.now().toString();
    const userMessage: Message = {
      role: 'user',
      content: currentInputText,
      id: timestamp,
    };

    const assistantMessageId = timestamp + '-assistant';
    const assistantMessagePlaceholder: Message = {
      role: 'assistant',
      content: '', // Placeholder, will be filled by stream
      id: assistantMessageId,
    };

    // Prepare messages for the API: current history + new user message.
    // `messages` state here is the history *before* this send action.
    const messagesForApi = [...messages, userMessage].map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Update UI optimistically with user message and assistant placeholder.
    // Functional update ensures we use the latest `prevMessages` state.
    setMessages(prevMessages => [...prevMessages, userMessage, assistantMessagePlaceholder]);

    let accumulatedContent = '';

    try {
      const apiKey = await AsyncStorage.getItem('openai-api-key');
      if (!apiKey) {
        Alert.alert('Error', 'Please set your API key in settings first');
        // Remove the placeholder assistant message if API key is missing
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        return;
      }

      // Use XHR instead of fetch to properly handle streaming in React Native
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.openai.com/v1/chat/completions');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);

      let buffer = '';
      xhr.onprogress = (event) => {
        if (xhr.readyState === 3) { // LOADING state - receiving data
          const chunk = xhr.responseText.substring(buffer.length);
          buffer += chunk;

          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();
              if (data === '[DONE]') break;

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
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 400) {
          const errorData = JSON.parse(xhr.responseText);
          const errorMessage = errorData.error?.message || `API Error: ${xhr.status}`;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId ? { ...msg, content: errorMessage } : msg
            )
          );
        }
      };

      xhr.onerror = () => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: 'Network error - failed to connect to API' }
              : msg
          )
        );
      };

      xhr.send(JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          ...messagesForApi,
        ],
        stream: true,
      }));
    } catch (error: any) { // Catches network errors, AsyncStorage errors, etc.
      console.error('API call failed:', error);
      const errorMessage = `Error: ${error.message || 'Failed to get response'}`;
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedContent ? `${accumulatedContent}\n${errorMessage}` : errorMessage }
            : msg
        )
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
