import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const KEY_LENGTH = 64

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET не задан: сессии администратора не могут быть подписаны')
  }
  return secret
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(password, salt, KEY_LENGTH).toString('hex')}`;
}

export function verifyPassword(password: string, stored: string | undefined | null): boolean {
  if (!stored) return false
  const [scheme, salt, digest] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !digest) return false
  const actual = scryptSync(password, salt, KEY_LENGTH)
  const expected = Buffer.from(digest, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
}

function equals(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function createSessionToken(username: string): string {
  const payload = `${username}.${Date.now() + SESSION_TTL_MS}.${randomBytes(8).toString('hex')}`
  return `${payload}.${sign(payload)}`
}

export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null
  const split = token.lastIndexOf('.')
  if (split <= 0) return null
  const payload = token.slice(0, split)
  if (!equals(sign(payload), token.slice(split + 1))) return null
  const [username, expiresAt] = payload.split('.')
  if (!username || !Number.isFinite(Number(expiresAt)) || Number(expiresAt) < Date.now()) return null
  return username
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  }
}

/**
 * Единая проверка сессии для всех /api/admin/* кроме login: раньше каждый роут
 * сравнивал cookie со строкой 'authenticated', то есть достаточно было выставить
 * её вручную. Возвращает 401, если доступа нет, и null, если есть.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies()
  let username: string | null = null
  try {
    username = readSessionToken(store.get(SESSION_COOKIE)?.value)
  } catch {
    username = null
  }

  if (!username) {
    return NextResponse.json({ error: 'Требуется вход в администратор' }, { status: 401 })
  }
  return null
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
