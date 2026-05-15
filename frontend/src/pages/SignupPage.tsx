import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.tsx';
import { Input } from '../components/ui/input.tsx';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[a-zA-Z]/, 'Must contain a letter')
    .regex(/[0-9]/, 'Must contain a number'),
});
type FormData = z.infer<typeof schema>;

const CARDS = [
  { color: '#6366f1', name: 'Website Redesign', status: '65% complete · On Track' },
  { color: '#ec4899', name: 'Mobile App v2', status: '30% complete · At Risk' },
  { color: '#10b981', name: 'API Integration', status: '80% complete · On Track' },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score =
    password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
    : 2;
  const labels = ['', 'Weak', 'Fair', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#22c55e'];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-0.5 rounded-full transition-colors"
            style={{ background: i <= score ? colors[score] : 'var(--border)' }}
          />
        ))}
      </div>
      <p className="text-[10px] mt-0.5 transition-colors" style={{ color: colors[score] }}>
        {labels[score]} password
      </p>
    </div>
  );
}

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

export default function SignupPage() {
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    trigger,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');

  const handleStep1 = async () => {
    const ok = await trigger(['firstName', 'lastName', 'email']);
    if (ok) setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await signup({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        password: data.password,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: { message?: string } } } };
      const msg = e.response?.data?.error?.message || 'Signup failed';
      if (e.response?.status === 409) {
        setError('email', { message: 'Email already in use' });
        setStep(1);
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
      toast.error('Google sign-up failed');
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
            <h2 className="text-xl font-bold mb-0.5">Create your account</h2>
            <p className="text-sm text-muted-foreground">Start managing projects in minutes</p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-0.5 p-1 bg-muted rounded-xl mb-5">
            <Link
              to="/login"
              className="flex-1 text-center text-[12px] font-medium py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <span className="flex-1 text-center text-[12px] font-semibold py-1.5 rounded-lg bg-card shadow-sm text-foreground cursor-default">
              Create account
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <>
                {/* Google */}
                <div className="mb-4 flex justify-center [&>div]:w-full [&>div>div]:w-full [&_iframe]:w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Google sign-up failed')}
                    theme="outline"
                    shape="rectangular"
                    width="340"
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap">
                    or use your email
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      First name
                    </label>
                    <Input {...register('firstName')} placeholder="Amit" className="h-9 text-sm" />
                    {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Last name
                    </label>
                    <Input {...register('lastName')} placeholder="Kumar" className="h-9 text-sm" />
                    {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Work email
                  </label>
                  <Input type="email" {...register('email')} placeholder="you@company.com" className="h-9 text-sm" />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleStep1}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <p className="text-[11px] text-muted-foreground text-center mt-3">
                  By continuing, you agree to our{' '}
                  <a href="#" className="underline hover:text-foreground">Terms</a> and{' '}
                  <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-[11px] text-muted-foreground">
                    Creating account for{' '}
                    <strong className="text-foreground">{getValues('email')}</strong>
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Create password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="Min. 8 characters"
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
                  <PasswordStrength password={password} />
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
                </div>

                <div className="space-y-2.5 mb-5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" required className="w-3.5 h-3.5 mt-0.5 rounded accent-primary shrink-0" />
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      I agree to the{' '}
                      <a href="#" className="text-primary hover:underline">Terms of Service</a> and{' '}
                      <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 mt-0.5 rounded accent-primary shrink-0" />
                    <span className="text-[11px] text-muted-foreground">
                      Send me product updates and tips (optional)
                    </span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 disabled:opacity-60 disabled:translate-y-0"
                  >
                    {isSubmitting ? 'Creating…' : <><span>Create account</span><ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
