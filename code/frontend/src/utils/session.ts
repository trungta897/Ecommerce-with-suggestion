import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE } from '@/constants/activity';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  // 1. Try reading from cookie first
  let sessionId = getCookie(SESSION_COOKIE_NAME);

  // 2. Try reading from localStorage fallback
  if (!sessionId) {
    try {
      sessionId = localStorage.getItem(SESSION_COOKIE_NAME);
    } catch {
      sessionId = null;
    }
  }

  // 3. If still empty, generate new
  if (!sessionId) {
    sessionId = generateUUID();
  }

  // Synchronize both cookie and localStorage
  setCookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_MAX_AGE);
  try {
    localStorage.setItem(SESSION_COOKIE_NAME, sessionId);
  } catch {}

  return sessionId;
}

export function clearSessionAndRegenerate(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const newSessionId = generateUUID();

  setCookie(SESSION_COOKIE_NAME, newSessionId, SESSION_COOKIE_MAX_AGE);
  try {
    localStorage.setItem(SESSION_COOKIE_NAME, newSessionId);
  } catch {}

  return newSessionId;
}
