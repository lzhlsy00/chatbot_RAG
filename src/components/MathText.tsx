'use client';

import { useEffect, useRef, memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

interface MathTextProps {
  children: string;
}

const MathText = memo(function MathText({ children }: MathTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevChildrenRef = useRef<string>('');

  useEffect(() => {
    // 如果内容没有变化，不重新渲染
    if (prevChildrenRef.current === children) {
      return;
    }
    prevChildrenRef.current = children;
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    try {
      // 创建一个临时标记，用于保护数学公式
      const mathPlaceholders: { [key: string]: string } = {};
      let mathIndex = 0;
      
      // 先替换所有数学公式为占位符
      let textWithPlaceholders = children;
      
      // 块级公式 $$...$$
      textWithPlaceholders = textWithPlaceholders.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
        const placeholder = `MATH_BLOCK_${mathIndex++}`;
        mathPlaceholders[placeholder] = match;
        return placeholder;
      });
      
      // 块级公式 \[...\]
      textWithPlaceholders = textWithPlaceholders.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
        const placeholder = `MATH_BLOCK_${mathIndex++}`;
        mathPlaceholders[placeholder] = match;
        return placeholder;
      });
      
      // 内联公式 \(...\)
      textWithPlaceholders = textWithPlaceholders.replace(/\\\((.*?)\\\)/g, (match, formula) => {
        const placeholder = `MATH_INLINE_${mathIndex++}`;
        mathPlaceholders[placeholder] = match;
        return placeholder;
      });
      
      // 内联公式 $...$ - 改进的正则表达式，避免匹配单独的$
      textWithPlaceholders = textWithPlaceholders.replace(/\$(?!\$)((?:[^\$\n]|\\\$)+?)\$(?!\$)/g, (match, formula) => {
        const placeholder = `MATH_INLINE_${mathIndex++}`;
        mathPlaceholders[placeholder] = match;
        return placeholder;
      });
      
      // 配置 marked 渲染器，为链接添加安全属性
      const renderer = new marked.Renderer();
      renderer.link = (href, title, text) => {
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
      };
      
      // 使用 marked 解析 Markdown
      let processedText = marked.parse(textWithPlaceholders, {
        breaks: true,
        gfm: true,
        renderer: renderer,
      }) as string;
      
      // 恢复数学公式占位符
      Object.entries(mathPlaceholders).forEach(([placeholder, original]) => {
        processedText = processedText.replace(new RegExp(placeholder, 'g'), original);
      });
      
      // 存储所有匹配的公式及其位置，避免重叠处理
      const matches: Array<{
        start: number;
        end: number;
        original: string;
        replacement: string;
        type: string;
      }> = [];

      // 1. 匹配块级公式 $$...$$ 
      const blockDollarRegex = /\$\$([\s\S]*?)\$\$/g;
      let match;
      while ((match = blockDollarRegex.exec(processedText)) !== null) {
        try {
          const rendered = katex.renderToString(match[1].trim(), {
            displayMode: true,
            throwOnError: false,
          });
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            original: match[0],
            replacement: `<div class="block-math my-2">${rendered}</div>`,
            type: 'block-dollar'
          });
        } catch (e) {
          console.warn('Failed to render block math ($$):', match[1], e);
        }
      }

      // 2. 匹配块级公式 \[...\]
      const blockBracketRegex = /\\\[([\s\S]*?)\\\]/g;
      blockBracketRegex.lastIndex = 0;
      while ((match = blockBracketRegex.exec(processedText)) !== null) {
        // 检查是否与已有匹配重叠
        const overlaps = matches.some(m => 
          (match!.index >= m.start && match!.index < m.end) ||
          (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
        );
        
        if (!overlaps) {
          try {
            const rendered = katex.renderToString(match[1].trim(), {
              displayMode: true,
              throwOnError: false,
            });
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              original: match[0],
              replacement: `<div class="block-math my-2">${rendered}</div>`,
              type: 'block-bracket'
            });
          } catch (e) {
            console.warn('Failed to render block math (\\[\\]):', match[1], e);
          }
        }
      }

      // 3. 匹配内联公式 \(...\)
      const inlineParenRegex = /\\\((.*?)\\\)/g;
      inlineParenRegex.lastIndex = 0;
      while ((match = inlineParenRegex.exec(processedText)) !== null) {
        const overlaps = matches.some(m => 
          (match!.index >= m.start && match!.index < m.end) ||
          (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
        );
        
        if (!overlaps) {
          try {
            const rendered = katex.renderToString(match[1].trim(), {
              displayMode: false,
              throwOnError: false,
            });
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              original: match[0],
              replacement: `<span class="inline-math">${rendered}</span>`,
              type: 'inline-paren'
            });
          } catch (e) {
            console.warn('Failed to render inline math (\\(\\)):', match[1], e);
          }
        }
      }

      // 4. 匹配内联公式 $...$（避免匹配 $$...$$）
      const inlineDollarRegex = /\$([^$]+?)\$/g;
      inlineDollarRegex.lastIndex = 0;
      while ((match = inlineDollarRegex.exec(processedText)) !== null) {
        const overlaps = matches.some(m => 
          (match!.index >= m.start && match!.index < m.end) ||
          (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
        );
        
        if (!overlaps) {
          try {
            const rendered = katex.renderToString(match[1].trim(), {
              displayMode: false,
              throwOnError: false,
            });
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              original: match[0],
              replacement: `<span class="inline-math">${rendered}</span>`,
              type: 'inline-dollar'
            });
          } catch (e) {
            console.warn('Failed to render inline math ($):', match[1], e);
          }
        }
      }

      // 按位置倒序排序，从后往前替换避免位置偏移
      matches.sort((a, b) => b.start - a.start);
      
      // 执行替换
      for (const m of matches) {
        processedText = processedText.substring(0, m.start) + 
                      m.replacement + 
                      processedText.substring(m.end);
      }

      // 使用 DOMPurify 清理 HTML 以确保安全
      const cleanHTML = DOMPurify.sanitize(processedText, {
        ALLOWED_TAGS: [
          'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'blockquote', 'code', 'pre', 'span', 'div',
          'ul', 'ol', 'li', 'dl', 'dt', 'dd',
          'a', 'abbr', 'acronym', 'b', 'strong', 'i', 'em',
          'u', 's', 'sub', 'sup', 'kbd', 'hr',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'img', 'figure', 'figcaption'
        ],
        ALLOWED_ATTR: [
          'href', 'title', 'target', 'rel', 'class', 'id',
          'src', 'alt', 'width', 'height', 'style'
        ],
        ALLOWED_CLASSES: {
          '*': ['katex', 'katex-*', 'block-math', 'inline-math', 'language-*']
        }
      });

      container.innerHTML = cleanHTML;
      
      // 应用代码高亮
      container.querySelectorAll('pre code').forEach((block) => {
        // 获取语言类名
        const className = block.className || '';
        const match = className.match(/language-(\w+)/);
        if (match) {
          const language = match[1];
          if (Prism.languages[language]) {
            const code = block.textContent || '';
            const highlighted = Prism.highlight(code, Prism.languages[language], language);
            block.innerHTML = highlighted;
          }
        }
      });
    } catch (error) {
      // 如果出现任何错误，显示原文
      console.error('MathText rendering error:', error);
      container.textContent = children;
    }
  }, [children]);

  return (
    <div 
      ref={containerRef}
      className="markdown-content whitespace-pre-wrap text-gray-800 leading-relaxed text-[15px] font-normal min-h-[1.5em]"
      style={{ contain: 'layout' }}
    />
  );
});

export default MathText;