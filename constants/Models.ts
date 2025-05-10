export type ModelConfig = {
  name: string;
  baseURL: string;
  apiKeyName: string;
};

export const MODELS = {
  GPT_4O_MINI: {
    name: 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1',
    apiKeyName: 'openai-api-key'
  },
  GPT_4O: {
    name: 'gpt-4o',
    baseURL: 'https://api.openai.com/v1',
    apiKeyName: 'openai-api-key'
  },
  DEEPSEEK_CHAT: {
    name: 'deepseek-chat',
    baseURL: 'https://api.deepseek.com/',
    apiKeyName: 'deepseek-api-key'
  },
  GEMINI_FLASH: {
    name: 'gemini-2.0-flash',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKeyName: 'gemini-api-key'
  },
  CLAUDE_HAIKU: {
    name: 'claude-3-5-haiku-latest',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeyName: 'anthropic-api-key'
  },
  CLAUDE_SONNET: {
    name: 'claude-3-7-sonnet-20250219',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeyName: 'anthropic-api-key'
  },

} as const;
