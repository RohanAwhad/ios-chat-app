import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  images?: Array<{
    uri: string;
    base64?: string;
    mimeType: string;
  }>;
};


type ChatCompletionOptions = {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    images?: Array<{
      uri: string;
      base64?: string;
      mimeType: string;
    }>;
  }>;

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
    const isAnthropic = model.startsWith('claude');
    const providerHandlers = isAnthropic ? anthropicHandlers : openaiHandlers;

    // Get API key based on provider
    const finalApiKey = apiKey || await AsyncStorage.getItem(
      isAnthropic ? 'anthropic-api-key' : 'openai-api-key'
    );

    if (!finalApiKey) {
      Alert.alert('Error', `Please set your ${isAnthropic ? 'Anthropic' : 'OpenAI'} API key in settings first`);
      throw new Error('API key missing');
    }

    const xhr = new XMLHttpRequest();
    const { endpoint, headers, body } = providerHandlers.getRequestConfig({
      model,
      messages,
      baseURL,
      apiKey: finalApiKey
    });

    // console.debug('API Request Config:', { endpoint, headers, body: JSON.parse(body) });

    xhr.open('POST', endpoint);
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    let buffer = '';
    xhr.onprogress = (event) => {
      if (xhr.readyState === 3) {
        const chunk = xhr.responseText.substring(buffer.length);
        buffer += chunk;
        // console.debug('Received chunk:', chunk);

        const lines = chunk.split('\n');
        for (const line of lines) {
          providerHandlers.handleStreamData(line, onData);
        }
      }
    };

    xhr.onload = () => {
      console.debug('Request completed with status:', xhr.status);
      if (xhr.status >= 400) {
        console.error('API Error Response:', xhr.responseText);
        const errorData = JSON.parse(xhr.responseText);
        onError(errorData.error?.message || `API Error: ${xhr.status}`);
      }
    };

    xhr.onerror = (error) => {
      console.error('Network error:', error);
      onError('Network error - failed to connect to API');
    };

    console.debug('Sending request with body:', JSON.parse(body));
    xhr.send(body);
  } catch (error: any) {
    onError(error.message || 'Failed to get response');
  }
}

// OpenAI-specific handlers
const openaiHandlers = {
  getRequestConfig: ({ model, messages, baseURL, apiKey }) => ({
    endpoint: `${baseURL}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: 'You are a helpful assistant.' }, ...messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.images && msg.images.length > 0 && {
          images: msg.images.map(img => ({
            data: img.base64,
            mime_type: img.mimeType
          }))
        })
      }))],

      stream: true
    })
  }),

  handleStreamData: (line, onData) => {
    if (line.startsWith('data: ')) {
      const data = line.substring(6).trim();
      if (data === '[DONE]') {
        console.debug('OpenAI stream completed');
        return;
      }

      try {
        const parsed = JSON.parse(data);
        // console.debug('OpenAI stream data:', parsed);
        const deltaContent = parsed.choices[0]?.delta?.content;
        if (deltaContent) onData(deltaContent);
      } catch (e) {
        console.error('Error parsing OpenAI stream data:', e, 'Data:', data);
      }
    }
  }
};

// Anthropic-specific handlers
const anthropicHandlers = {
  getRequestConfig: ({ model, messages, baseURL, apiKey }) => ({
    endpoint: `${baseURL}/messages`,
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.images && msg.images.length > 0 && {
          content: [
            { type: 'text', text: msg.content },
            ...msg.images.map(img => ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: img.mimeType,
                data: img.base64
              }
            }))
          ]
        })
      })),

      max_tokens: 1024,
      stream: true
    })
  }),

  handleStreamData: (line, onData) => {
    if (line.startsWith('data: ')) {
      const data = line.substring(6).trim();
      try {
        const parsed = JSON.parse(data);
        // console.debug('Anthropic stream data:', parsed);
        if (parsed.type === 'content_block_delta') {
          const deltaContent = parsed.delta?.text;
          if (deltaContent) onData(deltaContent);
        }
      } catch (e) {
        console.error('Error parsing Anthropic stream data:', e, 'Data:', data);
      }
    }
  }
};



