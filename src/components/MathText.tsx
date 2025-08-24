'use client';

import { useEffect, useRef, memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
      let processedText = children;
      
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
      while ((match = blockDollarRegex.exec(children)) !== null) {
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
      while ((match = blockBracketRegex.exec(children)) !== null) {
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
      while ((match = inlineParenRegex.exec(children)) !== null) {
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
      while ((match = inlineDollarRegex.exec(children)) !== null) {
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

      container.innerHTML = processedText;
    } catch (error) {
      // 如果出现任何错误，显示原文
      console.error('MathText rendering error:', error);
      container.textContent = children;
    }
  }, [children]);

  return (
    <div 
      ref={containerRef}
      className="whitespace-pre-wrap text-gray-800 leading-relaxed text-[15px] font-normal min-h-[1.5em]"
      style={{ contain: 'layout' }}
    />
  );
});

export default MathText;