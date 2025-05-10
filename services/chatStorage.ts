import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '@/services/api';

export type ChatThread = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};

export const CHAT_STORAGE_KEY = 'chatHistory';

export async function saveChat(chat: ChatThread): Promise<void> {
  const history = await getChatHistory();
  // Remove existing chat if present
  const filtered = history.filter(c => c.id !== chat.id);
  // Add new chat to beginning and keep only last 30
  await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([chat, ...filtered.slice(0, 29)]));
}

export async function getChatHistory(): Promise<ChatThread[]> {
  const data = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function deleteChat(id: string): Promise<void> {
  const history = await getChatHistory();
  const filtered = history.filter(c => c.id !== id);
  await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(filtered));
}
