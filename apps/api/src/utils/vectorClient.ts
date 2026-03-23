import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from './logger';

export interface VectorRecord {
  id: string;
  values: number[];
  metadata: any;
}

class MemoryVectorStore {
  private store: Map<string, VectorRecord> = new Map();

  async upsert(records: VectorRecord[]) {
    records.forEach(r => this.store.set(r.id, r));
  }

  async query(vector: number[], topK: number = 10) {
    const results = Array.from(this.store.values()).map(r => ({
      ...r,
      score: this.cosineSimilarity(vector, r.values)
    }));
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  private cosineSimilarity(v1: number[], v2: number[]) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }
}

const memoryStore = new MemoryVectorStore();

export class VectorClient {
  private pinecone?: Pinecone;
  private indexName: string = process.env.VECTOR_INDEX_NAME || 'eventify-vendors';

  constructor() {
    if (process.env.PINECONE_API_KEY) {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
    } else {
      logger.info('PINECONE_API_KEY not found. Using In-Memory Vector Store fallback.');
    }
  }

  async upsert(records: VectorRecord[]) {
    if (this.pinecone) {
      const index = this.pinecone.index(this.indexName);
      await index.upsert(records as any); // Pinecone client v3 uses an array of objects
    } else {
      await memoryStore.upsert(records);
    }
  }

  async query(vector: number[], topK: number = 10) {
    if (this.pinecone) {
      const index = this.pinecone.index(this.indexName);
      const results = await index.query({
        vector,
        topK,
        includeMetadata: true
      });
      return results.matches?.map(m => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata
      })) || [];
    } else {
      return memoryStore.query(vector, topK);
    }
  }
}

export const vectorClient = new VectorClient();
