import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export default function Onboarding() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [industry, setIndustry] = useState('');
  const [degree, setDegree] = useState('');
  const [interestLevel, setInterestLevel] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const checkOnboarding = async () => {
       try {
         const d = await getDoc(doc(db, 'users', currentUser.uid));
         if (d.exists() && d.data().onboardingComplete) {
           navigate('/');
         }
       } catch (e) {}
    };
    checkOnboarding();
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        onboardingComplete: true,
        industry,
        degree,
        interestLevel,
        ageGroup,
        primaryGoal
      }, { merge: true });
      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex justify-center items-center py-12 px-4 animate-in fade-in duration-700 bg-brand-light min-h-[calc(100vh-80px)]">
       <div className="w-full max-w-2xl bg-brand-light border-4 border-brand-dark p-8 md:p-12 shadow-[16px_16px_0_0_var(--brand-dark)]">
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-4 text-brand-dark">Complete Your Profile</h1>
          <p className="text-brand-dark/70 font-bold uppercase tracking-widest text-sm mb-8 border-b-2 border-brand-dark pb-8">
            Tell us more about yourself to personalize your experience.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-brand-dark font-bold">Field / Industry</label>
                <select required value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-transparent border-2 border-brand-dark p-3 focus:outline-none focus:border-brand-accent uppercase tracking-widest text-sm font-bold cursor-none">
                   <option value="" disabled>Select Industry</option>
                   <option value="fashion_design">Fashion Design</option>
                   <option value="marketing_pr">Marketing & PR</option>
                   <option value="photography_media">Photography & Media</option>
                   <option value="retail_buying">Retail & Buying</option>
                   <option value="tech_ecommerce">Tech / E-commerce</option>
                   <option value="student">Student</option>
                   <option value="other">Other</option>
                </select>
             </div>

             <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-brand-dark font-bold">Degree / Education Level</label>
                <select required value={degree} onChange={e => setDegree(e.target.value)} className="w-full bg-transparent border-2 border-brand-dark p-3 focus:outline-none focus:border-brand-accent uppercase tracking-widest text-sm font-bold cursor-none">
                   <option value="" disabled>Select Level</option>
                   <option value="highschool">High School</option>
                   <option value="bachelors">Bachelor's Degree</option>
                   <option value="masters">Master's Degree</option>
                   <option value="phd">PhD</option>
                   <option value="self_taught">Self-taught / None</option>
                </select>
             </div>

             <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-brand-dark font-bold">Level of Interest in Fashion</label>
                <select required value={interestLevel} onChange={e => setInterestLevel(e.target.value)} className="w-full bg-transparent border-2 border-brand-dark p-3 focus:outline-none focus:border-brand-accent uppercase tracking-widest text-sm font-bold cursor-none">
                   <option value="" disabled>Select Interest</option>
                   <option value="casual">Casual fan</option>
                   <option value="enthusiast">Enthusiast / Hobbyist</option>
                   <option value="professional">Professional</option>
                   <option value="executive">Executive / Leader</option>
                </select>
             </div>

             <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-brand-dark font-bold">Age Group</label>
                <select required value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="w-full bg-transparent border-2 border-brand-dark p-3 focus:outline-none focus:border-brand-accent uppercase tracking-widest text-sm font-bold cursor-none">
                   <option value="" disabled>Select Age Group</option>
                   <option value="under_18">Under 18</option>
                   <option value="18_24">18-24</option>
                   <option value="25_34">25-34</option>
                   <option value="35_44">35-44</option>
                   <option value="45_plus">45+</option>
                </select>
             </div>

             <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-brand-dark font-bold">Primary reason for joining</label>
                <select required value={primaryGoal} onChange={e => setPrimaryGoal(e.target.value)} className="w-full bg-transparent border-2 border-brand-dark p-3 focus:outline-none focus:border-brand-accent uppercase tracking-widest text-sm font-bold cursor-none">
                   <option value="" disabled>Select Primary Goal</option>
                   <option value="networking">Networking</option>
                   <option value="attend_events">Attend Events / Shows</option>
                   <option value="find_jobs">Find Jobs / Internships</option>
                   <option value="sponsorship">Sponsorships / Partnerships</option>
                   <option value="learning">Education / Learning</option>
                </select>
             </div>

             <button type="submit" className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-5 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[6px_6px_0_0_var(--brand-dark)] transition-all cursor-none mt-4">
                Complete Setup
             </button>
          </form>
       </div>
    </div>
  );
}
