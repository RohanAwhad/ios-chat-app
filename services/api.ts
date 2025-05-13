import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { MODELS } from '@/constants/Models';


type ChatCompletionOptions = {
  messages: {
    role: 'user' | 'assistant' | 'tool';
    content: string;
    images?: {
      uri: string;
      base64?: string;
      mimeType: string;
    }[];
    tool_call_id?: string;
  }[];


  model: string;
  apiKey?: string;
  baseURL?: string;
  onData: (content: string) => void;
  onError: (error: string) => void;
  // onToolCall?: (toolCall: { name: string; args: string }) => Promise<string>;

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
  // onToolCall
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
          providerHandlers.handleStreamData(line, onData, pendingToolCall, (toolCall) => {
            pendingToolCall = toolCall;
          });

        }
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 400) {
        const errorData = JSON.parse(xhr.responseText);
        onError(errorData.error?.message || `API Error: ${xhr.status}`);
        return;
      }

      if (pendingToolCall && pendingToolCall.id && pendingToolCall.name) {
        isToolCallInProgress = true;

        try {
          // Parse the arguments
          const args = JSON.parse(pendingToolCall.args);
          const toolResult = await searchBrave(args.query);

          // Create updated messages with tool result
          const updatedMessages = [
            ...messages,
            {
              role: 'tool',
              content: toolResult,
              tool_call_id: pendingToolCall.id
            }
          ];

          // Make a new request with the tool result
          const followUpXhr = new XMLHttpRequest();
          const { endpoint, headers, body } = providerHandlers.getRequestConfig({
            model,
            messages: updatedMessages,
            baseURL,
            apiKey: finalApiKey
          });

          followUpXhr.open('POST', endpoint);
          Object.entries(headers).forEach(([key, value]) => {
            followUpXhr.setRequestHeader(key, value);
          });

          let followUpBuffer = '';

          followUpXhr.onprogress = (event) => {
            if (followUpXhr.readyState === 3) {
              const chunk = followUpXhr.responseText.substring(followUpBuffer.length);
              followUpBuffer += chunk;

              const lines = chunk.split('\n');
              for (const line of lines) {
                providerHandlers.handleStreamData(line, onData, null, () => { });
              }
            }
          };

          followUpXhr.onload = () => {
            if (followUpXhr.status >= 400) {
              console.error('Follow-up API failed with status:', followUpXhr.status);
              console.error('Response text:', followUpXhr.responseText);
              onError(`Follow-up API error: ${followUpXhr.status}`);
            }
            isToolCallInProgress = false;
          };




          followUpXhr.onerror = () => {
            onError('Network error in follow-up request');
            isToolCallInProgress = false;
          };

          followUpXhr.send(body);

        } catch (error) {
          onError(`Tool call failed: ${error.message}`);
          isToolCallInProgress = false;
        }
      }
    }

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
  getRequestConfig: ({ model, messages, baseURL, apiKey }) => {
    const modelConfig = Object.values(MODELS).find(m => m.name === model);
    return {

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
            // Create base message with tool_call_id if present
            const baseMsg = {
              role: msg.role,
              ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id })
            };

            if (!msg.images || msg.images.length === 0) {
              return { ...baseMsg, content: msg.content };
            }

            return {
              ...baseMsg,
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
        stream: true,
        tools: modelConfig?.tools?.map(tool => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema
          }
        }))
      })
    }
  },



  handleStreamData: (line, onData, pendingToolCall, onToolCall) => {

    if (line.startsWith('data: ')) {
      const data = line.substring(6).trim();
      if (data === '[DONE]') {
        console.debug('OpenAI stream completed');
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const toolCall = parsed.choices[0]?.delta?.tool_calls?.[0];

        console.log('toolCall')
        console.log(toolCall)
        console.log('pendingToolCall')
        console.log(pendingToolCall)
        if (toolCall?.function) {
          console.debug(JSON.stringify(toolCall))
          if (toolCall.id && !pendingToolCall) {
            console.debug('creating pending toolcall')
            pendingToolCall = {
              id: toolCall.id,
              name: toolCall.function.name,
              args: toolCall.function.arguments
            };
            onToolCall?.(pendingToolCall);
          } else if (pendingToolCall) {
            console.debug('updateding pending toolcall')
            pendingToolCall.args += toolCall.function.arguments;
          }
        }
        // else if (toolCall === undefined && pendingToolCall) {
        //   console.log('calling on toolcall callback')
        //   // onToolCall?.(pendingToolCall);
        //   // pendingToolCall = null;
        // }

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
  getRequestConfig: ({ model, messages, baseURL, apiKey }) => {
    const modelConfig = Object.values(MODELS).find(m => m.name === model);
    return {

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
        stream: true,
        tools: modelConfig?.tools
      })
    }
  },


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



