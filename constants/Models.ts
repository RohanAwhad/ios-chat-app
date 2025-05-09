export type ModelConfig = {
  name: string;
  baseURL: string;
  apiKeyName: string;
};

export const MODELS = {
  OPENAI: {
    name: 'gpt-4o-mini',
    baseURL: 'https://api.openai.com/v1',
    apiKeyName: 'openai-api-key'
  },
} as const;
