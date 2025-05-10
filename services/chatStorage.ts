import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the message structure as stored, which includes the ID for UI purposes
export type StoredMessage = {
  role: 'user' | 'assistant';
  content: string;
  id: string;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: number;
};

export const CHAT_STORAGE_KEY = 'chatHistory';

export async function saveChat(chat: ChatThread): Promise<void> {
  const history = await getChatHistory();
  // Remove existing chat if present
  const filtered = history.filter(c => c.id !== chat.id);
  // Add new chat to beginning and keep only last 30
  const newHistory = [chat, ...filtered.slice(0, 29)];
  await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(newHistory));
  console.log(`[ChatStorage] Saved chat ID: ${chat.id}. Total history: ${newHistory.length}`);
}

export async function getChatHistory(): Promise<ChatThread[]> {
  const data = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
  const chats: ChatThread[] = data ? JSON.parse(data) : [];
  console.log(`[ChatStorage] Retrieved ${chats.length} chats from history.`);
  return chats;
}

export async function deleteChat(id: string): Promise<void> {

  const history = await getChatHistory();
  const filtered = history.filter(c => c.id !== id);
  await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(filtered));
}
