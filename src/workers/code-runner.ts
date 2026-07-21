/* src/workers/code-runner.ts
 * Web Worker 代码执行沙箱
 * 作用：在主线程之外执行用户代码，避免阻塞 UI
 *
 * 工作流程：
 * 1. 接收 { code, functionName, testCases }
 * 2. 用正则剥离 TypeScript 类型注解（轻量转译，无需 Babel/TS 编译器）
 * 3. 用 new Function 在受限作用域内执行代码，捕获 console 输出
 * 4. 用 testCases 逐个验证目标函数的返回值
 * 5. 返回 RunResult
 */

import type { RunResult } from '@/types'

interface RunRequest {
  code: string
  functionName: string
  testCases: Array<{
    name: string
    input: any[]
    expected: any
    mode?: 'equal' | 'contains' | 'length' | 'throws'
    description?: string
  }>
}

interface TestResultItem {
  name: string
  passed: boolean
  expected: string
  actual: string
  error?: string
}

/**
 * 简易 TypeScript → JavaScript 转换器
 * 仅处理学习场景常见的语法，不追求完整覆盖
 */
function stripTypes(code: string): string {
  let out = code
  // 1. 删除 import type 语句
  out = out.replace(/^\s*import\s+type\s+[^;]+;/gm, '')
  // 2. 删除 interface 声明（含泛型与继承）
  out = out.replace(/^\s*(export\s+)?interface\s+\w+\s*(<[^>]+>)?\s*(extends\s+[\w,\s]+)?\s*\{[\s\S]*?^\}/gm, '')
  // 3. 删除 type 别名
  out = out.replace(/^\s*(export\s+)?type\s+\w+\s*(<[^>]+>)?\s*=[^;]+;/gm, '')
  // 4. 删除 enum 声明
  out = out.replace(/^\s*(export\s+)?enum\s+\w+\s*\{[\s\S]*?^\}/gm, '')
  // 5. 删除访问修饰符（public/private/protected/readonly）
  out = out.replace(/\b(public|private|protected|readonly)\s+/g, '')
  // 6. 删除函数参数与变量、返回值的类型注解
  //    形如 : string / : number[] / : Array<T> / : (a: number) => void
  out = out.replace(/:\s*[A-Za-z_$][\w$]*(\[\])?(\s*\|\s*[A-Za-z_$][\w$]*(\[\])?)*(\s*<[^>]*>)?/g, '')
  // 7. 删除函数返回值类型注解（紧跟在 ) 后的 : type）
  out = out.replace(/\)\s*:\s*[A-Za-z_$][\w$]*((\[\])|(<[^>]*>))?(\s*\|\s*[A-Za-z_$][\w$]*)*\s*(?=\{|=>|;)/g, ') ')
  // 8. 删除泛型参数 <T>
  out = out.replace(/<([A-Za-z_$][\w$]*)(\s*,\s*[A-Za-z_$][\w$]*)*>(?=\()/g, '')
  // 9. 删除非空断言 !
  out = out.replace(/!\s*([.;,)\]])/g, '$1')
  // 10. 删除 as 断言
  out = out.replace(/\s+as\s+[A-Za-z_$][\w$]*(\[\])?/g, '')
  return out
}

/**
 * 在沙箱内运行用户代码并提取目标函数
 */
function evaluateUserCode(
  code: string,
  functionName: string,
  consoleOutput: string[]
): { fn: any; error?: string } {
  const mockConsole = {
    log: (...args: any[]) => consoleOutput.push(args.map(formatValue).join(' ')),
    error: (...args: any[]) => consoleOutput.push('[error] ' + args.map(formatValue).join(' ')),
    warn: (...args: any[]) => consoleOutput.push('[warn] ' + args.map(formatValue).join(' ')),
    info: (...args: any[]) => consoleOutput.push(args.map(formatValue).join(' '))
  }

  try {
    const jsCode = stripTypes(code)
    // 包装代码：在闭包内执行，并通过 return 暴露目标函数
    const wrapped = `
      "use strict";
      var module = { exports: {} };
      var exports = module.exports;
      var console = arguments[0];
      ${jsCode}
      // 优先按函数名查找，其次取 exports
      try {
        var fn;
        try { fn = eval('typeof ' + ${JSON.stringify(functionName)} + ' !== "undefined" ? ' + ${JSON.stringify(functionName)} + ' : undefined'); } catch (e) {}
        if (typeof fn === 'function') return fn;
        if (typeof module.exports === 'function') return module.exports;
        if (module.exports && typeof module.exports[${JSON.stringify(functionName)}] === 'function') return module.exports[${JSON.stringify(functionName)}];
        var keys = Object.keys(module.exports || {});
        if (keys.length === 1 && typeof module.exports[keys[0]] === 'function') return module.exports[keys[0]];
        throw new Error('未找到函数 ' + ${JSON.stringify(functionName)} + '，请确认函数已定义');
      } catch (e) {
        throw e;
      }
    `
    // eslint-disable-next-line no-new-func
    const factory = new Function('console', wrapped)
    const fn = factory(mockConsole)
    return { fn }
  } catch (e: any) {
    return { fn: null, error: `代码执行错误：${e.message}` }
  }
}

function formatValue(v: any): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'object') {
    try { return JSON.stringify(v) } catch { return String(v) }
  }
  return String(v)
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return a === b
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((x, i) => deepEqual(x, b[i]))
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every(k => deepEqual(a[k], b[k]))
}

/**
 * 验证单个测试用例
 */
function validateTestCase(actual: any, tc: RunRequest['testCases'][0]): { passed: boolean; error?: string } {
  const mode = tc.mode || 'equal'
  switch (mode) {
    case 'equal':
      return { passed: deepEqual(actual, tc.expected) }
    case 'contains':
      return {
        passed: String(actual).includes(String(tc.expected)),
        error: !String(actual).includes(String(tc.expected)) ? `返回值中未包含 "${tc.expected}"` : undefined
      }
    case 'length':
      return {
        passed: Array.isArray(actual) && actual.length === tc.expected,
        error: !Array.isArray(actual) ? '返回值不是数组' : actual.length !== tc.expected ? `数组长度 ${actual.length}，期望 ${tc.expected}` : undefined
      }
    case 'throws':
      // expected 为 true 时期望抛出异常；实际未抛出则失败
      return { passed: false, error: '期望抛出异常但未抛出' }
    default:
      return { passed: deepEqual(actual, tc.expected) }
  }
}

/**
 * 运行测试用例
 */
function runTests(fn: any, testCases: RunRequest['testCases']): TestResultItem[] {
  return testCases.map(tc => {
    const mode = tc.mode || 'equal'
    try {
      const actual = fn(...tc.input)
      const result = validateTestCase(actual, tc)
      return {
        name: tc.name,
        passed: result.passed,
        expected: formatValue(tc.expected),
        actual: formatValue(actual),
        error: result.error
      }
    } catch (e: any) {
      // throws 模式：抛出异常视为通过
      if (mode === 'throws') {
        return {
          name: tc.name,
          passed: true,
          expected: '抛出异常',
          actual: e.message
        }
      }
      return {
        name: tc.name,
        passed: false,
        expected: formatValue(tc.expected),
        actual: '',
        error: e.message
      }
    }
  })
}

function runCode(req: RunRequest): RunResult {
  const consoleOutput: string[] = []

  // 1. 评估用户代码
  const { fn, error } = evaluateUserCode(req.code, req.functionName, consoleOutput)
  if (error || typeof fn !== 'function') {
    return {
      passed: false,
      totalTests: req.testCases.length,
      passedTests: 0,
      results: [],
      consoleOutput,
      error: error || '未找到目标函数'
    }
  }

  // 2. 运行测试
  const results = runTests(fn, req.testCases)
  const passedTests = results.filter(r => r.passed).length

  return {
    passed: passedTests === results.length && results.length > 0,
    totalTests: results.length,
    passedTests,
    results,
    consoleOutput
  }
}

// Worker 消息处理
self.onmessage = (e: MessageEvent<RunRequest>) => {
  try {
    const result = runCode(e.data)
    ;(self as any).postMessage(result)
  } catch (err: any) {
    ;(self as any).postMessage({
      passed: false,
      totalTests: 0,
      passedTests: 0,
      results: [],
      consoleOutput: [],
      error: `Worker 执行异常：${err.message}`
    } satisfies RunResult)
  }
}
