import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Briefcase, Clock, Search, Filter, Plus } from 'lucide-react';
import { useLocation } from 'react-router';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export default function Careers() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'vacancy' | 'internship' | 'volunteer' | 'post'>('vacancy');
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [applyingJob, setApplyingJob] = useState<any | null>(null);
  const [applyForm, setApplyForm] = useState({ name: '', email: '', coverLetter: '' });
  const [applyStatus, setApplyStatus] = useState('');
  
  const [jobs, setJobs] = useState<any[]>([]);
  
  const [postForm, setPostForm] = useState({ title: '', description: '', location: '', type: 'vacancy' });
  const [showPayment, setShowPayment] = useState(false);
  const [postStatus, setPostStatus] = useState('');

  useEffect(() => {
    if (location.pathname.includes('internships')) {
      setActiveTab('internship');
    } else if (location.pathname.includes('volunteers')) {
      setActiveTab('volunteer');
    } else {
      setActiveTab('vacancy');
    }
  }, [location]);

  useEffect(() => {
    const q = query(collection(db, 'vacancies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbJobs = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
      }));
      setJobs(dbJobs);
    });
    return unsubscribe;
  }, []);

  const filteredJobs = jobs.filter(j => j.type === activeTab);

  const handleApply = (job: any) => {
    if (job.type === 'volunteer') {
       setShowVolunteerModal(true);
    } else {
       if (!currentUser) {
         alert('Please login first to apply.');
         return;
       }
       setApplyingJob(job);
       setApplyForm({ name: currentUser.displayName || '', email: currentUser.email || '' });
    }
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob || !currentUser) return;
    try {
      setApplyStatus('submitting');
      await addDoc(collection(db, 'jobApplications'), {
        jobId: applyingJob.id,
        userId: currentUser.uid,
        name: applyForm.name,
        email: applyForm.email,
        coverLetter: applyForm.coverLetter,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setApplyStatus('success');
      setTimeout(() => {
         setApplyStatus('');
         setApplyingJob(null);
      }, 2000);
    } catch (err) {
      console.error(err);
      setApplyStatus('error');
    }
  };

  const handlePostSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!currentUser) {
       alert("Please login to post a vacancy.");
       return;
     }
     if (!postForm.title || !postForm.description) return;
     setShowPayment(true);
  };

  const processPayment = async () => {
     setPostStatus('processing');
     // Mock payment delay
     setTimeout(async () => {
        try {
           await addDoc(collection(db, 'vacancies'), {
              employerId: currentUser?.uid,
              title: postForm.title,
              description: postForm.description,
              location: postForm.location || 'Remote',
              type: postForm.type,
              isPaid: true,
              createdAt: serverTimestamp()
           });
           setPostStatus('success');
           setTimeout(() => {
             setShowPayment(false);
             setPostStatus('');
             setPostForm({ title: '', description: '', location: '', type: 'vacancy' });
             setActiveTab('vacancy');
           }, 2000);
        } catch(e) {
           console.error(e);
           setPostStatus('error');
        }
     }, 1500);
  };

  return (
    <div className="animate-in fade-in duration-700 bg-brand-muted min-h-screen relative">
      {/* Header */}
      <div className="bg-brand-light border-b-2 border-brand-dark py-6 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-brand-dark text-brand-light flex items-center justify-center font-bold text-2xl">
              <Briefcase size={24} />
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-widest text-brand-dark">AZ Fashion Network</h1>
          </div>
          <div className="flex flex-wrap bg-brand-muted border-2 border-brand-dark w-full md:w-auto p-1 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('vacancy')}
              className={`flex-1 min-w-[100px] py-2 text-sm font-bold uppercase tracking-widest transition-colors cursor-none ${activeTab === 'vacancy' ? 'bg-brand-dark text-brand-light' : 'hover:bg-brand-dark/10'}`}
            >
              Vacancies
            </button>
            <button 
              onClick={() => setActiveTab('internship')}
              className={`flex-1 min-w-[100px] py-2 text-sm font-bold uppercase tracking-widest transition-colors cursor-none ${activeTab === 'internship' ? 'bg-brand-dark text-brand-light' : 'hover:bg-brand-dark/10'}`}
            >
              Internships
            </button>
            <button 
              onClick={() => setActiveTab('volunteer')}
              className={`flex-1 min-w-[100px] py-2 text-sm font-bold uppercase tracking-widest transition-colors cursor-none ${activeTab === 'volunteer' ? 'bg-brand-dark text-brand-light' : 'hover:bg-brand-dark/10'}`}
            >
              Volunteers
            </button>
            <button 
              onClick={() => setActiveTab('post')}
              className={`flex-1 min-w-[100px] py-2 text-sm font-bold uppercase tracking-widest transition-colors cursor-none text-brand-accent ${activeTab === 'post' ? 'bg-brand-dark text-brand-accent' : 'hover:bg-brand-dark/10'}`}
            >
              + Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        {activeTab === 'post' ? (
           <div className="w-full bg-brand-light border-2 border-brand-dark p-8 card-brutal max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-2">Post an Opportunity</h2>
              <p className="text-brand-dark/70 font-bold uppercase tracking-widest text-sm mb-8">Reach the top fashion talents in Azerbaijan.</p>
              
              <form onSubmit={handlePostSubmit} className="flex flex-col gap-6">
                 <div>
                   <label className="font-bold uppercase tracking-widest text-sm text-brand-dark mb-2 block">Job Title</label>
                   <input type="text" required value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className="w-full bg-brand-muted border-2 border-brand-dark p-4 font-bold outline-none focus:bg-brand-light transition-colors" placeholder="e.g. Senior Event Coordinator" />
                 </div>
                 
                 <div className="flex gap-4 flex-col md:flex-row">
                   <div className="flex-1">
                     <label className="font-bold uppercase tracking-widest text-sm text-brand-dark mb-2 block">Location</label>
                     <input type="text" value={postForm.location} onChange={e => setPostForm({...postForm, location: e.target.value})} className="w-full bg-brand-muted border-2 border-brand-dark p-4 font-bold outline-none focus:bg-brand-light transition-colors" placeholder="e.g. Baku, AZ or Remote" />
                   </div>
                   <div className="flex-1">
                     <label className="font-bold uppercase tracking-widest text-sm text-brand-dark mb-2 block">Category</label>
                     <select value={postForm.type} onChange={e => setPostForm({...postForm, type: e.target.value})} className="w-full bg-brand-muted border-2 border-brand-dark p-4 font-bold outline-none focus:bg-brand-light transition-colors uppercase tracking-widest text-brand-dark">
                        <option value="vacancy">Vacancy</option>
                        <option value="internship">Internship</option>
                        <option value="volunteer">Volunteer</option>
                     </select>
                   </div>
                 </div>

                 <div>
                   <label className="font-bold uppercase tracking-widest text-sm text-brand-dark mb-2 block">Description & Requirements</label>
                   <textarea required value={postForm.description} onChange={e => setPostForm({...postForm, description: e.target.value})} className="w-full bg-brand-muted border-2 border-brand-dark p-4 font-bold outline-none focus:bg-brand-light transition-colors h-40 resize-none"></textarea>
                 </div>

                 <button type="submit" className="bg-brand-dark text-brand-light p-4 font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors disabled:opacity-50">
                    Continue to Payment (10 AZN)
                 </button>
              </form>
           </div>
        ) : (
          <>
            {/* Sidebar */}
            <div className="w-full md:w-1/4 flex flex-col gap-4">
              <div className="bg-brand-light border-2 border-brand-dark p-6 card-brutal">
                <h2 className="font-bold uppercase tracking-widest border-b-2 border-brand-dark pb-2 mb-4">Filters</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-dark/50 block mb-2">Location</label>
                    <div className="flex items-center gap-2 border-2 border-brand-dark px-2 bg-brand-light">
                      <MapPin size={16} />
                      <input type="text" placeholder="City or remote" className="w-full py-2 outline-none font-bold text-sm bg-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="w-full md:w-3/4 flex flex-col gap-4">
              {filteredJobs.length === 0 ? (
                <div className="bg-brand-light border-2 border-brand-dark p-8 card-brutal text-center font-bold uppercase tracking-widest text-brand-dark/50">
                  No openings found.
                </div>
              ) : (
                filteredJobs.map((job, index) => (
                  <motion.div 
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-brand-light border-2 border-brand-dark p-6 card-brutal hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_0_var(--brand-accent)] transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold uppercase tracking-tight text-brand-dark group-hover:text-brand-accent transition-colors">{job.title}</h3>
                      <span className="text-xs font-bold text-brand-dark/50 uppercase tracking-widest">{job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-brand-dark/70 mb-6">
                      <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                    </div>
                    
                    <p className="text-brand-dark/80 font-bold mb-6 whitespace-pre-wrap">
                      {job.description}
                    </p>
                    
                    <button 
                      onClick={() => handleApply(job)}
                      className="bg-brand-dark text-brand-light px-6 py-2 font-bold uppercase tracking-widest text-sm border-2 border-brand-dark hover:bg-brand-accent hover:border-brand-accent transition-colors cursor-none"
                    >
                      {job.type === 'volunteer' ? 'Sign Up' : 'Apply'}
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-brand-dark/80" onClick={() => !postStatus && setShowPayment(false)}></div>
           <div className="relative z-10 bg-brand-light border-4 border-brand-dark p-8 max-w-md w-full card-brutal text-center shadow-[16px_16px_0_0_var(--brand-accent)]">
              <h3 className="text-2xl font-bold uppercase tracking-tight text-brand-dark mb-4">Payment Required</h3>
              <p className="font-bold mb-8">Pay 10 AZN to publish your {postForm.type}.</p>
              
              {postStatus === 'processing' || postStatus === 'success' ? (
                 <div className="p-8">
                    <p className="font-bold text-xl uppercase tracking-widest text-brand-accent">{postStatus === 'processing' ? 'Processing...' : 'Payment Successful!'}</p>
                 </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Mock card input */}
                  <div className="bg-brand-muted p-4 border-2 border-brand-dark text-left font-bold opacity-50">
                     **** **** **** 4242
                  </div>
                  <button onClick={processPayment} className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent transition-colors">
                     Pay 10 AZN
                  </button>
                  <button onClick={() => setShowPayment(false)} className="w-full bg-transparent text-brand-dark border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-muted transition-colors">
                     Cancel
                  </button>
                </div>
              )}
           </div>
        </div>
      )}

      {showVolunteerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-brand-dark/80" onClick={() => setShowVolunteerModal(false)}></div>
           <div className="relative z-10 bg-brand-light border-4 border-brand-dark p-8 md:p-12 max-w-lg w-full card-brutal text-center shadow-[16px_16px_0_0_var(--brand-accent)]">
              <h3 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-4">You are leaving our site</h3>
              <p className="text-brand-dark font-bold mb-8 uppercase tracking-widest text-sm">
                 You will be redirected to our partner site (Coyora Studio) for volunteer registration.
              </p>
              <div className="flex flex-col gap-4">
                 <a 
                   href="https://coyora.studio/volunteer" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   onClick={() => setShowVolunteerModal(false)}
                   className="w-full bg-brand-accent text-brand-light border-2 border-brand-accent px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-dark hover:border-brand-dark transition-colors"
                 >
                   Continue to Partner Site
                 </a>
                 <button 
                   onClick={() => setShowVolunteerModal(false)}
                   className="w-full bg-transparent text-brand-dark border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-dark hover:text-brand-light transition-colors"
                 >
                   Cancel
                 </button>
              </div>
           </div>
        </div>
      )}
      {applyingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-brand-dark/80" onClick={() => !applyStatus && setApplyingJob(null)}></div>
           <div className="relative z-10 bg-brand-light border-4 border-brand-dark p-8 md:p-12 max-w-lg w-full card-brutal shadow-[16px_16px_0_0_var(--brand-accent)]">
              <h3 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-4">Apply for {applyingJob.title}</h3>
              <form onSubmit={submitApplication} className="flex flex-col gap-4">
                 <input type="text" required placeholder="Full Name" value={applyForm.name} onChange={e => setApplyForm({...applyForm, name: e.target.value})} className="w-full bg-transparent border-2 border-brand-dark p-4 font-bold uppercase tracking-widest text-sm" />
                 <input type="email" required placeholder="Email Address" value={applyForm.email} onChange={e => setApplyForm({...applyForm, email: e.target.value})} className="w-full bg-transparent border-2 border-brand-dark p-4 font-bold uppercase tracking-widest text-sm" />
                 <textarea placeholder="Cover Letter (Optional)" value={applyForm.coverLetter} onChange={e => setApplyForm({...applyForm, coverLetter: e.target.value})} className="w-full bg-transparent border-2 border-brand-dark p-4 font-bold tracking-wide text-sm h-32 resize-none"></textarea>
                 <button disabled={applyStatus === 'submitting' || applyStatus === 'success'} className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent transition-colors mt-4 disabled:opacity-50">
                    {applyStatus === 'submitting' ? 'Submitting...' : (applyStatus === 'success' ? 'Application Sent!' : 'Submit Application')}
                 </button>
                 {applyStatus === 'error' && <p className="text-red-500 font-bold uppercase text-xs tracking-widest text-center mt-2">Error submitting.</p>}
                 {!applyStatus || applyStatus === 'error' ? (
                     <button type="button" onClick={() => setApplyingJob(null)} className="w-full bg-transparent text-brand-dark border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-muted transition-colors mt-2">
                        Cancel
                     </button>
                 ) : null}
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
