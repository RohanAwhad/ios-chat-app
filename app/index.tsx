import { useState, useRef } from 'react';
import { StyleSheet, TextInput, ScrollView, Keyboard, TouchableOpacity } from 'react-native';
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

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant.'
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: inputText }
          ],
          stream: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY', // TODO: Replace with stored key
          },
          responseType: 'stream',
        }
      );

      let content = '';
      const stream = response.data;
      
      stream.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
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
        });
      });

      stream.on('end', () => {
        // Finalize message if needed
      });

    } catch (error) {
      console.error('API call failed:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: 'Error: Failed to get response' } 
          : msg
      ));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
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
