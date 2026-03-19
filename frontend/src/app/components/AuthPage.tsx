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
        <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center relative">
            {/* Main Card */}
            <div className="relative w-full max-w-md mx-4">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="relative bg-[#18181b] border border-[#27272a] rounded-xl p-3">
                            <Activity className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            Flux <span className="font-normal text-zinc-400">Finance</span>
                        </h1>
                    </div>
                    <p className="text-zinc-500 text-sm">
                        Institutional market intelligence
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 shadow-2xl">
                    {/* Tab Toggle */}
                    <div className="flex bg-[#0c0c0e] border border-[#27272a] rounded-lg p-1 mb-6">
                        <button
                            onClick={() => { setIsSignUp(false); setError(null); setSuccess(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${!isSignUp
                                    ? 'bg-[#27272a] text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setIsSignUp(true); setError(null); setSuccess(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${isSignUp
                                    ? 'bg-[#27272a] text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
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
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#27272a] bg-[#0c0c0e] text-white text-sm placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#27272a] bg-[#0c0c0e] text-white text-sm placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    minLength={6}
                                    className="w-full h-11 pl-10 pr-11 rounded-lg border border-[#27272a] bg-[#0c0c0e] text-white text-sm placeholder:text-zinc-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-white hover:bg-zinc-200 text-black text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Sign In'}
                                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#27272a]" />
                        </div>
                        <div className="relative flex justify-center text-[10px]">
                            <span className="bg-[#18181b] px-3 text-zinc-500 uppercase tracking-widest font-medium">or</span>
                        </div>
                    </div>

                    {/* Google Sign-In */}
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full h-11 bg-[#0c0c0e] hover:bg-[#1f1f23] border border-[#27272a] hover:border-zinc-500 text-zinc-300 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
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
                <p className="text-center text-xs text-zinc-600 mt-6">
                    By continuing, you agree to Flux Finance's Terms of Service
                </p>
            </div>
        </div>
    );
};
