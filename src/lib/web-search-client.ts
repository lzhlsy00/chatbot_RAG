interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'web';
}

export class WebSearchClient {
  private apiKey: string;
  private searchEngineId: string;

  constructor(apiKey?: string, searchEngineId?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID || '';
  }

  async search(query: string, limit: number = 5): Promise<WebSearchResult[]> {
    try {
      // 如果没有配置搜索API，返回空结果
      if (!this.apiKey || !this.searchEngineId) {
        console.log('Web search not configured, skipping search');
        return [];
      }

      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(query)}&num=${limit}`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        console.error('Search API error:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      
      if (!data.items) {
        return [];
      }

      return data.items.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'web' as const
      }));
    } catch (error) {
      console.error('Web search error:', error);
      return [];
    }
  }

  // 判断是否需要联网搜索的简单逻辑
  shouldPerformWebSearch(knowledgeRecall: any, query: string): boolean {
    // 如果没有知识库检索结果
    if (!knowledgeRecall || !knowledgeRecall.chunks || knowledgeRecall.chunks.length === 0) {
      return true;
    }

    // 如果查询包含时间相关关键词（最新、今年、2024、最近等）
    const timeKeywords = ['最新', '今年', '2024', '2025', '最近', '现在', '当前', '目前', 'latest', 'current', 'recent'];
    if (timeKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      return true;
    }

    // 如果查询包含实时性关键词
    const realtimeKeywords = ['新闻', '股价', '天气', '汇率', '价格', 'news', 'weather', 'price'];
    if (realtimeKeywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      return true;
    }

    // 可以根据知识库检索结果的质量来判断
    // 这里简化处理，如果知识库检索到的内容很少，也进行网络搜索
    const totalChunks = knowledgeRecall.chunks?.length || 0;
    if (totalChunks < 2) {
      return true;
    }

    return false;
  }
}