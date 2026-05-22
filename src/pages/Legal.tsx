import React from 'react';
import { useLocation } from 'react-router';

export default function Legal() {
  const location = useLocation();
  let title = 'Legal';
  let content = 'Content goes here...';

  if (location.pathname === '/privacy') {
    title = 'Privacy & Policy';
    content = 'This is the privacy policy document. Here we explain how user data is collected and used to improve the service.';
  } else if (location.pathname === '/terms') {
    title = 'Terms of Use';
    content = 'These terms govern your use of the AZ Fashion Future platform. By accessing the site, you agree to these terms.';
  } else if (location.pathname === '/cookies') {
    title = 'Cookies Policy';
    content = 'We use cookies to improve your experience, personalize content, and analyze our traffic.';
  }

  return (
    <div className="animate-in fade-in duration-700 bg-brand-light min-h-screen py-16 px-4 md:px-8">
       <div className="max-w-4xl mx-auto card-brutal p-8 md:p-16 border-4 border-brand-dark bg-brand-light">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-brand-dark mb-12 border-b-4 border-brand-dark pb-8">
             {title}
          </h1>
          <div className="text-brand-dark font-bold leading-relaxed space-y-6 uppercase tracking-widest text-sm">
             <p>{content}</p>
             <p>LAST UPDATED: {new Date().toLocaleDateString()}</p>
             <p>If you have any questions, please contact our support team.</p>
          </div>
       </div>
    </div>
  );
}
