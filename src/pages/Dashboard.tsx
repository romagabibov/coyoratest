import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Ticket, Event } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Briefcase } from 'lucide-react';

interface PopulatedTicket extends Ticket {
  event?: Event;
}

interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  description?: string;
  likes: number;
  comments: number;
  createdAt?: any;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { currentUser, dbUser } = useAuth();
  const [tickets, setTickets] = useState<PopulatedTicket[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [applications, setApplications] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'portfolio' | 'employer' | 'edit-profile' | 'feed-activity'>('portfolio');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [feedComments, setFeedComments] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    
    // fetch feedPosts for the user
    const qFeedPosts = query(collection(db, 'feedPosts'), where('userId', '==', currentUser.uid));
    const unsubscribeFeedPosts = onSnapshot(qFeedPosts, (snapshot) => {
       const fd = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       fd.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
       setFeedPosts(fd);
    });

    const qFeedCom = query(collection(db, 'feedComments'), where('userId', '==', currentUser.uid));
    const unsubscribeFeedCom = onSnapshot(qFeedCom, (snapshot) => {
       const cd = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       cd.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
       setFeedComments(cd);
    });

    return () => {
       unsubscribeFeedPosts();
       unsubscribeFeedCom();
    };
  }, [currentUser]);

  const [profileForm, setProfileForm] = useState({
    name: '', industry: '', degree: '', interestLevel: '', ageGroup: '', primaryGoal: '', avatarUrl: '', bio: '', links: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postDescription, setPostDescription] = useState('');

  useEffect(() => {
    if (dbUser) {
      setProfileForm({
        name: dbUser.name || '',
        industry: dbUser.industry || '',
        degree: dbUser.degree || '',
        interestLevel: dbUser.interestLevel || '',
        ageGroup: dbUser.ageGroup || '',
        primaryGoal: dbUser.primaryGoal || '',
        avatarUrl: dbUser.avatarUrl || '',
        bio: dbUser.bio || '',
        links: dbUser.links || ''
      });
    }
  }, [dbUser]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Tickets
        const q = query(collection(db, 'tickets'), where('userId', '==', currentUser.uid));
        const snapshots = await getDocs(q);
        
        const tickData: PopulatedTicket[] = [];
        for (const d of snapshots.docs) {
           const tData = { id: d.id, ...d.data() } as Ticket;
           try {
             const evDoc = await getDoc(doc(db, 'events', tData.eventId));
             if (evDoc.exists()) {
               tickData.push({ ...tData, event: { id: evDoc.id, ...evDoc.data() } as Event });
             } else {
               tickData.push({ ...tData });
             }
           } catch (e) {
             tickData.push({ ...tData });
           }
        }
        
        // Sort by purchase date descending
        tickData.sort((a,b) => b.purchaseDate - a.purchaseDate);
        setTickets(tickData);

        // Fetch Posts
        const pQ = query(collection(db, 'posts'), where('userId', '==', currentUser.uid));
        const pSnapshots = await getDocs(pQ);
        const pData: Post[] = pSnapshots.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        pData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
        setPosts(pData);

        // Fetch Vacancies
        const vQ = query(collection(db, 'vacancies'), where('employerId', '==', currentUser.uid));
        const vSnapshots = await getDocs(vQ);
        const vData = vSnapshots.docs.map(d => ({ id: d.id, ...d.data() }));
        setVacancies(vData);

        // Fetch Applications for these vacancies
        if (vData.length > 0) {
           const allApps: Record<string, any[]> = {};
           for (const v of vData) {
              const aQ = query(collection(db, 'jobApplications'), where('jobId', '==', v.id));
              const aSnap = await getDocs(aQ);
              
              const applicantsData = await Promise.all(aSnap.docs.map(async (docSnap) => {
                 const appData = { id: docSnap.id, ...docSnap.data() } as any;
                 
                 // Fetch Applicant's profile/posts to show to employer
                 const pQuery = query(collection(db, 'posts'), where('userId', '==', appData.userId));
                 try {
                   const uPostsSnap = await getDocs(pQuery);
                   appData.portfolioPosts = uPostsSnap.docs.map(p => ({ id: p.id, ...p.data() }));
                 } catch (e) {
                    appData.portfolioPosts = [];
                 }
                 return appData;
              }));
              allApps[v.id] = applicantsData;
           }
           setApplications(allApps);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
       const base64String = reader.result as string;
       try {
         const newPostRef = await addDoc(collection(db, 'posts'), {
           userId: currentUser.uid,
           imageUrl: base64String,
           likes: Math.floor(Math.random() * 100) + 10,
           comments: Math.floor(Math.random() * 20),
           createdAt: serverTimestamp()
         });
         
         const newPost: Post = {
           id: newPostRef.id,
           userId: currentUser.uid,
           imageUrl: base64String,
           likes: 0,
           comments: 0,
           createdAt: { toMillis: () => Date.now() }
         };
         setPosts(prev => [newPost, ...prev]);
       } catch (err) {
         handleFirestoreError(err, OperationType.CREATE, 'posts');
       }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !dbUser) return;
    
    // Check if 24 hours have passed since last update
    const lastUpdate = dbUser.lastProfileUpdate || 0;
    if (Date.now() - lastUpdate < 86400000) {
       alert('You can only update your profile once a day.');
       return;
    }

    setUpdatingProfile(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...profileForm,
        lastProfileUpdate: Date.now()
      });
      alert('Profile updated successfully!');
      setActiveTab('portfolio');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost) return;
    try {
      await updateDoc(doc(db, 'posts', selectedPost.id), {
        description: postDescription
      });
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, description: postDescription } : p));
      setSelectedPost(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'posts');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'posts');
    }
  };

  if (loading) return (
    <div className="flex justify-center p-20">
      <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700 py-12 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Profile Header (Instagram style) */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 border-b-4 border-brand-dark pb-12">
        <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-full border-4 border-brand-dark overflow-hidden bg-brand-muted">
          <img 
            src={dbUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col flex-grow items-center md:items-start">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-dark">{dbUser?.name || currentUser?.email?.split('@')[0] || 'user'}</h1>
            <button onClick={() => setActiveTab('edit-profile')} className="border-2 border-brand-dark px-4 py-2 font-bold uppercase tracking-widest text-xs hover:bg-brand-dark hover:text-brand-light transition-colors cursor-none">
              Edit Profile
            </button>
            <button onClick={() => setActiveTab('edit-profile')} className="border-2 border-brand-dark p-2 hover:bg-brand-accent hover:border-brand-accent hover:text-brand-light transition-colors cursor-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
          
          <div className="flex gap-8 mb-6 font-bold text-brand-dark uppercase tracking-widest text-sm">
            <div className="flex flex-col md:flex-row md:gap-2 items-center"><span className="text-xl">{posts.length}</span> posts</div>
            <div className="flex flex-col md:flex-row md:gap-2 items-center"><span className="text-xl">0</span> followers</div>
            <div className="flex flex-col md:flex-row md:gap-2 items-center"><span className="text-xl">0</span> following</div>
          </div>
          
          <div className="text-brand-dark text-center md:text-left">
            <p className="font-bold mb-1">{dbUser?.industry || 'Fashion Enthusiast'}</p>
            {dbUser?.bio && (
              <p className="text-sm border-l-2 border-brand-accent pl-2 mb-2 max-w-md whitespace-pre-wrap">{dbUser.bio}</p>
            )}
            {dbUser?.links && (
              <a href={dbUser.links.startsWith('http') ? dbUser.links : `https://${dbUser.links}`} target="_blank" rel="noopener noreferrer" className="text-brand-accent font-bold hover:underline text-sm break-all">{dbUser.links}</a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b-2 border-brand-dark/20 mb-12 flex-wrap gap-y-4">
        <div className="flex gap-12 text-sm font-bold uppercase tracking-widest text-brand-dark">
          <button 
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-2 pb-4 border-b-2 transition-colors cursor-none ${activeTab === 'portfolio' ? 'border-brand-dark' : 'border-transparent text-brand-dark/50 hover:text-brand-dark'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Portfolio
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 pb-4 border-b-2 transition-colors cursor-none ${activeTab === 'tickets' ? 'border-brand-dark' : 'border-transparent text-brand-dark/50 hover:text-brand-dark'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            My Tickets
          </button>
          <button 
            onClick={() => setActiveTab('feed-activity')}
            className={`flex items-center gap-2 pb-4 border-b-2 transition-colors cursor-none ${activeTab === 'feed-activity' ? 'border-brand-dark' : 'border-transparent text-brand-dark/50 hover:text-brand-dark'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
            Activity
          </button>
          {vacancies.length > 0 && (
             <button 
               onClick={() => setActiveTab('employer')}
               className={`flex items-center gap-2 pb-4 border-b-2 transition-colors cursor-none text-brand-accent ${activeTab === 'employer' ? 'border-brand-accent' : 'border-transparent opacity-80 hover:opacity-100'}`}
             >
               <Briefcase size={16} />
               Employer Hub
             </button>
          )}
        </div>
      </div>

      {activeTab === 'employer' && (
         <div className="space-y-12">
            <div className="flex justify-between items-end border-b-2 border-brand-dark pb-4">
              <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark">My Posted Opportunities</h2>
            </div>
            
            {vacancies.map(v => (
               <div key={v.id} className="bg-brand-light border-4 border-brand-dark shadow-[12px_12px_0_0_var(--brand-dark)] p-8">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="text-2xl font-bold uppercase tracking-tight text-brand-dark mb-2">{v.title}</h3>
                        <p className="font-bold text-sm text-brand-dark/70 uppercase tracking-widest">{v.type} • {v.location} • {new Date(v.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                     </div>
                     <div className="bg-brand-dark text-brand-light px-4 py-2 font-bold uppercase text-xl shadow-[4px_4px_0_0_var(--brand-accent)]">
                        {applications[v.id]?.length || 0} {/* This requires the closing tag */} Applicants
                     </div>
                  </div>
                  
                  <div className="border-t-2 border-brand-dark pt-6 mt-6 space-y-6">
                     <h4 className="font-bold uppercase tracking-widest text-brand-dark">Applicants</h4>
                     {(!applications[v.id] || applications[v.id].length === 0) ? (
                        <p className="font-bold text-brand-dark/50">No applications yet.</p>
                     ) : (
                        applications[v.id].map((app: any) => (
                           <div key={app.id} className="bg-brand-muted border-2 border-brand-dark p-6">
                              <h5 className="font-bold text-xl text-brand-dark uppercase tracking-tight mb-2">{app.name}</h5>
                              <p className="font-bold text-sm text-brand-dark/70 mb-4">{app.email}</p>
                              {app.coverLetter && (
                                <p className="font-bold text-sm text-brand-dark bg-brand-light p-4 border-2 border-brand-dark mb-4 mt-2">
                                  {app.coverLetter}
                                </p>
                              )}
                              
                              <div className="mt-4 border-t-2 border-brand-dark/20 pt-4">
                                <h6 className="font-bold uppercase tracking-widest text-sm text-brand-dark mb-4">Applicant's Portfolio</h6>
                                {(!app.portfolioPosts || app.portfolioPosts.length === 0) ? (
                                   <p className="text-sm font-bold text-brand-dark/50">Applicant hasn't added any posts yet.</p>
                                ) : (
                                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {app.portfolioPosts.slice(0, 4).map((p: any) => (
                                         <div key={p.id} className="aspect-square border-2 border-brand-dark overflow-hidden bg-brand-light">
                                            <img src={p.imageUrl} alt="Portfolio item" className="w-full h-full object-cover" />
                                         </div>
                                      ))}
                                   </div>
                                )}
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            ))}
         </div>
      )}

      {activeTab === 'portfolio' && (
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-brand-dark uppercase tracking-tight">Gallery & Portfolio</h2>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-brand-dark text-brand-light px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-brand-accent transition-colors flex items-center gap-2 cursor-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              Upload Post
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {posts.length > 0 ? posts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => { setSelectedPost(post); setPostDescription(post.description || ''); }}
                className="aspect-square bg-brand-muted relative group overflow-hidden border-2 border-brand-dark cursor-pointer"
              >
                <img 
                  src={post.imageUrl} 
                  alt="Portfolio item" 
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-brand-dark/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-brand-light font-bold">
                   <div className="flex items-center gap-2"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> {post.likes}</div>
                   <div className="flex items-center gap-2"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg> {post.comments}</div>
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center p-20 border-4 border-brand-dark bg-brand-muted">
                <p className="text-2xl font-bold uppercase tracking-widest text-brand-dark">No posts yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <>
          {tickets.length === 0 ? (
            <div className="text-center p-20 border-4 border-brand-dark max-w-lg mx-auto bg-brand-muted">
              <p className="text-2xl font-bold uppercase tracking-widest text-brand-dark">No tickets found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {tickets.map((ticket, i) => (
                <div 
                  key={ticket.id} 
                  className={`card-brutal p-6 md:p-8 flex flex-col sm:flex-row gap-8 relative overflow-hidden h-full ${ticket.status === 'active' ? 'bg-[#c1ff72]' : 'bg-brand-light'}`}
                >
                   {ticket.status !== 'active' && (
                     <div className="absolute inset-0 bg-brand-light/90 z-10 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-4xl font-bold uppercase tracking-tight text-brand-dark border-4 border-brand-dark px-8 py-4 bg-brand-light shadow-[8px_8px_0_0_var(--brand-dark)] rotate-[-5deg]">
                           {ticket.status === 'used' ? t('ticket_used') : t('ticket_cancelled')}
                        </span>
                     </div>
                   )}
                   
                   <div className="flex-shrink-0 bg-brand-light p-4 border-4 border-brand-dark w-40 h-40 flex items-center justify-center shadow-[8px_8px_0_0_var(--brand-dark)] self-center sm:self-start group-hover:-translate-y-2 transition-transform">
                     <QRCodeSVG value={ticket.qrCodeData} size={130} className="w-full h-full text-[var(--brand-dark)]" />
                   </div>
                   
                   <div className="flex-col flex justify-center flex-grow">
                      <h3 className="text-3xl font-bold uppercase tracking-tight mb-6 text-brand-dark leading-none">{ticket.event?.title || 'Unknown Event'}</h3>
                      <div className="text-sm uppercase tracking-widest text-brand-dark font-bold flex flex-col gap-3">
                         <div className="flex items-center gap-4">
                           <span className="text-brand-dark/50 shrink-0 w-12 border-b-2 border-brand-dark/20 pb-1">Date</span>
                           <span className="text-brand-dark border-b-2 border-brand-dark/20 pb-1 flex-grow">{ticket.event ? new Date(ticket.event.date).toLocaleDateString() : 'N/A'}</span>
                         </div>
                         <div className="flex items-center gap-4">
                           <span className="text-brand-dark/50 shrink-0 w-12 border-b-2 border-brand-dark/20 pb-1">Loc</span>
                           <span className="text-brand-dark border-b-2 border-brand-dark/20 pb-1 flex-grow">{ticket.event?.location || 'N/A'}</span>
                         </div>
                         <div className="my-2 pt-2 text-xs border-t-2 border-brand-dark/20 text-brand-dark/70">
                           <span className="block">Purchased: {new Date(ticket.purchaseDate).toLocaleDateString()}</span>
                           <span className="block mt-1">Payment: Card ending in ****1234</span>
                         </div>
                         <div className={`mt-2 inline-flex px-4 py-2 border-2 ${ticket.status === 'active' ? 'bg-brand-dark text-[#c1ff72] border-brand-dark' : 'bg-transparent text-brand-dark/50 border-brand-dark/50'} w-max font-bold uppercase tracking-widest shadow-[4px_4px_0_0_var(--brand-dark)]`}>
                           {t('ticket_status', { status: ticket.status }).replace('Status: ', '')}
                         </div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'feed-activity' && (
        <div className="space-y-12">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-8 pb-4 border-b-4 border-brand-dark">My Posts</h2>
            <div className="space-y-6">
              {feedPosts.length === 0 ? (
                 <p className="text-brand-dark/50 font-bold uppercase tracking-widest p-8 border-4 border-brand-dark border-dashed text-center">No posts yet.</p>
              ) : feedPosts.map(p => (
                 <div key={p.id} className="bg-brand-light border-4 border-brand-dark p-6 shadow-[8px_8px_0_0_var(--brand-dark)]">
                    <p className="font-bold text-brand-dark mb-4 text-lg">{p.content}</p>
                    {p.imageUrl && <img src={p.imageUrl} alt="Post" className="w-48 h-48 object-cover border-4 border-brand-dark mb-4" />}
                    <div className="flex gap-6 text-sm font-bold uppercase tracking-widest text-brand-dark/50">
                       <span>Likes: {p.likesCount || 0}</span>
                       <span>Comments: {p.commentsCount || 0}</span>
                       <span>{p.createdAt?.toDate().toLocaleDateString()}</span>
                    </div>
                 </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-8 pb-4 border-b-4 border-brand-dark">My Comments</h2>
             <div className="space-y-6">
              {feedComments.length === 0 ? (
                 <p className="text-brand-dark/50 font-bold uppercase tracking-widest p-8 border-4 border-brand-dark border-dashed text-center">No comments yet.</p>
              ) : feedComments.map(c => (
                 <div key={c.id} className="bg-brand-muted border-l-4 border-brand-dark p-4">
                    <p className="font-bold text-brand-dark mb-2">"{c.content}"</p>
                    <div className="text-xs font-bold uppercase tracking-widest text-brand-dark/50">
                       Commented on {c.createdAt?.toDate().toLocaleDateString()}
                    </div>
                 </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'edit-profile' && (
        <form onSubmit={handleUpdateProfile} className="max-w-2xl mx-auto space-y-8 bg-brand-light p-8 border-4 border-brand-dark shadow-[12px_12px_0_0_var(--brand-dark)]">
          <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-8 pb-4 border-b-4 border-brand-dark">Edit Profile</h2>
          
          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full border-4 border-brand-dark overflow-hidden bg-brand-muted shrink-0">
                <img src={profileForm.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid}`} alt="Avatar preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow space-y-2">
                <input type="text" value={profileForm.avatarUrl} onChange={e => setProfileForm({...profileForm, avatarUrl: e.target.value})} placeholder="Or enter image URL..." className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold text-sm text-brand-dark outline-none" />
                <div className="flex gap-2">
                  <label className="cursor-pointer bg-brand-dark text-brand-light px-4 py-2 font-bold uppercase tracking-widest text-xs hover:bg-brand-accent transition-colors">
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onloadend = () => setProfileForm({...profileForm, avatarUrl: reader.result as string});
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                  <button type="button" onClick={() => setProfileForm({...profileForm, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`})} className="border-2 border-brand-dark px-4 py-2 font-bold uppercase tracking-widest text-xs hover:bg-brand-muted transition-colors">
                    Random Avatar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Display Name</label>
            <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-brand-light border-2 border-brand-dark p-4 font-bold uppercase tracking-widest text-brand-dark outline-none" />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Bio (Max 500 chars)</label>
            <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} maxLength={500} className="w-full bg-brand-light border-2 border-brand-dark p-4 font-bold text-brand-dark h-32 resize-none outline-none" placeholder="Tell us about yourself..." />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Links</label>
            <input type="text" value={profileForm.links} onChange={e => setProfileForm({...profileForm, links: e.target.value})} placeholder="linktr.ee/yourname" className="w-full bg-brand-light border-2 border-brand-dark p-4 font-bold text-brand-dark outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Industry</label>
              <input type="text" value={profileForm.industry} onChange={e => setProfileForm({...profileForm, industry: e.target.value})} className="w-full bg-brand-light border-2 border-brand-dark p-4 font-bold text-brand-dark outline-none" />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Degree</label>
              <input type="text" value={profileForm.degree} onChange={e => setProfileForm({...profileForm, degree: e.target.value})} className="w-full bg-brand-light border-2 border-brand-dark p-4 font-bold text-brand-dark outline-none" />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Interest Level</label>
              <input type="text" value={profileForm.interestLevel} onChange={e => setProfileForm({...profileForm, interestLevel: e.target.value})} className="w-full bg-brand-light border-2 border-brand-dark p-4 font-bold text-brand-dark outline-none" />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Age Group</label>
              <input type="text" value={profileForm.ageGroup} onChange={e => setProfileForm({...profileForm, ageGroup: e.target.value})} className="w-full bg-brand-light border-2 border-brand-dark p-4 font-bold text-brand-dark outline-none" />
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Primary Goal</label>
            <input type="text" value={profileForm.primaryGoal} onChange={e => setProfileForm({...profileForm, primaryGoal: e.target.value})} className="w-full bg-brand-light border-2 border-brand-dark p-4 font-bold text-brand-dark outline-none" />
          </div>

          <div className="pt-6 border-t-4 border-brand-dark flex gap-4">
            <button type="submit" disabled={updatingProfile} className="flex-1 bg-brand-dark text-brand-light px-6 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors disabled:opacity-50">
              {updatingProfile ? 'Saving...' : 'Save Profile'}
            </button>
            <button type="button" onClick={() => setActiveTab('portfolio')} className="px-6 py-4 border-2 border-brand-dark font-bold uppercase tracking-widest text-brand-dark hover:bg-brand-muted transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {selectedPost && (
        <div className="fixed inset-0 bg-brand-dark/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-brand-light border-4 border-brand-dark max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 aspect-square bg-brand-dark border-r-0 md:border-r-4 border-b-4 md:border-b-0 border-brand-dark">
                 <img src={selectedPost.imageUrl} alt="Post" className="w-full h-full object-cover" />
              </div>
              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col">
                 <div className="flex justify-between items-start mb-8">
                    <h3 className="text-2xl font-bold uppercase tracking-tight text-brand-dark">Edit Post</h3>
                    <button onClick={() => setSelectedPost(null)} className="text-brand-dark hover:text-brand-accent transition-colors">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
                 
                 <div className="flex-grow space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold uppercase tracking-widest text-brand-dark">Description</label>
                      <textarea 
                        value={postDescription} 
                        onChange={e => setPostDescription(e.target.value)} 
                        maxLength={2000}
                        className="w-full bg-brand-muted border-2 border-brand-dark p-4 font-bold text-brand-dark min-h-[150px] outline-none resize-none"
                        placeholder="Write a caption..."
                      />
                    </div>
                 </div>
                 
                 <div className="mt-8 pt-8 border-t-2 border-brand-dark flex flex-col sm:flex-row gap-4">
                    <button onClick={handleUpdatePost} className="flex-1 bg-brand-dark text-brand-light px-6 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors">
                      Save Changes
                    </button>
                    <button onClick={() => handleDeletePost(selectedPost.id)} className="px-6 py-4 border-2 border-red-500 text-red-600 font-bold uppercase tracking-widest hover:bg-red-50 hover:border-red-600 transition-colors flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Delete
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
