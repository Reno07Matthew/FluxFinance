import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Activity, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const AuthPage = () => {
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, fullName);
                if (error) {
                    setError(error.message);
                } else {
                    setSuccess('Account created! Check your email to verify your account.');
                    setIsSignUp(false);
                    setEmail('');
                    setPassword('');
                    setFullName('');
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                }
            }
        } catch {
            setError('Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        const { error } = await signInWithGoogle();
        if (error) setError(error.message);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                {/* Gradient orbs */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)',
                        backgroundSize: '60px 60px'
                    }}
                />
            </div>

            {/* Main Card */}
            <div className="relative w-full max-w-md mx-4">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/30 rounded-xl blur-lg" />
                            <div className="relative bg-slate-900 border border-cyan-500/30 rounded-xl p-3">
                                <Activity className="h-8 w-8 text-cyan-400" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-100">
                            Flux <span className="text-cyan-400">Finance</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        AI-powered market intelligence at your fingertips
                    </p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-cyan-500/5">
                    {/* Tab Toggle */}
                    <div className="flex bg-slate-800/50 rounded-lg p-1 mb-6">
                        <button
                            onClick={() => { setIsSignUp(false); setError(null); setSuccess(null); }}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${!isSignUp
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setIsSignUp(true); setError(null); setSuccess(null); }}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${isSignUp
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Error / Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-700/80 bg-slate-800/50 text-slate-100 text-sm placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-700/80 bg-slate-800/50 text-slate-100 text-sm placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    minLength={6}
                                    className="w-full h-11 pl-10 pr-11 rounded-lg border border-slate-700/80 bg-slate-800/50 text-slate-100 text-sm placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {isSignUp && (
                                <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Sign In'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700/60" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-slate-900/80 px-3 text-slate-500 uppercase tracking-wider">or</span>
                        </div>
                    </div>

                    {/* Google Sign-In */}
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full h-11 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-600 mt-6">
                    By continuing, you agree to Flux Finance's Terms of Service
                </p>
            </div>
        </div>
    );
};
