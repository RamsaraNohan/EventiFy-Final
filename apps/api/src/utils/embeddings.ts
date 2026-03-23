import OpenAI from 'openai';
import { env } from '../config/env';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
});

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    // Return a random vector for testing if no key is provided
    return Array.from({ length: 1536 }, () => Math.random());
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  });

  return response.data[0].embedding;
}

export async function generateReason(vendor: any, query: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `${vendor.businessName} matches your interest in ${query} based on their specialized ${vendor.category} services.`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo', // lightweight for cost
    messages: [
      {
        role: 'system',
        content: 'You are an AI event planning assistant. Write a 1-sentence catchy reason why this vendor is a good match for the users query. Be specific and persuasive.'
      },
      {
        role: 'user',
        content: `User query: "${query}"\nVendor: ${vendor.businessName} (${vendor.category})\nDescription: ${vendor.description}`
      }
    ],
    max_tokens: 60,
  });

  return response.choices[0].message.content || 'Great match for your requirements.';
}
