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
} as const;
