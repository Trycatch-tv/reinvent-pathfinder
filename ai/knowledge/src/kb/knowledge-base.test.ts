import { describe, it, expect } from 'vitest';
import {
  SessionDocumentTransformer,
  InMemoryKnowledgeBaseRetriever,
  BedrockAgentRuntimeKnowledgeBaseClient,
} from '../index.js';
import type { SessionCandidate, KnowledgeGap } from '@pathfinder/domain';

describe('Bedrock Managed Knowledge Base Ingestion & Semantic Retrieval', () => {
  const sampleSessions: readonly SessionCandidate[] = [
    {
      id: 'sess-aim-301',
      code: 'AIM301',
      title: 'Building Autonomous Multi-Agent Systems with Amazon Bedrock AgentCore',
      description: 'Learn how to architect, test, and deploy resilient AI agents using Amazon Bedrock AgentCore runtime and Strands SDK.',
      level: 300,
      format: 'breakout',
      topics: ['Generative AI', 'Agentic Workflows', 'Amazon Bedrock'],
      schedule: {
        day: '2026-12-01',
        startTime: '10:00',
        endTime: '11:00',
      },
      location: {
        venue: 'The Venetian',
        room: 'Palazzo Ballroom E',
      },
    },
    {
      id: 'sess-dat-304',
      code: 'DAT304',
      title: 'Advanced DynamoDB Design Patterns: Single-Table Architecture in Action',
      description: 'Deep dive into modeling complex multi-entity relationships using single-table design with DynamoDB, GSI overloading, and sparse indexes.',
      level: 300,
      format: 'breakout',
      topics: ['Amazon DynamoDB', 'NoSQL', 'Architecture'],
      schedule: {
        day: '2026-12-01',
        startTime: '11:30',
        endTime: '12:30',
      },
      location: {
        venue: 'The Venetian',
        room: 'Titian 2201',
      },
    },
    {
      id: 'sess-sec-305',
      code: 'SEC305',
      title: 'Zero Trust Architecture: Identity and Least Privilege in Cloud-Native Apps',
      description: 'Discover how to implement fine-grained authorization, workload identity federation, and secure token delegation with OAuth 2.0 PKCE.',
      level: 300,
      format: 'chalk-talk',
      topics: ['Security', 'Identity', 'OAuth 2.0'],
      schedule: {
        day: '2026-12-02',
        startTime: '14:00',
        endTime: '15:00',
      },
      location: {
        venue: 'Caesars Forum',
        room: 'Forum 110',
      },
    },
  ];

  describe('SessionDocumentTransformer', () => {
    it('transforms a session candidate into a structured Bedrock knowledge document with rich content and metadata', () => {
      const doc = SessionDocumentTransformer.transformOne(sampleSessions[0]!);

      expect(doc.id).toBe('doc-sess-aim-301');
      expect(doc.content).toContain('Session Code: AIM301');
      expect(doc.content).toContain('Building Autonomous Multi-Agent Systems');
      expect(doc.content).toContain('Amazon Bedrock AgentCore');
      expect(doc.content).toContain('Venue: The Venetian, Room: Palazzo Ballroom E');

      expect(doc.metadata.sessionId).toBe('sess-aim-301');
      expect(doc.metadata.code).toBe('AIM301');
      expect(doc.metadata.level).toBe(300);
      expect(doc.metadata.format).toBe('breakout');
      expect(doc.metadata.topics).toContain('Amazon Bedrock');
      expect(doc.metadata.venue).toBe('The Venetian');
    });

    it('transforms an array of sessions preserving collection length', () => {
      const docs = SessionDocumentTransformer.transform(sampleSessions);
      expect(docs.length).toBe(3);
    });
  });

  describe('InMemoryKnowledgeBaseRetriever', () => {
    const retriever = new InMemoryKnowledgeBaseRetriever(sampleSessions);

    it('retrieves relevant sessions based on semantic query text and computes confidence score', async () => {
      const result = await retriever.retrieve({
        text: 'How to build multi-agent workflows with Bedrock AgentCore',
        maxResults: 2,
      });

      expect(result.items.length).toBeGreaterThan(0);
      const topHit = result.items[0]!;
      expect(topHit.session.id).toBe('sess-aim-301');
      expect(topHit.score).toBeGreaterThan(0.3);
      expect(topHit.matchedTopics.length).toBeGreaterThan(0);
    });

    it('retrieves sessions tailored to a KnowledgeGap entity', async () => {
      const gap: KnowledgeGap = {
        id: 'gap-dynamo',
        topic: 'DynamoDB Single-Table Design',
        description: 'Advanced NoSQL composite keys and single-table architecture.',
        targetProficiency: 'professional',
        severity: 'critical',
        status: 'open',
        rationale: 'Project requires low-latency scalable persistence.',
        addressedBySessionIds: [],
      };

      const result = await retriever.retrieveForGap(gap);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]?.session.code).toBe('DAT304');
    });

    it('respects metadata filters for level and format', async () => {
      const result = await retriever.retrieve({
        text: 'architecture and security',
        filter: {
          format: 'chalk-talk',
        },
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0]?.session.code).toBe('SEC305');
    });

    it('returns empty result when no sessions match the query tokens', async () => {
      const result = await retriever.retrieve({
        text: 'quantum blockchain astrophysics',
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalRetrieved).toBe(0);
    });
  });

  describe('BedrockAgentRuntimeKnowledgeBaseClient', () => {
    it('falls back to in-memory retriever when knowledgeBaseId is not configured in local environment', async () => {
      const client = new BedrockAgentRuntimeKnowledgeBaseClient({
        fallbackSessions: sampleSessions,
      });

      const result = await client.retrieve({
        text: 'OAuth PKCE and zero trust security',
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]?.session.code).toBe('SEC305');
    });
  });
});
