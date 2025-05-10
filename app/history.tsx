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
              { 
                backgroundColor: theme === 'light' ? Colors.light.background : Colors.dark.background,
                borderColor: Colors[theme].icon // Dynamic border color
              }
            ]}
            onPress={() => {
              router.replace({
                pathname: '/',
                params: { chatId: item.id }
              });
              router.dismiss(); // Dismiss the history modal after selection

            }}


          >
            <ThemedText type="defaultSemiBold" style={{flex: 1}} numberOfLines={1} ellipsizeMode="tail">{item.title}</ThemedText>
            <ThemedText type="default" style={[styles.date, {color: Colors[theme].icon}]}>
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
    paddingHorizontal: 8, // Added to align with list items if container has padding
  },
  list: {
    gap: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20, // Increased padding for better touch area and spacing
    borderRadius: 10, // Slightly more rounded
    borderWidth: 1,
    // borderColor will be set dynamically based on theme
  },
  date: {
    marginLeft: 'auto',
    marginRight: 12, // Adjusted spacing
    fontSize: 14, // Slightly smaller date text
    // color will be set by ThemedText or dynamically
  },
  chevron: {
    // transform: [{ rotate: '180deg' }], // Removed rotation
  },
});

