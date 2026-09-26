import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from './firebase'
import { type Role } from '@/stores/role-store'

export interface AuthUser {
  uid: string
  email: string
  displayName?: string
  role: Role
  photoURL?: string
  createdAt?: string
}

export interface AuthState {
  authenticated: boolean
  user: AuthUser | null
  role: Role | null
  isLoading: boolean
}

// ── Role Authorization Mapping ──────────────────────────────────
// Role is determined strictly by authenticated user data (claims/domain/records)
// Selecting "Admin/Staff" mode in the UI DOES NOT grant admin privileges.
export function determineUserRole(email: string, customClaimsRole?: string): Role {
  if (customClaimsRole && ['Guest', 'Staff', 'Team Head', 'Manager'].includes(customClaimsRole)) {
    return customClaimsRole as Role
  }

  const lower = (email || '').toLowerCase()
  // Verified staff domain check
  if (lower.endsWith('@smartresort360.com')) {
    if (lower.startsWith('admin@') || lower.startsWith('manager@') || lower.startsWith('gm@')) {
      return 'Manager'
    }
    if (lower.startsWith('supervisor@') || lower.startsWith('lead@') || lower.startsWith('head@')) {
      return 'Team Head'
    }
    return 'Staff'
  }

  // All other users (including Google sign-in) are Guests
  return 'Guest'
}

// ── Error Message Mapping ───────────────────────────────────────
export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.'
  const code = error.code || ''
  const message = error.message || ''

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password.'
    case 'auth/user-not-found':
      return 'No account exists with this email. Please check your email or create an account.'
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.'
    case 'auth/weak-password':
      return 'Your password is too weak. Please use at least 6 characters.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups for this site.'
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact resort support.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).'
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.'
    default:
      if (message.includes('missing-config') || !isFirebaseConfigured) {
        return 'Firebase Authentication is not configured. Please ensure VITE_FIREBASE_* variables are set in frontend/.env.local.'
      }
      return message || 'Authentication failed. Please check your credentials.'
  }
}

// ── Main Authentication Service ────────────────────────────────
export const AuthService = {
  // Check if user is currently authenticated
  getCurrentUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem('sr360_auth_user')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
    return null
  },

  isAuthenticated(): boolean {
    return Boolean(auth?.currentUser) || Boolean(this.getCurrentUser())
  },

  // Get the authenticated Firebase ID token
  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    if (auth?.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken(forceRefresh)
        if (token) {
          sessionStorage.setItem('sr360_id_token', token)
          return token
        }
      } catch (e) {
        console.warn('Failed to retrieve Firebase ID token:', e)
      }
    }
    return sessionStorage.getItem('sr360_id_token')
  },

  // 1. Real Email + Password Sign In
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw { code: 'auth/invalid-email', message: 'Please enter a valid email address.' }
    }
    if (!password) {
      throw { code: 'auth/wrong-password', message: 'Please enter your password.' }
    }

    if (!isFirebaseConfigured || !auth) {
      throw {
        code: 'auth/missing-config',
        message: 'Firebase Authentication is not initialized. Please verify frontend/.env.local.',
      }
    }

    const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password)
    const role = determineUserRole(cred.user.email || trimmedEmail)

    const authUser: AuthUser = {
      uid: cred.user.uid,
      email: cred.user.email || trimmedEmail,
      displayName: cred.user.displayName || (role === 'Guest' ? 'Resort Guest' : 'Staff Member'),
      role,
      photoURL: cred.user.photoURL || undefined,
    }

    const idToken = await cred.user.getIdToken()
    this.persistSession(authUser, idToken)
    return authUser
  },

  // 2. Real New User Registration
  async signUpWithEmail(
    email: string,
    password: string,
    confirmPassword: string,
    fullName: string
  ): Promise<AuthUser> {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = fullName.trim()

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw { code: 'auth/invalid-email', message: 'Please enter a valid email address.' }
    }
    if (!password || password.length < 6) {
      throw { code: 'auth/weak-password', message: 'Password must be at least 6 characters.' }
    }
    if (password !== confirmPassword) {
      throw { code: 'auth/passwords-mismatch', message: 'Passwords do not match.' }
    }
    if (!trimmedName) {
      throw { code: 'auth/invalid-name', message: 'Please enter your full name.' }
    }

    if (!isFirebaseConfigured || !auth) {
      throw {
        code: 'auth/missing-config',
        message: 'Firebase Authentication is not initialized. Please verify frontend/.env.local.',
      }
    }

    const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password)

    // Update display name in Firebase Auth Profile
    try {
      await updateProfile(cred.user, { displayName: trimmedName })
    } catch (e) {
      console.warn('Could not update Firebase displayName:', e)
    }

    const role = determineUserRole(cred.user.email || trimmedEmail)
    const authUser: AuthUser = {
      uid: cred.user.uid,
      email: cred.user.email || trimmedEmail,
      displayName: trimmedName,
      role,
    }

    const idToken = await cred.user.getIdToken()
    this.persistSession(authUser, idToken)
    return authUser
  },

  // 3. Real Google Sign In via Firebase Popup
  async signInWithGoogle(): Promise<AuthUser> {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw {
        code: 'auth/missing-config',
        message: 'Firebase Google Authentication is not initialized. Please verify frontend/.env.local.',
      }
    }

    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const role = determineUserRole(cred.user.email || '')

      const authUser: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email || 'guest@gmail.com',
        displayName: cred.user.displayName || 'Resort Guest',
        role,
        photoURL: cred.user.photoURL || undefined,
      }

      const idToken = await cred.user.getIdToken()
      this.persistSession(authUser, idToken)
      return authUser
    } catch (err: any) {
      throw err
    }
  },

  // 4. Real Firebase Password Reset Email
  async sendPasswordReset(email: string): Promise<void> {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw { code: 'auth/invalid-email', message: 'Please enter a valid email address.' }
    }

    if (!isFirebaseConfigured || !auth) {
      throw {
        code: 'auth/missing-config',
        message: 'Firebase Authentication is not initialized. Please verify frontend/.env.local.',
      }
    }

    await sendPasswordResetEmail(auth, trimmedEmail)
  },

  // 5. Real Firebase Sign Out
  async signOut(): Promise<void> {
    if (auth) {
      try {
        await firebaseSignOut(auth)
      } catch (e) {
        console.warn('Firebase signOut error:', e)
      }
    }
    localStorage.removeItem('sr360_auth_user')
    localStorage.removeItem('resort_entered')
    sessionStorage.removeItem('resort_entered')
    sessionStorage.removeItem('sr360_id_token')
  },

  // Session persistence in local/session storage
  persistSession(user: AuthUser, idToken?: string) {
    localStorage.setItem('sr360_auth_user', JSON.stringify(user))
    localStorage.setItem('resort_entered', 'true')
    sessionStorage.setItem('resort_entered', 'true')
    if (idToken) {
      sessionStorage.setItem('sr360_id_token', idToken)
    }
  },

  // 6. Auth State Listener
  subscribeToAuthState(callback: (user: AuthUser | null) => void): () => void {
    if (!isFirebaseConfigured || !auth) {
      // Return cached user if any
      const cached = this.getCurrentUser()
      callback(cached)
      return () => {}
    }

    return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        firebaseUser.getIdToken().then((token) => {
          sessionStorage.setItem('sr360_id_token', token)
        }).catch(() => {})

        const role = determineUserRole(firebaseUser.email || '')
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Resort User',
          role,
          photoURL: firebaseUser.photoURL || undefined,
        }
        this.persistSession(authUser)
        callback(authUser)
      } else {
        localStorage.removeItem('sr360_auth_user')
        localStorage.removeItem('resort_entered')
        sessionStorage.removeItem('resort_entered')
        sessionStorage.removeItem('sr360_id_token')
        callback(null)
      }
    })
  },
}
