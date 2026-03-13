---
name: react-vite
description: React + Vite 開發指南，專注在 hooks 設計和 component 架構。當需要設計 custom hooks、處理 useEffect/useState/useReducer、優化 re-render（memo/useMemo/useCallback）、使用 React 19 新特性（use hook、useActionState、useOptimistic、Activity、useEffectEvent）、設定 Vite 專案或環境變數時使用。只要 code 裡有 `from 'react'`、`useState`、`useEffect`、`vite.config`，或用戶問關於 hooks 設計、component 重構、React 效能優化，都應該觸發此 skill。
---

# React + Vite 開發指南

> React 19.2.4 | React Compiler v1.0（穩定版）| Vite 8.0.0（Rolldown 底層）
> 詳細參考：`references/best-practices.md`

## 核心原則

- **React Compiler v1.0 已穩定**：啟用後大部分 `useMemo`/`useCallback`/`memo` 可移除，讓 compiler 自動優化
- **useEffect 比你想的少用**：絕大多數狀況該在 event handler 或直接計算，不需要 Effect
- **狀態往上提升、邏輯往下封裝**：Custom hook 封裝邏輯，props 傳遞資料
- **Composition over inheritance**：用 children/render props 組合，不用繼承

## useState vs useReducer

```ts
// useState — 簡單獨立的值
const [count, setCount] = useState(0)
const [isOpen, setIsOpen] = useState(false)

// useReducer — 多個相關狀態、複雜更新邏輯
type State = { status: 'idle' | 'loading' | 'success' | 'error'; data: User | null; error: string | null }
type Action = { type: 'fetch' } | { type: 'success'; payload: User } | { type: 'error'; payload: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'fetch': return { ...state, status: 'loading', error: null }
    case 'success': return { status: 'success', data: action.payload, error: null }
    case 'error': return { status: 'error', data: null, error: action.payload }
  }
}

// 用 status 取代多個 boolean（避免矛盾狀態）
// ❌ const [isLoading, setIsLoading] = useState(false)
// ❌ const [isError, setIsError] = useState(false)
// ✅ status: 'idle' | 'loading' | 'success' | 'error'
```

**狀態結構五原則：**
1. 合併相關狀態（總是一起更新的合成物件）
2. 避免矛盾狀態（用 `status` enum 取代多個 boolean）
3. 避免冗餘狀態（可從現有 state 計算的不存 state）
4. 避免重複狀態（存 `selectedId` 而非 `selectedItem`）
5. 避免深層巢狀（正規化 flatten）

## useEffect 正確使用

**只適合**與外部系統同步（事件監聽、WebSocket、第三方 library、setInterval）。

```ts
// ❌ 不需要 Effect 的常見誤用
useEffect(() => { setFullName(first + ' ' + last) }, [first, last])  // 直接計算即可
useEffect(() => { setFiltered(filter(todos, query)) }, [todos, query])  // 用 useMemo

// ✅ 需要 Effect：訂閱外部資料
useEffect(() => {
  let cancelled = false
  fetchData(id).then(data => { if (!cancelled) setData(data) })
  return () => { cancelled = true }  // cleanup 防 race condition
}, [id])

// ✅ 需要 Effect：事件監聽
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [handleResize])
```

**常見反模式 → 正確做法：**

| 反模式 | 正確做法 |
|--------|---------|
| Effect 計算派生值 | render 期間直接計算 |
| Effect 快取昂貴計算 | `useMemo` |
| Effect 回應使用者操作 | event handler |
| Effect 重設 state | 使用 `key` prop |
| 串接 Effects | 在一個 event handler 中處理 |

## useEffectEvent（React 19.2 正式 API）

分離「不需要 reactive 但需要在 Effect 中讀取的值」：

```ts
import { useEffect, useEffectEvent } from 'react'

function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification('Connected!', theme)  // 讀取最新 theme，但不是 reactive
  })

  useEffect(() => {
    const conn = createConnection(roomId)
    conn.on('connected', () => onConnected())
    conn.connect()
    return () => conn.disconnect()
  }, [roomId])  // theme 不在 dependencies！
}
```

## useMemo / useCallback / memo

**React Compiler 啟用時：這三個幾乎不需要手動寫。**

沒啟用 Compiler 時：
```ts
// useMemo — 真的昂貴的計算（> 1ms）
const sorted = useMemo(() => [...items].sort(compare), [items])

// useCallback — 傳給 memo 包裹的子元件，或作為 useEffect dependency
const handleSubmit = useCallback((data) => submitForm(data), [submitForm])

// memo — 子元件在 props 不變時跳過 re-render
const List = memo(function List({ items, onItemClick }) { ... })

// ❌ 沒意義：沒有 memo 子元件時 useCallback 沒效果
// ❌ 沒意義：簡單計算用 useMemo 有 overhead
```

## React 19 新特性

### use() hook
```ts
// 讀取 Promise（配合 Suspense）
function Comments({ promise }: { promise: Promise<Comment[]> }) {
  const comments = use(promise)  // Suspense 期間 suspend
  return comments.map(c => <Comment key={c.id} {...c} />)
}

// 在條件式中讀取 Context
if (!show) return null
const theme = use(ThemeContext)  // 可以在 early return 之後！
```

### useActionState（表單提交）
```ts
const [state, dispatch, isPending] = useActionState(
  async (prevState: State, formData: FormData): Promise<State> => {
    try {
      await submitToServer(formData)
      return { status: 'success', error: null }
    } catch (e) {
      return { status: 'error', error: e.message }
    }
  },
  { status: 'idle', error: null }
)

// useFormStatus — 必須在 <form> 的子元件中使用
function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>
}
```

### useOptimistic（樂觀更新）
```ts
const [optimisticMessages, addOptimistic] = useOptimistic(
  messages,
  (state, newText: string) => [...state, { id: crypto.randomUUID(), text: newText, sending: true }]
)

async function send(formData: FormData) {
  const text = formData.get('text') as string
  addOptimistic(text)          // 立即更新 UI
  await actualSendMessage(text) // 等真實 API
}
```

### Activity（保留 state 的條件渲染）
```ts
// 取代 {condition && <Component />}，保留隱藏元件的 state 和 DOM
<Activity mode={activeTab === 'posts' ? 'visible' : 'hidden'}>
  <Posts />
</Activity>
```

### React 19 ref 直接作為 prop
```ts
// 不再需要 forwardRef
function MyInput({ ref, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />
}
```

### Document Metadata
```ts
// <title>/<meta>/<link> 自動 hoist 到 <head>，不需要 react-helmet
function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <h1>{post.title}</h1>
    </article>
  )
}
```

## Custom Hooks 設計

```ts
// 好的 custom hook：封裝邏輯，回傳乾淨 API
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// 封裝複雜邏輯，元件保持薄
function useToggle(initial = false) {
  const [on, setOn] = useState(initial)
  const toggle = useCallback(() => setOn(v => !v), [])
  const setTrue = useCallback(() => setOn(true), [])
  const setFalse = useCallback(() => setOn(false), [])
  return { on, toggle, setTrue, setFalse }
}
```

**設計原則：**
- 名稱以 `use` 開頭
- 只做一件事（Single Responsibility）
- 處理 cleanup（避免 memory leak）
- 回傳乾淨介面，不洩漏實作細節

## Context 使用原則

```ts
// React 19 語法
const ThemeContext = createContext<'light' | 'dark'>('light')

function App() {
  return (
    <ThemeContext value="dark">  {/* 不需要 .Provider */}
      <Page />
    </ThemeContext>
  )
}

// 效能：拆分高頻/低頻更新的 context
// ❌ 一個 context 包所有東西 → 所有 consumer 都 re-render
// ✅ 拆成 UserContext（低頻）+ UserActionsContext（穩定）
```

| 情境 | 建議 |
|------|------|
| 主題、語言、用戶資訊 | Context |
| 複雜客戶端狀態 | Zustand / Jotai |
| 伺服器資料快取 | TanStack Query |

## Vite 8 設定

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react({
      // React Compiler v1.0（啟用後可移除大部分手動 memo）
      babel: { plugins: [['babel-plugin-react-compiler', {}]] },
    }),
    tsconfigPaths(),  // 自動同步 tsconfig paths
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  build: {
    rolldownOptions: {  // Vite 8 用 rolldownOptions（非 rollupOptions）
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'query': ['@tanstack/react-query'],
        },
      },
    },
  },
})
```

### 環境變數

```bash
# .env.development
VITE_API_URL=http://localhost:3000
```

```ts
const apiUrl = import.meta.env.VITE_API_URL  // 只有 VITE_ 前綴才暴露給前端
const isDev = import.meta.env.DEV
```

## 專案結構

```
src/
├── components/        # 共用 UI 元件
│   ├── ui/           # primitives（Button, Input, Modal）
│   └── common/       # 業務通用（UserAvatar, Spinner）
├── features/          # 功能模組（按業務領域）
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api.ts
│   └── todos/
├── hooks/             # 跨功能 custom hooks
├── lib/               # API client、工具函數、設定
├── pages/             # 路由頁面（薄層，組合 features）
└── types/             # 共用 TypeScript 型別
```

## Component 設計反模式

| 反模式 | 問題 | 解法 |
|--------|------|------|
| Props drilling > 3 層 | 維護困難 | Context 或 composition |
| 元件 > 300 行 | 難維護 | 拆分更小元件 |
| Effect 做派生計算 | 多餘 render | 直接計算或 useMemo |
| render 中建立元件 | 每次 remount | 移到外部定義 |
| key 用 index | 排序時 state 錯亂 | 用穩定唯一 ID |

---

詳細程式碼範例請參考 `references/best-practices.md`。
