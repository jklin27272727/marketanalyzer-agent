# Marketing Page Analyzer — 完整项目知识文档

---

# 第一步：接收到的 Instruction

## 核心任务
做一个 Marketing Page Analyzer：
- 用户输入一个公司 marketing page 的 URL
- 系统自动读取页面内容
- 用 AI 输出结构化分析结果

## 必须实现的功能（Must Have）
1. 用户可以输入 URL，触发分析
2. 系统能抓取并清理网页内容
3. AI 对页面做结构化分析（不是聊天式回答）
4. 输出内容包括：
   - 页面总结
   - 目标用户
   - 核心 Value Proposition
   - 主要 Claims
   - CTA 分析
   - 页面优点
   - 页面弱点
   - 改写后的 Hero Section
5. 评分：Clarity、Differentiation、Credibility、Conversion Potential
6. 前端清晰展示结果（不是 raw JSON）
7. 基本 Loading state 和 Error state
8. 部署到线上，有可访问的 URL

## 最终交付物
- 线上 URL
- GitHub repo
- README
- 3 个 sample outputs
- 3-5 分钟 demo video

---

# 第二步：解析 Instruction，规划产品

## 用三个问题拆解需求

**1. 用户要做什么？**
输入一个 URL，拿到分析结果

**2. 系统要做什么？**
抓取网页 → 清理内容 → AI 分析 → 返回结构化结果

**3. 输出是什么？**
一个包含 9 个字段的 JSON，渲染成卡片展示

## 数据流

```
用户输入 URL，点击 Analyze
        ↓
前端（page.tsx）发送 POST 请求
        ↓
后端（route.ts）接收 URL
        ↓
验证 URL 格式
        ↓
fetch() 下载网页 HTML
        ↓
Cheerio 提取标题、段落、按钮文字
        ↓
清理多余空白
        ↓
发给 OpenRouter AI
        ↓
AI 返回结构化 JSON
        ↓
后端返回 JSON 给前端
        ↓
前端渲染成卡片、评分、列表
        ↓
用户看到结果
```

## AI 需要返回的 JSON 结构
```json
{
  "summary": "页面总结",
  "targetAudience": "目标用户",
  "valueProposition": "核心价值主张",
  "mainClaims": ["卖点1", "卖点2"],
  "ctaAnalysis": "CTA 分析",
  "strengths": ["优点1", "优点2"],
  "weaknesses": [
    { "issue": "问题", "suggestion": "改进建议" }
  ],
  "competitorComparison": "竞争对手对比",
  "rewrittenHero": {
    "headline": "新标题",
    "subheadline": "新副标题",
    "cta": "新按钮文字"
  },
  "scores": {
    "clarity": 8.3,
    "differentiation": 7.2,
    "credibility": 8.5,
    "conversionPotential": 6.9,
    "emotionalAppeal": 7.0
  },
  "scoreReasons": {
    "clarity": ["原因1", "原因2"],
    "differentiation": ["原因1", "原因2"],
    "credibility": ["原因1", "原因2"],
    "conversionPotential": ["原因1", "原因2"],
    "emotionalAppeal": ["原因1", "原因2"]
  }
}
```

---

# 第三步：工具详解

## 1. Next.js — 前后端框架
**是什么：** 基于 React 的全栈框架，前端和后端放在同一个项目里。

**为什么用：**
- 不需要两个项目、两次部署
- 文件路径即路由：`app/page.tsx` → 网站首页，`app/api/analyze/route.ts` → `/api/analyze` 接口
- 和 Vercel 天然配合，部署极简单

**在项目里做什么：**
- `app/page.tsx` — 前端用户界面
- `app/api/analyze/route.ts` — 后端 API 逻辑

---

## 2. React — 前端 UI 框架
**是什么：** Next.js 的基础，用来构建用户界面的 JavaScript 库。

**核心概念 — 状态（State）：**
```tsx
const [url, setUrl] = useState('')       // 用户输入的 URL
const [loading, setLoading] = useState(false)  // 是否在加载
const [result, setResult] = useState(null)     // 分析结果
const [error, setError] = useState(null)       // 错误信息
```
状态变化 → 页面自动更新，不需要手动刷新。

**在项目里做什么：**
- 管理输入框、按钮、结果展示
- 状态变化驱动 Loading/Error/Result 的显示切换

---

## 3. TypeScript — 编程语言
**是什么：** JavaScript 的加强版，加入了类型检查。

**为什么用：**
- 写代码时就能发现类型错误
- 比如 `.each()` 期望返回 `void`，你返回了 `number`，TypeScript 会立刻报错

**在项目里做什么：**
- 整个项目都用 TypeScript 写（`.ts` 和 `.tsx` 文件）

---

## 4. Tailwind CSS — 样式工具
**是什么：** 用类名直接写样式的 CSS 工具库。

**传统 CSS vs Tailwind：**
```css
/* 传统 CSS：需要单独写文件 */
.button { background: black; color: white; padding: 8px 16px; }
```
```tsx
/* Tailwind：直接写在元素上 */
<button className="bg-black text-white px-4 py-2">Analyze</button>
```

**常用类名：**
- `bg-black` — 黑色背景
- `text-white` — 白色文字
- `p-4` — 内边距
- `rounded-xl` — 圆角
- `flex` — 弹性布局
- `grid` — 网格布局
- `shadow` — 阴影

**在项目里做什么：**
- 所有卡片、按钮、评分条的样式

---

## 5. Cheerio — HTML 解析工具
**是什么：** 在服务器端解析 HTML 的工具，语法类似 jQuery。

**为什么需要它：**
- 网页是 HTML 格式，里面有大量无用的标签
- Cheerio 帮你从 HTML 里提取有用的文字内容

**在项目里做什么：**
```ts
const $ = cheerio.load(html)
const title = $('title').text()           // 提取标题
const h1 = $('h1').text()                // 提取 H1 标题
const paragraphs = $('p').text()         // 提取段落
const buttons = $('button').text()       // 提取按钮文字
```

---

## 6. OpenRouter — AI 服务平台
**是什么：** 一个统一的 AI 接口平台，把 DeepSeek、GPT、Claude 等模型集中在一起。

**为什么用：**
- 一个 API Key 访问所有模型
- 有免费模型可以用
- 可以随时换模型，只需改一行代码

**在项目里做什么：**
- 接收清理好的网页文字
- 用 AI 分析并返回结构化 JSON

**API Key 的作用：**
- 证明你有权限使用这个服务
- 存在 `.env.local` 里，不上传到 GitHub
- Vercel 上单独配置

---

## 7. JSON — 数据格式
**是什么：** JavaScript Object Notation，一种结构化的数据格式。

**长什么样：**
```json
{
  "name": "Marketing Analyzer",
  "scores": { "clarity": 8.3 },
  "strengths": ["优点1", "优点2"]
}
```

**为什么用 JSON 而不是普通文字：**
- 结构化，每个字段位置固定
- 前端可以精确读取每个字段
- 可以渲染成不同的 UI 组件（分数用进度条，列表用 bullet points）

**在项目里做什么：**
- 前端发给后端：`{ "url": "https://..." }`
- AI 返回给后端：完整分析结果
- 后端返回给前端：同样的 JSON
- 前端把每个字段渲染成对应的卡片

---

## 8. Git — 版本控制
**是什么：** 本地的代码存档系统。

**三个核心命令：**
```bash
git add .          # 选择要存档的文件
git commit -m ""   # 正式存档，写描述
git push           # 上传到 GitHub
```

**为什么需要：**
- 改坏了可以回退
- 记录每次改动历史
- 上传代码到 GitHub 的工具

---

## 9. GitHub — 代码云端仓库
**是什么：** 代码的云端备份平台。

**为什么需要：**
- 代码安全备份
- Vercel 从这里拉取代码部署
- 别人可以看到你的代码

**和 Git 的关系：**
- Git 是工具（存档）
- GitHub 是平台（云端备份）

---

## 10. Vercel — 部署平台
**是什么：** 专门为 Next.js 设计的免费部署平台。

**工作方式：**
```
git push 到 GitHub
      ↓
Vercel 自动检测到新代码
      ↓
自动构建和部署
      ↓
线上网站更新
```

**重要设置：**
- Framework Preset → Next.js
- Root Directory → ./
- Environment Variables → OPENROUTER_API_KEY

---

## 11. OpenCode — AI Coding Agent
**是什么：** 在终端里运行的 AI 编程助手，可以直接读取和修改你的文件。

**和普通 AI 的区别：**
- 普通 AI（Claude）：只能告诉你怎么做，不能直接改文件
- OpenCode：可以直接创建文件、修改代码、运行命令

**在项目里做什么：**
- 根据你的指令直接写代码
- 创建 route.ts、修改 page.tsx
- 验证代码没有语法错误

---

## 12. .env.local — 环境变量文件
**是什么：** 存放敏感信息（API Key）的文件，不上传到 GitHub。

**内容：**
```
OPENROUTER_API_KEY=sk-or-v1-xxx
```

**为什么需要：**
- API Key 不能写在代码里（会被别人看到）
- 本地用 `.env.local`，Vercel 用 Environment Variables

---

# 第四步：Vibe Coding — 正确的 OpenCode 指令思路

## 写指令的三个原则

**原则 1：指定文件**
```
In app/api/analyze/route.ts...
```

**原则 2：说结果，不说过程**
```
✅ "Show scores with one decimal place (e.g. 8.3/10)"
❌ "Use toFixed(1) to format the number"
```

**原则 3：给例子**
```
✅ "Return scoreReasons as an array like: ['Point 1', 'Point 2']"
❌ "Return scoreReasons as an array"
```

---

## 完全正确版的指令顺序

### 指令 1：创建后端 API
```
Create a Next.js API route at app/api/analyze/route.ts:

1. Accept POST request with JSON body containing "url" field
2. Validate URL: must start with http:// or https://, return 400 if invalid
3. Fetch HTML using fetch() with User-Agent header
4. Use cheerio to extract: title, meta description, h1/h2/h3, paragraphs, button/CTA text
5. Clean text by removing extra whitespace
6. Send to OpenRouter API using model "openrouter/free" with max_tokens 10000
7. Add export const maxDuration = 60 at the top for Vercel timeout
8. System prompt should request JSON with these exact fields:
   - summary (string, 2-3 sentences)
   - targetAudience (string, include job role, company size, pain points)
   - valueProposition (string)
   - mainClaims (array of strings, max 5)
   - ctaAnalysis (string)
   - strengths (array of strings, max 4)
   - weaknesses (array of objects with "issue" and "suggestion" fields, max 4)
   - competitorComparison (string)
   - rewrittenHero (object with headline, subheadline, cta)
   - scores (object with clarity, differentiation, credibility, conversionPotential, emotionalAppeal - all numbers with one decimal, 0-10)
   - scoreReasons (object with same keys as scores, each an array of 2 bullet points)
9. Parse JSON response robustly:
   - First try JSON.parse() directly
   - If fails, remove markdown fences and try again
   - If fails, extract between first { and last }
10. Return parsed result, include proper error handling with status codes 400, 422, 500
11. Read API key from process.env.OPENROUTER_API_KEY
```

---

### 指令 2：创建前端页面
```
Rewrite app/page.tsx as a Marketing Page Analyzer UI:

1. Header with title "Marketing Page Analyzer" and subtitle
2. URL input field with Analyze button, support Enter key
3. Loading spinner while waiting
4. Red error banner for errors
5. Results layout:
   - 5 score cards in a row (Clarity, Differentiation, Credibility, Conversion, Emotional Appeal)
     - Each card: label on own line, score number (e.g. 8.3/10) on next line, progress bar, bullet points for scoreReasons
     - Cards must have fixed equal width and height
   - 3-column grid: Summary, Target Audience, Value Proposition
   - Side by side: Main Claims (bulleted list) and CTA Analysis
   - Side by side: Strengths (green bullets) and Weaknesses (red, show issue + "→ Fix: suggestion")
   - Competitor Comparison card
   - Dark gradient card for Rewritten Hero Section (headline, subheadline, CTA button)
     - CTA label on its own line above the button
6. Use Tailwind CSS, modern and professional design
```

---

### 指令 3：生成 README
```
Write README.md including:
1. Project overview
2. Live demo URL
3. Features list
4. Tech stack table with reasons for each choice
5. How to run locally (clone, npm install, .env.local, npm run dev)
6. How to deploy to Vercel (push to GitHub, import, add env var, deploy)
7. Architecture data flow diagram
8. Design decisions (why JSON not chat, why OpenRouter free models)
```

---

## 如果重来一遍，避免的坑

| 坑 | 如何避免 |
|---|---|
| Git 文件在子文件夹 | 创建项目前确认没有父级 git repo |
| 模型 ID 不存在 | 先去 openrouter.ai 确认模型 ID 再写代码 |
| JSON 截断 | 一开始就设 max_tokens: 10000 |
| Vercel 超时 | 一开始就加 export const maxDuration = 60 |
| Framework Preset 错误 | 部署时确认选择 Next.js |
| TypeScript 错误 | 用 { } 包裹 cheerio 的 push 操作 |

---

# 总结

```
读 Instruction
      ↓
拆功能 + 画数据流
      ↓
搭环境（Node.js → Next.js → OpenCode → GitHub）
      ↓
写后端（route.ts）
      ↓
写前端（page.tsx）
      ↓
本地测试
      ↓
部署（GitHub → Vercel）
      ↓
迭代改进
```

**最重要的能力：**
把模糊的需求 → 拆解成清晰的数据流 → 变成精确的 OpenCode 指令
