import { useState, useEffect, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getChatHistory, ChatThread } from '@/services/chatStorage';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function HistoryScreen() {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const theme = useColorScheme() ?? 'light';

  // useFocusEffect to reload history when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        console.log("[HistoryScreen] Loading chat history");
        const loadedChats = await getChatHistory();
        console.log(`[HistoryScreen] Loaded ${loadedChats.length} chats`);
        setChats(loadedChats);
      };
      loadHistory();
    }, [])
  );

  return (
    <ThemedView style={styles.container}>

      <ThemedText type="title" style={styles.title}>Chat History</ThemedText>
      
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chatItem,
              { backgroundColor: theme === 'light' ? Colors.light.background : Colors.dark.background }
            ]}
            onPress={() => router.navigate(`/?chatId=${item.id}`)}
          >
            <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
            <ThemedText type="default" style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </ThemedText>
            <IconSymbol
              name="chevron.right"
              size={16}
              color={Colors[theme].icon}
              style={styles.chevron}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
  },
  list: {
    gap: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  date: {
    marginLeft: 'auto',
    marginRight: 16,
    color: Colors.light.icon,
  },
  chevron: {
    transform: [{ rotate: '180deg' }],
  },
});
