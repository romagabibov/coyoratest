import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  const [showConfigNotice, setShowConfigNotice] = useState(false);

  const checkAndCreateUser = async (user: any, providedName?: string, isNewRegistration?: boolean) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
         await setDoc(userRef, {
           email: user.email,
           name: providedName || user.displayName || 'Fashionista',
           role: user.email === 'vnsbek@gmail.com' ? 'admin' : 'user',
           createdAt: Date.now(),
           onboardingComplete: false
         });
         navigate('/onboarding');
      } else {
         const data = userDoc.data();
         if (!data.onboardingComplete) {
            navigate('/onboarding');
         } else {
            navigate('/');
         }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await checkAndCreateUser(result.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await checkAndCreateUser(result.user, name, true);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await checkAndCreateUser(result.user);
      }
    } catch (err: any) {
      if (err.message.includes('auth/operation-not-allowed')) {
         setShowConfigNotice(true);
      } else {
         setError(err.message);
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-full min-h-[calc(100vh-80px)] animate-in fade-in duration-700 bg-brand-light p-4">
      <div className="w-full max-w-md bg-brand-light border-4 border-brand-dark p-8 lg:p-12 shadow-[16px_16px_0_0_var(--brand-dark)] relative overflow-hidden">
        
        <h1 className="text-5xl font-bold uppercase tracking-tighter mb-8 text-brand-dark leading-none">{isRegister ? 'Register' : t('login_email')}</h1>
        
        {showConfigNotice && (
          <div className="p-4 mb-6 bg-yellow-100 border-2 border-yellow-600 text-yellow-800 text-sm font-bold tracking-widest uppercase">
             Please enable Email/Password Authentication in your Firebase Console &rarr; Authentication &rarr; Sign-in method.
          </div>
        )}
        {error && <div className="p-4 mb-6 bg-red-100 text-red-900 border-2 border-red-900 text-sm font-bold uppercase tracking-widest">{error}</div>}
        
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-6 mb-8 relative z-10">
          {isRegister && (
             <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-brand-dark font-bold block">{t('name')}</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-medium rounded-none"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-brand-dark font-bold block">{t('email')}</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-medium rounded-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-brand-dark font-bold block">{t('password')}</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-medium rounded-none"
            />
          </div>
          <button type="submit" className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-5 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0_0_var(--brand-accent)] transition-all">
             {isRegister ? 'Register Account' : 'Login'}
          </button>
        </form>
        
        <div className="text-center text-sm mb-8 text-brand-dark font-medium border-t-2 border-brand-dark pt-8">
           <span className="uppercase tracking-widest">{isRegister ? 'Already have an account?' : 'Need an account?'}</span>
           <button type="button" onClick={() => setIsRegister(!isRegister)} className="ml-2 font-bold text-brand-accent hover:text-brand-dark transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4">
             {isRegister ? 'Login' : 'Register'}
           </button>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          className="w-full bg-brand-light border-2 border-brand-dark py-4 hover:shadow-[4px_4px_0_0_var(--brand-dark)] hover:-translate-y-1 hover:-translate-x-1 transition-all uppercase text-sm tracking-widest flex items-center justify-center gap-3 text-brand-dark font-bold">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
      </div>
    </div>
  );
}
