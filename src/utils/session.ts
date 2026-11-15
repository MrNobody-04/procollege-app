// src/utils/session.ts
// Tab-isolated session management for ProCollege
// Prioritizes sessionStorage so multiple tabs in the same browser (Admin, Lecturer, Student, Developer)
// maintain their own independent identities without clobbering each other on refresh.

const TOKEN_KEY = 'procollege_token';
const AUTH_TOKEN_KEY = 'procollege_auth_token';
const USER_KEY = 'procollege_user';
const COLLEGE_KEY = 'procollege_college';

export function getStoredToken(): string {
  try {
    const sessionTok = sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (sessionTok) return sessionTok;

    const localTok = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    if (localTok) {
      // Seed this tab's sessionStorage from localStorage fallback
      sessionStorage.setItem(TOKEN_KEY, localTok);
      return localTok;
    }
  } catch (err) {
    console.warn('[SESSION] Failed to read token:', err);
  }
  return '';
}

export function getStoredUser(): any | null {
  try {
    const sessionUserStr = sessionStorage.getItem(USER_KEY);
    if (sessionUserStr) {
      return JSON.parse(sessionUserStr);
    }

    const localUserStr = localStorage.getItem(USER_KEY);
    if (localUserStr) {
      const parsed = JSON.parse(localUserStr);
      // Seed this tab's sessionStorage so other tabs won't overwrite it
      sessionStorage.setItem(USER_KEY, localUserStr);
      return parsed;
    }
  } catch (err) {
    console.warn('[SESSION] Failed to parse stored user:', err);
  }
  return null;
}

export function getStoredCollege(): any | null {
  try {
    const sessionColStr = sessionStorage.getItem(COLLEGE_KEY);
    if (sessionColStr) {
      return JSON.parse(sessionColStr);
    }

    const localColStr = localStorage.getItem(COLLEGE_KEY);
    if (localColStr) {
      const parsed = JSON.parse(localColStr);
      sessionStorage.setItem(COLLEGE_KEY, localColStr);
      return parsed;
    }
  } catch (err) {
    console.warn('[SESSION] Failed to parse stored college:', err);
  }
  return null;
}

export function setStoredSession(token: string, user: any, college?: any): void {
  try {
    const userStr = typeof user === 'string' ? user : JSON.stringify(user);
    const colStr = college ? (typeof college === 'string' ? college : JSON.stringify(college)) : null;

    // 1. Strictly bind to current browser tab (tab isolation)
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, userStr);
    if (colStr) {
      sessionStorage.setItem(COLLEGE_KEY, colStr);
    }

    // 2. Also keep localStorage as fallback for new windows
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, userStr);
    if (colStr) {
      localStorage.setItem(COLLEGE_KEY, colStr);
    }
  } catch (err) {
    console.warn('[SESSION] Failed to write session:', err);
  }
}

export function clearStoredSession(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(COLLEGE_KEY);

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COLLEGE_KEY);
  } catch (err) {
    console.warn('[SESSION] Failed to clear session:', err);
  }
}
