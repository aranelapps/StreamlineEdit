
import React, { useState } from 'react';
import { api } from '../services/api';
import { Button, Card, Input, Select } from '../components/UIComponents';
import { Video, AlertTriangle, HelpCircle, Copy, Check, Globe } from 'lucide-react';
import { SUPABASE_URL, APP_URL } from '../config';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [isDbError, setIsDbError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use configured URL if available, otherwise auto-detect
  const currentUrl = (APP_URL && APP_URL.length > 0) ? APP_URL : window.location.origin;

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!SUPABASE_URL || SUPABASE_URL.includes('placeholder')) {
        setError('Please configure SUPABASE_URL in config.ts first.');
        return;
    }

    setError('');
    setSuccessMsg('');
    setShowResend(false);
    setIsDbError(false);
    setLoading(true);

    try {
      if (isForgot) {
          await api.auth.resetPassword(email);
          setSuccessMsg(`Password reset email sent to ${email}. Check your inbox!`);
          setLoading(false);
          return;
      }

      if (isSignUp) {
        // Sign Up Flow
        const { session } = await api.auth.signUp(email, password, fullName, role);
        
        if (!session) {
            setSuccessMsg('Account created! Please check your email to confirm your account before logging in.');
            setIsSignUp(false);
            setLoading(false);
            return;
        }

        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
            onLogin();
        }, 1500);
      } else {
        // Sign In Flow
        await api.auth.signIn(email, password);
        onLogin();
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';
      
      if (msg.includes('email not confirmed')) {
          setError('Your email is not verified yet. Please check your inbox for the confirmation link.');
          setShowResend(true);
      } else if (msg.includes('Database tables not found') || msg.includes('relation "public.profiles" does not exist')) {
          setIsDbError(true);
          setError('Database not setup.');
      } else {
          setError(msg || 'Authentication failed. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
      setLoading(true);
      setError('');
      try {
          await api.auth.resendConfirmation(email);
          setSuccessMsg('Confirmation email resent! Please check your inbox (and spam folder).');
          setShowResend(false);
      } catch (err: any) {
          setError(err.message || 'Failed to resend confirmation.');
      } finally {
          setLoading(false);
      }
  };

  const copyUrl = () => {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
            <Video className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">StreamlineEdit</h2>
          <p className="mt-2 text-sm text-slate-600">Video project management platform</p>
        </div>

        <Card className="p-8">
            {(!SUPABASE_URL || SUPABASE_URL.includes('placeholder')) && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded mb-6 text-sm">
                    <strong>Configuration Required:</strong> Please open <code>config.ts</code> and add your Supabase URL and Key to connect to the database.
                </div>
            )}
            
            {isDbError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6 text-sm">
                    <div className="flex items-center font-bold mb-2">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Database Setup Required
                    </div>
                    <p className="mb-2">The database tables don't exist yet.</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-xs text-red-700">
                        <li>Go to Supabase Dashboard &gt; SQL Editor</li>
                        <li>Copy the code from <code>supabase_setup.sql</code></li>
                        <li>Paste and Run the script</li>
                    </ol>
                </div>
            )}
            
          <form onSubmit={handleAuth} className="space-y-6">
            {!isForgot && (
                <div className="flex justify-center mb-4">
                    <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                        <button 
                            type="button"
                            onClick={() => { setIsSignUp(false); setError(''); setSuccessMsg(''); setShowResend(false); setIsDbError(false); }}
                            className={`px-4 py-1.5 rounded-md transition-all ${!isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Sign In
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setIsSignUp(true); setError(''); setSuccessMsg(''); setShowResend(false); setIsDbError(false); }}
                            className={`px-4 py-1.5 rounded-md transition-all ${isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            )}

            {isForgot && (
                 <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Reset Password</h3>
                    <p className="text-sm text-slate-500">Enter your email to receive a reset link.</p>
                 </div>
            )}

            {isSignUp && !isForgot && (
                <Input 
                  id="fullname" 
                  label="Full Name" 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required={isSignUp}
                />
            )}

            <Input 
              id="email" 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            
            {!isForgot && (
                <Input 
                id="password" 
                label="Password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                required
                />
            )}

            {isSignUp && !isForgot && (
                <Select 
                    id="role"
                    label="I am a..."
                    options={[
                        { label: 'Client (I need video edits)', value: 'client' },
                        { label: 'Editor (I edit videos)', value: 'editor' },
                        { label: 'Admin (System Manager)', value: 'admin' },
                    ]}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                />
            )}

            {!isSignUp && !isForgot && (
                <div className="flex justify-end -mt-4">
                    <button type="button" onClick={() => setIsForgot(true)} className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline">
                        Forgot Password?
                    </button>
                </div>
            )}

            {error && !isDbError && (
                <div className="bg-red-50 p-3 rounded space-y-3">
                    <p className="text-sm text-red-600">{error}</p>
                    {showResend && (
                        <Button 
                            type="button" 
                            size="sm" 
                            variant="outline" 
                            onClick={handleResend} 
                            className="w-full border-red-200 text-red-700 hover:bg-red-50"
                            isLoading={loading}
                        >
                            Resend Confirmation Email
                        </Button>
                    )}
                </div>
            )}
            
            {successMsg && <p className="text-sm text-green-600 bg-green-50 p-3 rounded">{successMsg}</p>}
            
            <Button type="submit" className="w-full" isLoading={loading} disabled={!SUPABASE_URL || (isSignUp && !fullName)}>
              {isForgot ? 'Send Reset Link' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>

            {isForgot && (
                 <div className="text-center mt-4">
                    <button type="button" onClick={() => { setIsForgot(false); setError(''); setSuccessMsg(''); }} className="text-sm text-slate-500 hover:text-slate-800">
                        Back to Login
                    </button>
                 </div>
            )}
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
             <p>Secured by Supabase Auth</p>
          </div>
        </Card>

        <div className="mt-8 max-w-md w-full bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-slate-600 text-sm">
           <h4 className="flex items-center font-semibold text-slate-800 mb-2 text-base">
              <HelpCircle className="w-5 h-5 mr-2 text-indigo-600" />
              Connecting to Supabase
           </h4>
           
           <div className="flex items-start mb-3 bg-blue-50 p-3 rounded text-blue-800">
               <Globe className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
               <div className="text-xs">
                   Your app is currently running at:<br/>
                   <strong className="break-all">{currentUrl}</strong>
               </div>
           </div>

           <p className="mb-2 text-xs">If you see "localhost refused to connect" or email links failing:</p>
           <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 font-medium">
               <li>
                   Go to <a href="https://supabase.com/dashboard" target="_blank" className="text-indigo-600 hover:underline">Supabase Dashboard</a> &gt; Authentication &gt; URL Configuration.
               </li>
               <li>
                   Paste the URL above into <strong>Site URL</strong>.
               </li>
               <li>
                   Click "Add URI" under <strong>Redirect URLs</strong> and paste it there too.
               </li>
               <li>
                   <strong>Save</strong>, then come back here and click <strong>"Resend Confirmation Email"</strong>.
               </li>
           </ol>
           
           <div className="mt-3 flex justify-between items-center border-t pt-2">
               <span className="text-xs text-slate-400">Wrong URL? Set <code>APP_URL</code> in config.ts</span>
               <button onClick={copyUrl} className="flex items-center text-xs text-indigo-600 font-bold hover:text-indigo-800">
                   {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                   {copied ? "Copied!" : "Copy URL"}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};
