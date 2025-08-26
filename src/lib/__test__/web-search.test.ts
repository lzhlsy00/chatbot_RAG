import { WebSearchClient } from '../web-search-client';

// 简单的测试来验证搜索逻辑
describe('WebSearchClient', () => {
  let client: WebSearchClient;

  beforeEach(() => {
    client = new WebSearchClient('', ''); // 不提供真实的API密钥
  });

  describe('shouldPerformWebSearch', () => {
    test('should return true when no knowledge recall', () => {
      const result = client.shouldPerformWebSearch(null, '什么是人工智能？');
      expect(result).toBe(true);
    });

    test('should return true when knowledge recall is empty', () => {
      const result = client.shouldPerformWebSearch({ chunks: [] }, '什么是人工智能？');
      expect(result).toBe(true);
    });

    test('should return true for time-related queries', () => {
      const knowledgeRecall = { chunks: [{ meta: { link: { title: 'test', url: 'test' } } }] };
      
      expect(client.shouldPerformWebSearch(knowledgeRecall, '2024年最新的AI发展')).toBe(true);
      expect(client.shouldPerformWebSearch(knowledgeRecall, '最近的技术趋势')).toBe(true);
      expect(client.shouldPerformWebSearch(knowledgeRecall, '当前的市场情况')).toBe(true);
    });

    test('should return true for realtime queries', () => {
      const knowledgeRecall = { chunks: [{ meta: { link: { title: 'test', url: 'test' } } }] };
      
      expect(client.shouldPerformWebSearch(knowledgeRecall, '今日股价')).toBe(true);
      expect(client.shouldPerformWebSearch(knowledgeRecall, '最新新闻')).toBe(true);
      expect(client.shouldPerformWebSearch(knowledgeRecall, '天气预报')).toBe(true);
    });

    test('should return true when knowledge chunks are insufficient', () => {
      const knowledgeRecall = { chunks: [{ meta: { link: { title: 'test', url: 'test' } } }] };
      
      expect(client.shouldPerformWebSearch(knowledgeRecall, '普通问题')).toBe(true);
    });

    test('should return false when sufficient knowledge available', () => {
      const knowledgeRecall = { 
        chunks: [
          { meta: { link: { title: 'test1', url: 'test1' } } },
          { meta: { link: { title: 'test2', url: 'test2' } } },
          { meta: { link: { title: 'test3', url: 'test3' } } }
        ]
      };
      
      expect(client.shouldPerformWebSearch(knowledgeRecall, '普通问题')).toBe(false);
    });
  });
});