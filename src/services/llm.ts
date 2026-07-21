/* src/services/llm.ts
 * LLM 服务：支持 OpenAI 兼容的 Chat Completions API
 * 当用户配置了 API Key 时调用真实 LLM；否则使用本地模拟回复
 */

export interface LLMConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const DEFAULT_SYSTEM_PROMPT = `你是一个 AI 编程教学助手，正在帮助用户学习 AI Agent 编程。
你的职责：
1. 分析用户编写的代码，指出问题并给出改进建议
2. 解释 AI Agent、Prompt 工程、Tool Calling 等概念
3. 引导用户思考，而不是直接给出答案
4. 用中文回答，代码示例用 TypeScript
请保持回答简洁、实用、友好。`

/**
 * 调用真实 LLM API（OpenAI 兼容接口）
 */
export async function callLLM(
  config: LLMConfig,
  messages: LLMMessage[],
  options: { code?: string } = {}
): Promise<string> {
  const { apiKey, baseUrl, model } = config

  if (!apiKey) {
    return simulateReply(messages[messages.length - 1]?.content || '', options.code || '')
  }

  // 构造完整消息列表
  const fullMessages: LLMMessage[] = [
    { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
    ...messages
  ]

  // 如果有代码上下文，附加到最新用户消息
  if (options.code && fullMessages.length > 0) {
    const lastMsg = fullMessages[fullMessages.length - 1]
    if (lastMsg.role === 'user') {
      lastMsg.content = `${lastMsg.content}\n\n【当前代码】\n\`\`\`typescript\n${options.code}\n\`\`\``
    }
  }

  try {
    // 规范化 baseUrl：移除尾部斜杠，确保有 /v1/chat/completions
    const normalizedBase = baseUrl.replace(/\/+$/, '')
    const endpoint = normalizedBase.endsWith('/chat/completions')
      ? normalizedBase
      : `${normalizedBase}/v1/chat/completions`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1024
      })
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText)
      throw new Error(`API 请求失败 (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('API 返回内容为空')
    return content.trim()
  } catch (error: any) {
    // 网络错误或 API 异常时降级到模拟回复
    console.warn('LLM 调用失败，降级到模拟回复:', error.message)
    return `⚠️ LLM 调用失败：${error.message}\n\n（已降级为模拟回复）\n\n${simulateReply(messages[messages.length - 1]?.content || '', options.code || '')}`
  }
}

/**
 * 本地模拟回复（无 API Key 或调用失败时使用）
 */
export function simulateReply(userContent: string, code: string): string {
  const content = userContent.toLowerCase()

  if (content.includes('分析') || content.includes('review')) {
    return [
      '我来分析你的代码：',
      '',
      '1. **结构层面**：代码组织清晰，函数职责比较明确',
      '2. **命名规范**：变量命名合理，但建议使用更具业务语义的名称',
      '3. **错误处理**：缺少对异常情况的处理，建议添加 try-catch',
      '4. **类型注解**：TypeScript 类型可以更严格，避免使用 any',
      '',
      code ? '当前代码看起来已经具备了基本框架，可以继续完善细节。' : '请先编写代码再让我分析。'
    ].join('\n')
  }

  if (content.includes('优化') || content.includes('改进')) {
    return [
      '以下是我的优化建议：',
      '',
      '1. **性能**：使用 Map 替代 Object 存储频繁查找的数据',
      '2. **可读性**：将复杂逻辑拆分为多个小函数',
      '3. **复用性**：提取公共逻辑到工具函数',
      '4. **类型安全**：使用泛型增强类型推断',
      '',
      '建议先从可读性入手，再考虑性能优化。'
    ].join('\n')
  }

  if (content.includes('修复') || content.includes('bug') || content.includes('错误')) {
    return [
      '我发现了以下潜在问题：',
      '',
      '1. **空值检查**：函数参数可能为 null/undefined，需要防御',
      '2. **异步处理**：异步操作缺少 await，可能导致 Promise 未正确处理',
      '3. **边界条件**：数组为空、字符串为空等情况未处理',
      '',
      '建议逐步修复，每改一处就运行测试验证。'
    ].join('\n')
  }

  if (content.includes('帮助') || content.includes('help') || content.includes('怎么')) {
    return [
      '我可以帮你：',
      '- 🔍 **分析代码**：输入「分析」查看代码评审',
      '- ⚡ **优化建议**：输入「优化」获取改进方案',
      '- 🐛 **问题排查**：输入「修复」定位潜在 Bug',
      '- 📖 **概念解释**：直接提问 AI Agent 相关概念',
      '',
      '建议先完成任务描述中的步骤，遇到具体问题再来问我。'
    ].join('\n')
  }

  if (content.includes('agent') || content.includes('什么是')) {
    return [
      'AI Agent 是一个能感知环境、做出决策、执行动作的智能体。',
      '',
      '核心要素：',
      '- **LLM**：大脑，负责理解与推理',
      '- **记忆**：短期（上下文）+ 长期（向量存储）',
      '- **工具**：调用外部 API、数据库、搜索引擎',
      '- **规划**：分解任务、制定执行步骤',
      '',
      '想深入了解哪个部分？可以问我「Tool Calling」、「RAG」、「多 Agent 协作」等。'
    ].join('\n')
  }

  if (content.includes('tool') || content.includes('工具')) {
    return [
      'Tool Calling 让 Agent 能调用外部工具扩展能力。',
      '',
      '实现步骤：',
      '1. 定义工具的 JSON Schema（name、description、parameters）',
      '2. 将工具定义注册到工具库',
      '3. LLM 根据用户意图选择合适的工具',
      '4. 执行工具调用，将结果返回给 LLM',
      '5. LLM 基于工具结果生成最终回复',
      '',
      '可以参考当前任务中的 ToolRegistry 实现。'
    ].join('\n')
  }

  if (content.includes('rag')) {
    return [
      'RAG（检索增强生成）= 检索 + 生成。',
      '',
      '流程：',
      '1. **索引**：将文档切片 → 向量化 → 存入向量数据库',
      '2. **检索**：用户问题 → 向量化 → 相似度搜索 → Top-K 文档',
      '3. **生成**：将检索到的文档作为上下文，交给 LLM 生成答案',
      '',
      '关键组件：Embedding 模型、向量数据库、Chunking 策略。'
    ].join('\n')
  }

  // 默认回复
  return [
    '我收到了你的消息。',
    '',
    '作为模拟助手，我可以根据关键词回应：',
    '- 输入「分析」：代码评审',
    '- 输入「优化」：改进建议',
    '- 输入「修复」：问题排查',
    '- 输入「agent」「tool」「rag」：概念解释',
    '',
    '💡 **提示**：在「设置」页面配置 LLM API Key 后，可以获得真实的 AI 对话体验。'
  ].join('\n')
}

/**
 * 检查 LLM 配置是否可用
 */
export function isLLMConfigured(config: LLMConfig): boolean {
  return Boolean(config.apiKey && config.baseUrl && config.model)
}
