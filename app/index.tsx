import { useState, useRef, useEffect } from 'react';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';

import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createChatCompletion } from '@/services/api';
import { MODELS } from '@/constants/Models';
import { StyleSheet, TextInput, ScrollView, Keyboard, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { getChatHistory, saveChat } from '@/services/chatStorage'; // Import chat storage functions

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';

// This Message type is used by the ChatScreen UI and includes an 'id' for React keys.
// It's compatible with StoredMessage in chatStorage.ts
type Message = {
  role: 'user' | 'assistant';
  content: string;
  id: string;
};

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load or initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      console.log("[ChatScreen InitializeChat] Triggered. Params:", JSON.stringify(params), "CurrentChatID before:", currentChatId);

      if (params.newChat === "true") {
        const newChatId = Date.now().toString();
        console.log("[ChatScreen InitializeChat] New chat requested. ID:", newChatId);
        setCurrentChatId(newChatId);
        setMessages([]);
        router.replace(`/?chatId=${newChatId}&isNew=true`); // Add isNew flag
        return;
      }

      if (params.newChat === "true") {
        const newChatId = Date.now().toString();
        console.log("[ChatScreen InitializeChat] New chat requested. ID:", newChatId);
        setCurrentChatId(newChatId);
        setMessages([]);
        router.replace(`/?chatId=${newChatId}`); // Remove isNew flag
        return;
      }

      if (params.chatId) {
        const chatIdFromParam = params.chatId as string;

        // If we're already viewing this chat and have messages, don't reload
        if (chatIdFromParam === currentChatId && messages.length > 0) {
          console.log(`[ChatScreen InitializeChat] Already on chat ${chatIdFromParam}. Current messages: ${messages.length}`);
          return;
        }

        console.log(`[ChatScreen InitializeChat] Loading chat for ID: ${chatIdFromParam}`);
        const history = await getChatHistory();
        const chat = history.find(c => c.id === chatIdFromParam);

        if (chat) {
          console.log("[ChatScreen InitializeChat] Chat found in history. Loading messages:", chat.messages.length);
          setCurrentChatId(chat.id);
          setMessages(chat.messages);
        } else {
          console.log(`[ChatScreen InitializeChat] Chat ${chatIdFromParam} not found in history. Starting new chat with this ID.`);
          setCurrentChatId(chatIdFromParam);
          setMessages([]);
        }
      } else if (!currentChatId) {
        // No params, and no chat active (e.g., initial app load without specific chat in URL)
        const newChatId = Date.now().toString();
        console.log("[ChatScreen InitializeChat] No params and no active chat. Creating default new chat. ID:", newChatId);
        setCurrentChatId(newChatId);
        setMessages([]);
        router.replace(`/?chatId=${newChatId}`);
      } else {
        console.log(`[ChatScreen InitializeChat] No relevant params, but chat ${currentChatId} is active. Maintaining current state.`);
      }

    };

    initializeChat();
  }, [params.chatId, params.newChat]); // Dependencies: params that guide initialization



  // Auto-save chat when messages change
  useEffect(() => {
    // Save chat when messages change
    if (currentChatId && messages.length > 0) {
      console.log(`[ChatScreen SaveEffect] Attempting to save chat ID: ${currentChatId}, messages count: ${messages.length}`);
      const saveCurrentChat = async () => {
        await saveChat({
          id: currentChatId!, // currentChatId is checked, so it's not null
          title: messages[0]?.content.substring(0, 50) || 'New Chat',
          messages, // These are UI Message type, compatible with StoredMessage
          createdAt: Date.now()
        });
      };
      saveCurrentChat();
    } else {
      console.log(`[ChatScreen SaveEffect] Not saving. currentChatId: ${currentChatId}, messages.length: ${messages.length}`);
    }
  }, [messages, currentChatId]);


  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);


  const scrollViewRef = useRef<ScrollView>(null);
  const theme = useColorScheme() ?? 'light';

  const [selectedModel, setSelectedModel] = useState<keyof typeof MODELS>('GPT_4O_MINI');

  useFocusEffect(() => {
    const loadModel = async () => {
      const savedModel = await AsyncStorage.getItem('selected-model');
      if (savedModel && Object.keys(MODELS).includes(savedModel)) {
        setSelectedModel(savedModel as keyof typeof MODELS);
      }
    };
    loadModel();
  });


  const handleAttachImage = async () => {
    Alert.alert(
      'Add Media',
      'Choose media source',
      [
        {
          text: 'Camera',
          onPress: () => takePhoto(),
        },
        {
          text: 'Photos',
          onPress: () => pickImage(),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
    }
  };

  const pickImage = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 30,
      orderedSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(a => a.uri);
      if (selectedImages.length + newUris.length > 30) {
        Alert.alert('Maximum 30 images allowed');
        return;
      }
      setSelectedImages(prev => [...prev, ...newUris]);
    }
  };

  const handleSend = async () => {

    if (!inputText.trim()) return;

    const currentInputText = inputText;
    setInputText('');
    Keyboard.dismiss();

    const timestamp = Date.now().toString();
    const userMessage: Message = {
      role: 'user',
      content: currentInputText,
      id: timestamp,
    };

    const modelConfig = MODELS[selectedModel];
    const apiKey = await AsyncStorage.getItem(modelConfig.apiKeyName);
    if (!apiKey) {
      Alert.alert('Error', `Please configure the ${modelConfig.apiKeyName} in settings`);
      return;
    }


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
      let accumulatedContent = '';

      await createChatCompletion({
        messages: messagesForApi,
        model: modelConfig.name,
        baseURL: modelConfig.baseURL,
        apiKey: apiKey,


        onData: (deltaContent) => {
          accumulatedContent += deltaContent;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        },
        onError: (errorMessage) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent ? `${accumulatedContent}\n${errorMessage}` : errorMessage }
                : msg
            )
          );
        }
      });
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
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 100 })}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
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

        {selectedImages.length > 0 && (
          <ScrollView
            horizontal
            style={styles.previewContainer}
            contentContainerStyle={styles.previewContent}
          >
            {selectedImages.map((uri, index) => (
              <ThemedView key={uri} style={styles.imagePreview}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                >
                  <IconSymbol name="xmark" size={16} color={Colors[theme].text} />
                </TouchableOpacity>
              </ThemedView>
            ))}
          </ScrollView>
        )}
        <ThemedView style={[
          styles.inputContainer,
          { borderTopColor: theme === 'light' ? Colors.light.icon : Colors.dark.icon }
        ]}>
          <TouchableOpacity
            onPress={handleAttachImage}
            style={styles.attachButton}
          >
            <IconSymbol name="paperclip" size={24} color={Colors[theme].tint} />
          </TouchableOpacity>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    maxHeight: 100,
    paddingVertical: 8,
  },
  previewContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  attachButton: {
    padding: 8,
  },

  container: {
    flex: 1,
  },
  keyboardAvoid: {
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
    paddingTop: 8,
    paddingBottom: 36,
    paddingHorizontal: 12,
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
