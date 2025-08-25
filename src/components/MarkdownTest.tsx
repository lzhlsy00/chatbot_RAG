'use client';

import { useState } from 'react';
import MathText from './MathText';

const testContent = `# Markdown 功能测试

## 基本文本格式

这是一个普通段落，包含 **粗体文本** 和 *斜体文本*，以及 ~~删除线文本~~。

### 列表测试

无序列表：
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3

有序列表：
1. 第一步
2. 第二步
3. 第三步

### 引用块

> 这是一个引用块。
> 可以包含多行文本。

### 代码测试

行内代码：\`console.log('Hello World')\`

代码块：

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
\`\`\`

\`\`\`python
def hello_world():
    print("Hello, World!")
    return True

if __name__ == "__main__":
    hello_world()
\`\`\`

### 链接和图片

[访问 GitHub](https://github.com)

### 表格

| 姓名 | 年龄 | 职业 |
|------|------|------|
| 张三 | 25   | 工程师 |
| 李四 | 30   | 设计师 |
| 王五 | 28   | 产品经理 |

### 数学公式

行内公式：质能方程 $E = mc^2$

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

使用 \\LaTeX 语法的公式：

\\[
\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}
\\]

复杂公式示例：

$$
\\begin{aligned}
\\nabla \\times \\vec{\\mathbf{B}} -\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{E}}}{\\partial t} &= \\frac{4\\pi}{c}\\vec{\\mathbf{j}} \\\\
\\nabla \\cdot \\vec{\\mathbf{E}} &= 4 \\pi \\rho \\\\
\\nabla \\times \\vec{\\mathbf{E}}\\, +\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{B}}}{\\partial t} &= \\vec{\\mathbf{0}} \\\\
\\nabla \\cdot \\vec{\\mathbf{B}} &= 0
\\end{aligned}
$$

### 水平线

---

### 其他元素

使用 \`<kbd>\` 标签：按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制

上标和下标：X<sup>2</sup> + Y<sub>n</sub> = Z

### 混合内容

这是一个包含**粗体**、*斜体*、\`代码\`和数学公式 $\\alpha + \\beta = \\gamma$ 的段落。

### 引用测试

根据文档说明，RAG 系统的实现需要考虑以下几个方面：

[1] RAG 测试_常压立式圆筒形钢制焊接储罐池漏检测实施指南.pdf
[2] RAG 测试_在役常压储罐检验与适用性评价技术规范.pdf

也可以使用超链接格式：
- [RAG 测试文档1](https://example.com/doc1.pdf)
- [RAG 测试文档2](https://example.com/doc2.pdf)

或者内联引用：请参考 [[1]](#ref1) 和 [[2]](#ref2) 获取更多信息。

#### 参考文献
<div id="ref1">[1] RAG 测试_常压立式圆筒形钢制焊接储罐池漏检测实施指南.pdf</div>
<div id="ref2">[2] RAG 测试_在役常压储罐检验与适用性评价技术规范.pdf</div>

---

测试完成！`;

export default function MarkdownTest() {
  const [content, setContent] = useState(testContent);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Markdown 渲染测试</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">输入（Markdown）</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-4 border rounded-lg font-mono text-sm"
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">输出（渲染结果）</h2>
          <div className="h-96 p-4 border rounded-lg overflow-auto bg-gray-50">
            <MathText>{content}</MathText>
          </div>
        </div>
      </div>
    </div>
  );
}