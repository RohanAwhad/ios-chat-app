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
    role: 'user' | 'assistant' | 'tool';
    content: string;
    images?: Array<{
      uri: string;
      base64?: string;
      mimeType: string;
    }>;
    tool_call_id?: string;
  }>;


  model: string;
  apiKey?: string;
  baseURL?: string;
  onData: (content: string) => void;
  onError: (error: string) => void;
  onToolCall?: (toolCall: { name: string; args: string }) => Promise<string>;

};

let isToolCallInProgress = false;

async function searchBrave(query: string): Promise<string> {
  try {
    console.log(`called searchBrave function with query: ${query}`)
    const apiKey = await AsyncStorage.getItem('brave-api-key');
    if (!apiKey) throw new Error('Missing Brave API key');

    const params = new URLSearchParams({ q: query, count: '10' });
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: { 'X-Subscription-Token': apiKey }
    });

    if (!response.ok) throw new Error(`Brave API error: ${response.statusText}`);

    const data = await response.json();
    const results = data.web?.results.slice(0, 10).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description
    })) || [];

    console.log('results')
    console.log(JSON.stringify(results))
    return JSON.stringify(results);
  } catch (error: any) {
    console.error('Brave search failed:', error);
    return JSON.stringify({ error: error.message });
  }
}

export async function createChatCompletion({
  messages,
  model,
  apiKey,
  baseURL = 'https://api.openai.com/v1',
  onData,
  onError,
  onToolCall
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

    if (isToolCallInProgress) return;

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
    let pendingToolCall: { id: string; name: string; args: string } | null = null;

    xhr.onprogress = (event) => {
      if (xhr.readyState === 3) {
        const chunk = xhr.responseText.substring(buffer.length);
        buffer += chunk;

        const lines = chunk.split('\n');
        for (const line of lines) {
          providerHandlers.handleStreamData(line, onData, (toolCall) => {
            pendingToolCall = toolCall;
          });

        }
      }
    };

    xhr.onload = async () => {
      console.debug('Request completed with status:', xhr.status);

      if (pendingToolCall && onToolCall) {
        isToolCallInProgress = true;
        try {
          const args = JSON.parse(pendingToolCall.args);
          const toolResult = await searchBrave(args.query);

          messages.push({
            role: 'tool',
            content: toolResult,
            tool_call_id: pendingToolCall.id
          });

          // Continue the conversation with tool result
          createChatCompletion({
            messages,
            model,
            apiKey,
            baseURL,
            onData,
            onError,
            onToolCall
          });
        } catch (error: any) {
          onError(`Tool call failed: ${error.message}`);
        } finally {
          isToolCallInProgress = false;
        }
        return;
      }

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
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...messages.map(msg => {
          // If there are no images, return a simple message object
          if (!msg.images || msg.images.length === 0) {
            return {
              role: msg.role,
              content: msg.content
            };
          }

          // If there are images, construct the content array format
          return {
            role: msg.role,
            content: [
              { type: 'text', text: msg.content },
              ...msg.images.map(img => ({
                type: 'image_url',
                image_url: {
                  url: `data:${img.mimeType};base64,${img.base64}`
                }
              }))
            ]
          };
        })
      ],
      stream: true
    })
  }),


  handleStreamData: (line, onData, onToolCall) => {

    if (line.startsWith('data: ')) {
      const data = line.substring(6).trim();
      if (data === '[DONE]') {
        console.debug('OpenAI stream completed');
        return;
      }

      try {
        const parsed = JSON.parse(data);
        // console.debug('OpenAI stream data:', parsed);
        // Handle tool call deltas
        const toolCall = parsed.choices[0]?.delta?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          if (toolCall.id && !pendingToolCall) {
            pendingToolCall = {
              id: toolCall.id,
              name: toolCall.function.name,
              args: toolCall.function.arguments
            };
          } else if (pendingToolCall) {
            pendingToolCall.args += toolCall.function.arguments;
          }
        }


        const deltaContent = parsed.choices[0]?.delta?.content;
        if (deltaContent) onData(deltaContent);

        // Finalize tool call if needed
        if (parsed.choices[0]?.finish_reason === 'tool_calls' && pendingToolCall) {
          onToolCall?.(pendingToolCall);
        }

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

  handleStreamData: (line, onData, onToolCall) => {

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



