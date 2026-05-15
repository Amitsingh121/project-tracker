import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.tsx';
import { Input } from '../components/ui/input.tsx';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

const CARDS = [
  { color: '#6366f1', name: 'Website Redesign', status: '65% complete · On Track' },
  { color: '#ec4899', name: 'Mobile App v2', status: '30% complete · At Risk' },
  { color: '#10b981', name: 'API Integration', status: '80% complete · On Track' },
];

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-14 py-12 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 50%, color-mix(in oklch, var(--primary) 8%, transparent) 0%, transparent 60%)' }}
      />
      <div className="relative z-10 max-w-100">
        <div className="flex items-center gap-2.5 mb-12">
          <img src="/logo.svg" alt="" className="w-9 h-9" />
          <span className="text-sm font-bold">TaskPilot</span>
        </div>
        <h1 className="text-[2.2rem] font-extrabold tracking-tight leading-snug mb-3">
          Ship projects<br />with <span className="text-primary">clarity</span>.
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-sm">
          One workspace for your team's tasks, timelines, and progress - from kickoff to launch.
        </p>
        <div className="flex flex-col gap-2 mb-9">
          {CARDS.map((c) => (
            <div key={c.name} className="flex items-center gap-3 px-3.5 py-2.5 bg-card border border-border rounded-xl">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
              <div>
                <p className="text-xs font-medium">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.status}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-7">
          {[['4', 'Active projects'], ['23', 'Tasks tracked'], ['5', 'Team members']].map(([n, l]) => (
            <div key={l}>
              <p className="text-2xl font-extrabold">{n}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      const msg = e.response?.data?.error?.message || 'Login failed';
      if (e.response?.status === 401) {
        setError('email', { message: msg });
      } else {
        toast.error(msg);
      }
    }
  };

  const handleGoogleSuccess = async (cred: { credential?: string }) => {
    try {
      if (!cred.credential) return;
      await googleLogin(cred.credential);
      navigate('/dashboard');
    } catch {
      toast.error('Google sign-in failed');
    }
  };

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-125 h-125 -top-32 -left-44 rounded-full bg-primary blur-[100px] opacity-[0.07] dark:opacity-[0.18]" />
        <div className="absolute w-87.5 h-87.5 -bottom-24 -right-24 rounded-full bg-pink-500 blur-[80px] opacity-[0.05] dark:opacity-[0.14]" />
      </div>

      <BrandPanel />

      {/* Right panel */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full lg:w-115 lg:min-w-115 bg-muted/40 dark:bg-sidebar border-l border-border px-8 py-10 overflow-y-auto">
        <div className="w-full max-w-85">
          {/* Brand mark */}
          <div className="flex items-center gap-2 mb-6">
            <img src="/logo.svg" alt="" className="w-7 h-7" />
            <span className="text-[13px] font-semibold text-muted-foreground">TaskPilot</span>
          </div>

          {/* Heading */}
          <div className="mb-5">
            <h2 className="text-xl font-bold mb-0.5">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to access your workspace</p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-0.5 p-1 bg-muted rounded-xl mb-5">
            <span className="flex-1 text-center text-[12px] font-semibold py-1.5 rounded-lg bg-card shadow-sm text-foreground cursor-default">
              Sign in
            </span>
            <Link
              to="/signup"
              className="flex-1 text-center text-[12px] font-medium py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Create account
            </Link>
          </div>

          {/* Google */}
          <div className="mb-4 flex justify-center [&>div]:w-full [&>div>div]:w-full [&_iframe]:w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in failed')}
              theme="outline"
              shape="rectangular"
              width="340"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap">
              or sign in with email
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email address
              </label>
              <Input type="email" {...register('email')} placeholder="you@company.com" className="h-9 text-sm" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                <button
                  type="button"
                  onClick={() => toast.info('Password reset coming soon')}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Enter your password"
                  className="h-9 text-sm pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary" />
              <span className="text-xs text-muted-foreground">Keep me signed in for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 disabled:opacity-60 disabled:translate-y-0"
            >
              {isSubmitting ? 'Signing in…' : <><span>Sign in</span><ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
