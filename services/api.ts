import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatCompletionOptions = {
  messages: Message[];
  model: string;
  apiKey?: string;
  baseURL?: string;
  onData: (content: string) => void;
  onError: (error: string) => void;
};

export async function createChatCompletion({
  messages,
  model,
  apiKey,
  baseURL = 'https://api.openai.com/v1',
  onData,
  onError
}: ChatCompletionOptions) {
  try {
    const finalApiKey = apiKey || await AsyncStorage.getItem('openai-api-key');
    if (!finalApiKey) {
      Alert.alert('Error', 'Please set your API key in settings first');
      throw new Error('API key missing');
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseURL}/chat/completions`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${finalApiKey}`);

    let buffer = '';
    xhr.onprogress = (event) => {
      if (xhr.readyState === 3) {
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
              if (deltaContent) onData(deltaContent);
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
        onError(errorData.error?.message || `API Error: ${xhr.status}`);
      }
    };

    xhr.onerror = () => onError('Network error - failed to connect to API');

    xhr.send(JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...messages,
      ],
      stream: true,
    }));

  } catch (error: any) {
    onError(error.message || 'Failed to get response');
  }
}
