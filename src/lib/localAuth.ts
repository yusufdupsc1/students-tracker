/**
 * Local Auth — 100% in-browser lite database (IndexedDB via Dexie)
 * No external Supabase, no network. Data is created automatically when you open the site.
 * - Users stored in Dexie table `users`
 * - Session stored in localStorage `bejkhonda-session`
 * - Passwords hashed with SHA-256 (Web Crypto) before storage
 */

import { db, type LocalUser } from '../db/schema'
import type { School } from '../types'

const SESSION_KEY = 'bejkhonda-session'
const USERS_KEY_FALLBACK = 'bejkhonda-users-fallback' // used only if IndexedDB blocked

export interface LocalAuthUser {
  id: string
  email: string
}

export interface LocalProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'teacher' | 'viewer'
  school_id: string
  school: School
  created_at: string
  updated_at: string
}

// ---------- crypto helpers ----------
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password)
  // Use Web Crypto if available (browser), fallback to simple hash in Node/tests
  if (typeof crypto !== 'undefined' && (crypto as any).subtle) {
    const buf = await (crypto as any).subtle.digest('SHA-256', enc)
    return toHex(buf)
  }
  // Fallback (Node < 19 or test env): simple JS hash — NOT secure but keeps build working
  let h = 0
  for (let i = 0; i < password.length; i++) h = (Math.imul(31, h) + password.charCodeAt(i)) | 0
  return 'fallback-' + Math.abs(h).toString(16) + '-' + btoa(password).slice(0, 12)
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID()
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

function nowISO() {
  return new Date().toISOString()
}

// ---------- session ----------
export function getStoredSession(): LocalAuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.id && parsed?.email) return parsed as LocalAuthUser
    return null
  } catch {
    return null
  }
}

export function setStoredSession(user: LocalAuthUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
}

// ---------- Dexie helpers ----------
export async function findUserByEmail(email: string): Promise<LocalUser | undefined> {
  const lowered = email.trim().toLowerCase()
  try {
    return await db.users.where('email').equals(lowered).first()
  } catch {
    // IndexedDB may be blocked (private mode) — fallback to localStorage
    try {
      const raw = localStorage.getItem(USERS_KEY_FALLBACK)
      const arr: LocalUser[] = raw ? JSON.parse(raw) : []
      return arr.find((u) => u.email === lowered)
    } catch {
      return undefined
    }
  }
}

async function saveUserToStore(user: LocalUser) {
  try {
    await db.users.put(user)
  } catch {
    // fallback
    const raw = localStorage.getItem(USERS_KEY_FALLBACK)
    const arr: LocalUser[] = raw ? JSON.parse(raw) : []
    const idx = arr.findIndex((u) => u.email === user.email)
    if (idx >= 0) arr[idx] = user
    else arr.push(user)
    localStorage.setItem(USERS_KEY_FALLBACK, JSON.stringify(arr))
  }
}

// ---------- public API ----------
export async function signUpLocal(
  email: string,
  password: string,
  fullName: string,
  schoolName: string
): Promise<{ user: LocalAuthUser; profile: LocalProfile }> {
  const trimmedEmail = email.trim().toLowerCase()
  const trimmedName = fullName.trim()
  const trimmedSchool = schoolName.trim()

  if (!trimmedEmail || !password || !trimmedName || !trimmedSchool) {
    throw new Error('সব ফিল্ড পূরণ করুন')
  }
  if (password.length < 6) throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে')
  if (!trimmedEmail.includes('@')) throw new Error('সঠিক ইমেইল দিন')

  const existing = await findUserByEmail(trimmedEmail)
  if (existing) throw new Error('এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।')

  const passwordHash = await hashPassword(password)
  const schoolId = generateId()
  const userId = generateId()

  const school: School = {
    id: schoolId,
    name: trimmedSchool,
    village: '',
    postOffice: '',
    upazila: '',
    district: '',
  }

  const user: LocalUser = {
    id: userId,
    email: trimmedEmail,
    fullName: trimmedName,
    passwordHash,
    role: 'admin',
    schoolId,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }

  // Persist: school + user atomically via Dexie transaction
  try {
    await db.transaction('rw', db.school, db.users, async () => {
      await db.school.put(school)
      await saveUserToStore(user)
    })
  } catch {
    // If Dexie transaction fails due to fallback, do manual
    await db.school.put(school).catch(() => {
      const key = 'bejkhonda-school-fallback'
      localStorage.setItem(key, JSON.stringify(school))
    })
    await saveUserToStore(user)
  }

  const authUser: LocalAuthUser = { id: userId, email: trimmedEmail }
  const profile: LocalProfile = {
    id: userId,
    email: trimmedEmail,
    full_name: trimmedName,
    role: 'admin',
    school_id: schoolId,
    school,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  }

  setStoredSession(authUser)
  return { user: authUser, profile }
}

export async function signInLocal(email: string, password: string): Promise<{ user: LocalAuthUser; profile: LocalProfile }> {
  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail || !password) throw new Error('ইমেইল ও পাসওয়ার্ড দিন')

  const stored = await findUserByEmail(trimmedEmail)
  if (!stored) throw new Error('অ্যাকাউন্ট পাওয়া যায়নি। সাইন আপ করুন।')

  const hash = await hashPassword(password)
  if (hash !== stored.passwordHash) throw new Error('পাসওয়ার্ড ভুল হয়েছে।')

  // Load school
  let school: School | undefined
  try {
    school = await db.school.get(stored.schoolId)
  } catch {
    school = undefined
  }
  if (!school) {
    // Fallback from localStorage
    try {
      const raw = localStorage.getItem('bejkhonda-school-fallback')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.id === stored.schoolId) school = parsed
      }
    } catch {}
  }
  if (!school) {
    school = { id: stored.schoolId, name: 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়', village: '', postOffice: '', upazila: '', district: '' }
  }

  const authUser: LocalAuthUser = { id: stored.id, email: stored.email }
  const profile: LocalProfile = {
    id: stored.id,
    email: stored.email,
    full_name: stored.fullName,
    role: stored.role,
    school_id: stored.schoolId,
    school,
    created_at: stored.createdAt,
    updated_at: stored.updatedAt,
  }

  setStoredSession(authUser)
  return { user: authUser, profile }
}

export async function loadProfileLocal(userId: string): Promise<LocalProfile | null> {
  // Find user by id
  let user: LocalUser | undefined
  try {
    user = await db.users.get(userId)
  } catch {
    // fallback scan
    const raw = localStorage.getItem(USERS_KEY_FALLBACK)
    if (raw) {
      const arr: LocalUser[] = JSON.parse(raw)
      user = arr.find((u) => u.id === userId)
    }
  }
  if (!user) return null

  let school: School | undefined
  try {
    school = await db.school.get(user.schoolId)
  } catch {}
  if (!school) {
    const raw = localStorage.getItem('bejkhonda-school-fallback')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed.id === user.schoolId) school = parsed
      } catch {}
    }
  }
  if (!school) school = { id: user.schoolId, name: 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়', village: '', postOffice: '', upazila: '', district: '' }

  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    school_id: user.schoolId,
    school,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  }
}

export async function signOutLocal() {
  clearStoredSession()
}

// Optional helper to list all local users (for debug)
export async function listLocalUsers(): Promise<LocalUser[]> {
  try {
    return await db.users.toArray()
  } catch {
    const raw = localStorage.getItem(USERS_KEY_FALLBACK)
    return raw ? JSON.parse(raw) : []
  }
}
