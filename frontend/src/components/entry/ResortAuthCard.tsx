import { useState } from 'react'
import {
  Check,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react'
import { AuthService, getFriendlyErrorMessage, type AuthUser } from '@/lib/auth'
import { useRoleStore } from '@/stores/role-store'

interface ResortAuthCardProps {
  onSuccess: (user: AuthUser) => void
  isExitingDown?: boolean
}

type AuthView = 'signin' | 'register' | 'forgot-password'

export function ResortAuthCard({ onSuccess, isExitingDown = false }: ResortAuthCardProps) {
  const { setRole } = useRoleStore()
  const [authMode, setAuthMode] = useState<'guest' | 'staff'>('guest')
  const [currentView, setCurrentView] = useState<AuthView>('signin')

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Statuses
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null)
  const [successStage, setSuccessStage] = useState<'none' | 'success' | 'preparing'>('none')

  // Handle Sign In (Email + Password)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setResetSuccessMessage(null)
    setIsLoading(true)

    try {
      const user = await AuthService.signInWithEmail(email, password)
      setRole(user.role)
      setIsLoading(false)
      triggerSuccessSequence(user)
    } catch (err: any) {
      setIsLoading(false)
      setErrorMessage(getFriendlyErrorMessage(err))
    }
  }

  // Handle Registration (Full Name, Email, Password, Confirm Password)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setResetSuccessMessage(null)

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)

    try {
      const user = await AuthService.signUpWithEmail(email, password, confirmPassword, fullName)
      setRole(user.role)
      setIsLoading(false)
      triggerSuccessSequence(user)
    } catch (err: any) {
      setIsLoading(false)
      setErrorMessage(getFriendlyErrorMessage(err))
    }
  }

  // Handle Google Sign In Popup
  const handleGoogleSignIn = async () => {
    setErrorMessage(null)
    setResetSuccessMessage(null)
    setIsLoading(true)

    try {
      const user = await AuthService.signInWithGoogle()
      setRole(user.role)
      setIsLoading(false)
      triggerSuccessSequence(user)
    } catch (err: any) {
      setIsLoading(false)
      setErrorMessage(getFriendlyErrorMessage(err))
    }
  }

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setResetSuccessMessage(null)
    setIsLoading(true)

    try {
      await AuthService.sendPasswordReset(email)
      setIsLoading(false)
      setResetSuccessMessage(`Password reset link sent to ${email}. Please check your inbox.`)
    } catch (err: any) {
      setIsLoading(false)
      setErrorMessage(getFriendlyErrorMessage(err))
    }
  }

  // Success Sequence before card descent
  const triggerSuccessSequence = (user: AuthUser) => {
    setSuccessStage('success')

    // 0.80–1.30s: Success State
    setTimeout(() => {
      setSuccessStage('preparing')
    }, 500)

    // Proceed to downward card descent & doors opening
    setTimeout(() => {
      onSuccess(user)
    }, 1000)
  }

  return (
    <div
      className={`relative w-full max-w-[460px] rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/70 p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.12),0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-500 ${
        isExitingDown ? 'animate-card-descend-daytime' : ''
      }`}
    >
      {/* ── Sequence: Real Authentication Success ─────────────────── */}
      {successStage !== 'none' ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-sky-50 border border-sky-200/90 flex items-center justify-center shadow-[0_4px_16px_rgba(37,99,235,0.18)]">
            <Check className="w-8 h-8 text-[#1E40AF] stroke-[2.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {successStage === 'success' ? 'Authentication Successful' : 'Welcome to Smart Resort 360'}
            </h3>
            <p className="text-[#2563EB] text-xs tracking-wider uppercase font-semibold">
              {successStage === 'success' ? 'Verifying check-in credentials...' : 'Preparing your resort experience...'}
            </p>
          </div>
        </div>
      ) : currentView === 'forgot-password' ? (
        /* ── View: Password Reset ────────────────────────────────── */
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-50 border border-sky-200/80 shadow-xs mb-1">
              <KeyRound className="w-5 h-5 text-[#1E40AF]" />
            </div>
            <h2 className="text-xl tracking-tight text-[#0F172A] font-bold">
              Reset Password
            </h2>
            <p className="text-[#475569] text-sm leading-relaxed">
              Enter your email address and we'll send a secure password reset link.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
          )}

          {resetSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-sky-50/90 border border-sky-200 text-[#1E40AF] text-sm flex items-start gap-2.5">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB]" />
              <div className="flex-1 leading-snug">{resetSuccessMessage}</div>
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl pl-10 pr-4 py-3 text-[15px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] active:bg-[#172554] text-white font-semibold text-sm tracking-wide transition-all shadow-[0_4px_16px_rgba(30,58,138,0.25)] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <span>Send Reset Link →</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentView('signin')
                setErrorMessage(null)
                setResetSuccessMessage(null)
              }}
              className="w-full text-center text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center justify-center gap-1.5 pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </form>
        </div>
      ) : (
        /* ── Main View: Sign In / Create Account ──────────────────── */
        <div className="space-y-6">
          {/* Header & Resort Coastal Emblem */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-50 border border-sky-200/80 shadow-xs mb-1">
              <svg
                className="w-6 h-6 text-[#1E40AF]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C11.5 5 9 8 5 9C9 10 11.5 13 12 16C12.5 13 15 10 19 9C15 8 12.5 5 12 2Z" />
                <path d="M12 16C10.5 18 9 20 6 21C9 21.5 11 22 12 22C13 22 15 21.5 18 21C15 20 13.5 18 12 16Z" opacity="0.8" />
                <path d="M12 7C12 9 10.5 11 8 11.5C10.5 12 12 14 12 16C12 14 13.5 12 16 11.5C13.5 11 12 9 12 7Z" opacity="0.6" />
              </svg>
            </div>
            <div className="text-xs font-bold tracking-[0.24em] text-[#1E40AF] uppercase">
              Smart Resort 360
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                {currentView === 'register' ? 'Create Guest Account' : 'Welcome Back'}
              </h2>
              <p className="text-[#475569] text-sm">
                {currentView === 'register'
                  ? 'Join Smart Resort 360 for an intelligent, peaceful stay'
                  : 'Choose how you want to continue'}
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs: [ Guest / User ] [ Admin / Staff ] */}
          {currentView === 'signin' && (
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/70 border border-slate-200/60 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('guest')
                  setErrorMessage(null)
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold tracking-normal transition-all cursor-pointer ${
                  authMode === 'guest'
                    ? 'bg-white/95 text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Guest / User</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('staff')
                  setErrorMessage(null)
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold tracking-normal transition-all cursor-pointer ${
                  authMode === 'staff'
                    ? 'bg-white/95 text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin / Staff</span>
              </button>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fade-in-up">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* ── Mode 1: Guest / User ─────────────────────────────── */}
          {authMode === 'guest' ? (
            currentView === 'register' ? (
              /* Registration Form */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    required
                    className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl pl-10 pr-4 py-3 text-[15px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl pl-10 pr-4 py-3 text-[15px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 characters)"
                    required
                    minLength={6}
                    className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl pl-10 pr-10 py-3 text-[15px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                    minLength={6}
                    className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl pl-10 pr-10 py-3 text-[15px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] active:bg-[#172554] text-white font-semibold text-sm tracking-wide transition-all shadow-[0_4px_16px_rgba(30,58,138,0.25)] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Create Account & Enter →</span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('signin')
                      setErrorMessage(null)
                    }}
                    className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* Sign In Form */
              <div className="space-y-4">
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/85 hover:bg-white border border-slate-200/90 text-[#0F172A] font-medium text-sm transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.6H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.4l4.03-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.6l4.03 3.13c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-semibold text-sm text-[#0F172A]">Continue with Google</span>
                    <span className="text-xs text-[#64748B]">For guests and visitors</span>
                  </div>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200/80 w-full" />
                  <span className="bg-transparent px-3 text-xs uppercase tracking-wider text-[#64748B] font-semibold">
                    OR
                  </span>
                  <div className="border-t border-slate-200/80 w-full" />
                </div>

                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="guest@example.com"
                      required
                      className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl pl-10 pr-4 py-3 text-[15px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl pl-10 pr-10 py-3 text-[15px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#475569] pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#1E40AF] focus:ring-[#2563EB] w-4 h-4 cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('forgot-password')
                        setErrorMessage(null)
                      }}
                      className="hover:text-[#1E40AF] font-semibold transition-colors cursor-pointer underline underline-offset-2"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] active:bg-[#172554] text-white font-semibold text-sm tracking-wide transition-all shadow-[0_4px_16px_rgba(30,58,138,0.25)] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing you in...</span>
                      </>
                    ) : (
                      <span>Sign In as Guest →</span>
                    )}
                  </button>

                  <div className="pt-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('register')
                        setErrorMessage(null)
                      }}
                      className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
                    >
                      Don't have an account? Create one
                    </button>
                  </div>
                </form>
              </div>
            )
          ) : (
            /* ── Mode 2: Admin / Staff ────────────────────────────── */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@smartresort360.com"
                  required
                  className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl pl-10 pr-4 py-3 text-[15px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Staff Password"
                  required
                  className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-xl pl-10 pr-10 py-3 text-[15px] font-medium text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-[#475569] pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#1E40AF] focus:ring-[#2563EB] w-4 h-4 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('forgot-password')
                    setErrorMessage(null)
                  }}
                  className="hover:text-[#1E40AF] font-semibold transition-colors cursor-pointer underline underline-offset-2"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] active:bg-[#172554] text-white font-semibold text-sm tracking-wide transition-all shadow-[0_4px_16px_rgba(30,58,138,0.25)] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <span>Sign In as Staff →</span>
                )}
              </button>

              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-100/90 text-xs text-[#1E40AF] font-medium text-center leading-relaxed">
                Access is authorized by resort credentials. Select your role during Firebase account setup.
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
