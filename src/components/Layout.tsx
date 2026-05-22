import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    const updateMouse = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', updateMouse);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousemove', updateMouse);
    };
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = async () => {
    await signOut(auth);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-brand-dark z-[100] flex items-center justify-center pointer-events-none"
          >
            <motion.span 
              animate={{ opacity: [0, 1, 0], scale: [0.9, 1, 1.1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-4xl text-brand-light font-bold uppercase tracking-widest text-brand-light"
            >
              Loading...
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
      <div 
        className="fixed top-0 left-0 w-6 h-6 border-2 border-brand-accent rounded-full pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out mix-blend-difference"
        style={{ left: `${mousePosition.x}px`, top: `${mousePosition.y}px`, mixBlendMode: 'difference' }}
      ></div>

      <div className="min-h-screen flex flex-col font-sans relative bg-brand-light text-brand-dark transition-colors duration-300" style={{ cursor: 'none' }}>
        <nav className="sticky top-0 z-50 bg-brand-light border-b-2 border-brand-dark px-6 py-4 flex items-center justify-between transition-colors duration-300 h-20">
          <Link to="/" onClick={closeMenu} className="text-3xl font-bold uppercase tracking-tighter text-brand-dark flex items-center gap-2">
            AZ/FSHN
          </Link>
          
          <div className="hidden xl:flex items-center gap-6 text-sm font-bold uppercase tracking-widest text-brand-dark h-full">
            <Link to="/" className="hover:text-brand-accent transition-colors">{t('home')}</Link>
            <Link to="/events" className="hover:text-brand-accent transition-colors">{t('events')}</Link>
            <Link to="/feed" className="hover:text-brand-accent transition-colors">Feed</Link>
            <Link to="/designers" className="hover:text-brand-accent transition-colors">{t('designers')}</Link>
            <Link to="/education" className="hover:text-brand-accent transition-colors">Education</Link>
            <Link to="/agencies" className="hover:text-brand-accent transition-colors">Agencies</Link>
            {currentUser && (
              <Link to="/dashboard" className="hover:text-brand-accent transition-colors">{t('dashboard')}</Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="hover:text-brand-accent transition-colors">{t('admin')}</Link>
            )}
            {!currentUser ? (
              <Link to="/login" className="hover:text-brand-accent transition-colors ml-4 border-l-2 border-brand-dark pl-4">{t('login_email')}</Link>
            ) : (
              <button onClick={handleLogout} className="hover:text-brand-accent transition-colors cursor-none ml-4 border-l-2 border-brand-dark pl-4">{t('logout')}</button>
            )}
            
            <div className="flex gap-3 ml-2 border-l-2 border-brand-dark pl-4">
              <button onClick={() => changeLanguage('en')} className={`transition-colors cursor-none flex items-center ${i18n.language === 'en' ? 'text-brand-accent' : 'hover:text-brand-accent'}`}>EN</button>
              <button onClick={() => changeLanguage('az')} className={`transition-colors cursor-none flex items-center ${i18n.language === 'az' ? 'text-brand-accent' : 'hover:text-brand-accent'}`}>AZ</button>
              <button onClick={() => changeLanguage('ru')} className={`transition-colors cursor-none flex items-center ${i18n.language === 'ru' ? 'text-brand-accent' : 'hover:text-brand-accent'}`}>RU</button>
            </div>

            <button onClick={toggleTheme} className="ml-2 border-l-2 border-brand-dark pl-4 hover:text-brand-accent transition-colors flex items-center cursor-none">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <div className="xl:hidden flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-brand-dark hover:text-brand-accent transition-colors cursor-none">
               {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </nav>

        {isMobileMenuOpen && (
           <div className="fixed inset-0 top-20 z-40 bg-brand-light border-b-2 border-brand-dark p-6 flex flex-col gap-6 overflow-y-auto font-bold uppercase tracking-widest text-brand-dark xl:hidden">
              <Link to="/" onClick={closeMenu} className="hover:text-brand-accent transition-colors text-2xl border-b-2 border-brand-dark/20 pb-4">{t('home')}</Link>
              <Link to="/events" onClick={closeMenu} className="hover:text-brand-accent transition-colors text-2xl border-b-2 border-brand-dark/20 pb-4">{t('events')}</Link>
              <Link to="/feed" onClick={closeMenu} className="hover:text-brand-accent transition-colors text-2xl border-b-2 border-brand-dark/20 pb-4">Feed</Link>
              <Link to="/designers" onClick={closeMenu} className="hover:text-brand-accent transition-colors text-2xl border-b-2 border-brand-dark/20 pb-4">{t('designers')}</Link>
              <Link to="/education" onClick={closeMenu} className="hover:text-brand-accent transition-colors text-2xl border-b-2 border-brand-dark/20 pb-4">Education</Link>
              <Link to="/agencies" onClick={closeMenu} className="hover:text-brand-accent transition-colors text-2xl border-b-2 border-brand-dark/20 pb-4">Agencies</Link>
              {currentUser && (
                <Link to="/dashboard" onClick={closeMenu} className="hover:text-brand-accent transition-colors text-2xl border-b-2 border-brand-dark/20 pb-4">{t('dashboard')}</Link>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={closeMenu} className="hover:text-brand-accent transition-colors text-2xl border-b-2 border-brand-dark/20 pb-4">{t('admin')}</Link>
              )}
              {!currentUser ? (
                <Link to="/login" onClick={closeMenu} className="hover:text-brand-accent transition-colors text-2xl border-b-2 border-brand-dark/20 pb-4">{t('login_email')}</Link>
              ) : (
                <button onClick={handleLogout} className="hover:text-brand-accent transition-colors cursor-none text-left text-2xl border-b-2 border-brand-dark/20 pb-4">{t('logout')}</button>
              )}
              
              <div className="flex gap-6 mt-4">
                <button onClick={() => { changeLanguage('en'); closeMenu(); }} className={`${i18n.language === 'en' ? 'text-brand-accent' : 'hover:text-brand-accent'} text-xl`}>EN</button>
                <button onClick={() => { changeLanguage('az'); closeMenu(); }} className={`${i18n.language === 'az' ? 'text-brand-accent' : 'hover:text-brand-accent'} text-xl`}>AZ</button>
                <button onClick={() => { changeLanguage('ru'); closeMenu(); }} className={`${i18n.language === 'ru' ? 'text-brand-accent' : 'hover:text-brand-accent'} text-xl`}>RU</button>
              </div>

              <button onClick={() => { toggleTheme(); closeMenu(); }} className="mt-4 hover:text-brand-accent transition-colors flex items-center gap-2 text-xl">
                 Theme Toggle {isDark ? <Sun size={24} /> : <Moon size={24} />}
              </button>
           </div>
        )}

        <main className="flex-1 w-full mx-auto">
          <Outlet />
        </main>
        <footer className="border-t-2 border-brand-dark p-8 md:p-12 text-center text-sm font-bold uppercase tracking-widest text-brand-dark bg-brand-light transition-colors duration-300">
          <div className="flex justify-center gap-8 mb-6">
            <Link to="/vacancies" className="hover:text-brand-accent transition-colors cursor-none">Vacancies</Link>
            <Link to="/volunteers" className="hover:text-brand-accent transition-colors cursor-none">Volunteers</Link>
          </div>
          <div className="flex justify-center gap-6 mb-8 text-xs text-brand-dark/70">
             <Link to="/privacy" className="hover:text-brand-dark transition-colors cursor-none border-b-2 border-transparent hover:border-brand-dark pb-1">Privacy Policy</Link>
             <span>/</span>
             <Link to="/terms" className="hover:text-brand-dark transition-colors cursor-none border-b-2 border-transparent hover:border-brand-dark pb-1">Terms of Use</Link>
             <span>/</span>
             <Link to="/cookies" className="hover:text-brand-dark transition-colors cursor-none border-b-2 border-transparent hover:border-brand-dark pb-1">Cookies Policy</Link>
          </div>
          &copy; {new Date().getFullYear()} AZ FASHION EVENTS. ALL RIGHTS RESERVED.
        </footer>
      </div>
    </>
  );
}
