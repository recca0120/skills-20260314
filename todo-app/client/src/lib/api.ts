import { hc } from 'hono/client'
import type { AppType } from 'server'

// Singleton：避免每次 render 重建
export const client = hc<AppType>('/')
