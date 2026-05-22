import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'motion/react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Event } from '../types';

function TypingEffect({ texts, typingSpeed = 50, deletingSpeed = 30, pauseTime = 1500 }: { texts: string[], typingSpeed?: number, deletingSpeed?: number, pauseTime?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const currentText = texts[currentIndex];

    if (isDeleting) {
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(prev => prev.slice(0, -1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % texts.length);
      }
    } else {
      if (displayText.length < currentText.length) {
        timer = setTimeout(() => {
          setDisplayText(prev => currentText.slice(0, prev.length + 1));
        }, typingSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseTime);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex, texts, typingSpeed, deletingSpeed, pauseTime]);

  return (
    <span className="font-bold bg-brand-accent text-brand-light px-3 py-1 ml-3 inline-flex items-center uppercase tracking-tight transform -skew-x-6 min-w-[200px] md:min-w-[260px] h-12 md:h-14">
      <span className="w-full truncate">{displayText}</span>
      <span className="w-[8px] shrink-0 h-[1em] bg-brand-light ml-[4px] animate-pulse inline-block"></span>
    </span>
  );
}

const TEST_NEWS: any[] = [];

export default function Home() {
  const { t } = useTranslation();
  const [newsIndex, setNewsIndex] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState('');

  const [sponsorshipForm, setSponsorshipForm] = useState({ brandName: '', email: '', message: '' });
  const [sponsorshipStatus, setSponsorshipStatus] = useState('');
  const [selectedNews, setSelectedNews] = useState<typeof TEST_NEWS[0] | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail) return;
    try {
      setSubStatus('subscribing');
      await addDoc(collection(db, 'subscribers'), {
        email: subEmail,
        createdAt: serverTimestamp()
      });
      setSubStatus('success');
      setSubEmail('');
      setTimeout(() => setSubStatus(''), 3000);
    } catch (err) {
      setSubStatus('error');
    }
  };

  const handleSponsorshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorshipForm.brandName || !sponsorshipForm.email) return;
    try {
      setSponsorshipStatus('submitting');
      await addDoc(collection(db, 'sponsorships'), {
        ...sponsorshipForm,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSponsorshipStatus('success');
      setSponsorshipForm({ brandName: '', email: '', message: '' });
      setTimeout(() => setSponsorshipStatus(''), 3000);
    } catch (err) {
      setSponsorshipStatus('error');
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      const q = query(collection(db, 'events'));
      const snapshots = await getDocs(q);
      setCalendarEvents(snapshots.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (TEST_NEWS.length === 0) return;
    const timer = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % TEST_NEWS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextNews = () => {
    if (TEST_NEWS.length === 0) return;
    setNewsIndex((prev) => (prev + 1) % TEST_NEWS.length);
  };

  const prevNews = () => {
    if (TEST_NEWS.length === 0) return;
    setNewsIndex((prev) => (prev - 1 + TEST_NEWS.length) % TEST_NEWS.length);
  };

  return (
    <div className="animate-in fade-in duration-700 flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] border-b-2 border-brand-dark">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-brand-light relative z-10"
        >
          <div className="w-full h-2 bg-brand-dark mb-12 hidden lg:block max-w-[200px]"></div>
          
          <h1 className="text-[3.5rem] md:text-[6rem] lg:text-[8rem] font-bold leading-[0.85] tracking-tighter uppercase mb-12 text-brand-dark overflow-hidden break-words hyphens-auto">
            AZ<br />FASHION<br />FUTURE
          </h1>
          
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-tight mb-16 flex flex-wrap items-center gap-y-4">
            <span>Discover the next</span>
            <TypingEffect texts={["fashion.", "designer.", "event.", "sponsor.", "internship.", "vacancy."]} />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 mt-auto cursor-none">
            <Link to="/events" className="brand-button flex items-center justify-center gap-4 text-center cursor-none">
              Explore Events
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link to="/designers" className="bg-brand-light text-brand-dark border-2 border-brand-dark hover:bg-brand-dark hover:text-brand-light transition-all font-bold uppercase tracking-widest px-8 py-4 flex items-center justify-center gap-3 cursor-none">
              A-Z Designers
            </Link>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full lg:w-1/2 h-[50vh] lg:h-auto relative border-t-2 lg:border-t-0 lg:border-l-2 border-brand-dark overflow-hidden group bg-brand-dark"
        >
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover grayscale-[30%] opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
            src="https://res.cloudinary.com/dcvsf3tnn/video/upload/v1772653652/samples/sea-turtle.mp4"
          />
          <div className="absolute inset-0 bg-brand-dark/10 mix-blend-multiply pointer-events-none"></div>
        </motion.div>
      </section>

      {/* Marquee */}
      <div className="marquee-container">
        <div className="marquee-content">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="mx-8 flex items-center gap-8 text-brand-light">
              <span>AVANT-GARDE</span>
              <span className="w-3 h-3 bg-brand-accent rounded-full"></span>
              <span>HAUTE COUTURE</span>
              <span className="w-3 h-3 bg-brand-accent rounded-full"></span>
              <span>STREETWEAR</span>
              <span className="w-3 h-3 bg-brand-accent rounded-full"></span>
            </span>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section className="flex flex-col md:flex-row border-b-2 border-brand-dark overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="w-full md:w-1/2 border-b-2 md:border-b-0 md:border-r-2 border-brand-dark p-8 md:p-16 lg:p-24 flex flex-col justify-center"
        >
          <div className="font-bold text-brand-dark mb-4 tracking-widest text-sm uppercase">01 // Mission</div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 text-brand-dark tracking-tighter uppercase leading-[0.9]">Elevating<br/>Style</h2>
          <p className="text-brand-dark/80 leading-relaxed mb-12 text-xl font-medium max-w-lg">
            Our platform connects fashion enthusiasts with the most prestigious events happening across the country. From avant-garde exhibitions to ready-to-wear runway shows, we curate the definitive calendar of Azerbaijani fashion.
          </p>
          <div className="font-bold">
            <Link to="/events" className="text-brand-dark uppercase tracking-widest text-sm hover:text-brand-accent border-b-2 border-brand-dark hover:border-brand-accent pb-1 transition-colors flex items-center gap-2 group w-max cursor-none">
              VIEW CALENDAR
            </Link>
          </div>
        </motion.div>
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2 relative bg-brand-muted min-h-[50vh]"
        >
          <img 
             src="https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?auto=format&fit=crop&q=80" 
             alt="Tech fashion aesthetic" 
             className="absolute inset-0 w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700" 
             crossOrigin="anonymous" 
          />
        </motion.div>
      </section>

      {/* Calendar Section */}
      <section className="p-8 md:p-12 lg:p-16 border-b-2 border-brand-dark overflow-hidden bg-brand-light">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex justify-between items-end border-b-4 border-brand-dark pb-6 mb-8">
            <div>
              <div className="font-bold text-brand-dark mb-2 tracking-widest text-xs uppercase">02 // Schedule</div>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tighter uppercase">Calendar</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="font-bold uppercase tracking-widest text-[10px] md:text-xs text-center border-b-2 border-brand-dark pb-2">
                {d}
              </div>
            ))}
            {Array.from({ length: 30 }).map((_, i) => {
               const dayEvents = calendarEvents.filter(e => {
                 const evDate = new Date(e.date);
                 return evDate.getDate() === i + 1;
               });
               
               return (
                 <div key={i} className="aspect-square border-2 border-brand-dark/20 p-1 relative hover:bg-brand-muted transition-colors flex flex-col items-center justify-center overflow-hidden">
                   <span className="font-bold text-brand-dark/50 absolute top-1 left-1.5 text-xs z-10">{i + 1}</span>
                   {dayEvents.length > 0 && (
                     <div className="absolute inset-0 flex">
                       {dayEvents.slice(0, 1).map(ev => (
                         <Link key={ev.id} to={`/event/${ev.id}`} className="w-full h-full block cursor-none" title={ev.title}>
                           <img 
                             src={ev.image} 
                             alt={ev.title} 
                             className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
                             crossOrigin="anonymous" 
                           />
                         </Link>
                       ))}
                     </div>
                   )}
                 </div>
               );
            })}
          </div>
        </motion.div>
      </section>

      {/* News Section */}
      <section className="p-8 md:p-16 lg:p-24 border-b-2 border-brand-dark overflow-hidden bg-brand-light">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex justify-between items-end border-b-4 border-brand-dark pb-8 mb-12">
            <div>
              <div className="font-bold text-brand-dark mb-4 tracking-widest text-sm uppercase">03 // Latest Updates</div>
              <h2 className="text-5xl md:text-7xl font-bold text-brand-dark tracking-tighter uppercase">News</h2>
            </div>
            <div className="flex gap-4">
              <button onClick={prevNews} className="w-12 h-12 border-2 border-brand-dark flex items-center justify-center hover:bg-brand-accent hover:text-brand-light hover:border-brand-accent transition-colors cursor-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={nextNews} className="w-12 h-12 border-2 border-brand-dark flex items-center justify-center hover:bg-brand-accent hover:text-brand-light hover:border-brand-accent transition-colors cursor-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="overflow-hidden relative h-[300px]">
            {TEST_NEWS.length === 0 ? (
               <div className="flex h-full items-center justify-center border-4 border-brand-dark bg-brand-muted">
                 <p className="text-2xl font-bold uppercase tracking-widest text-brand-dark">No news articles yet.</p>
               </div>
            ) : (
              <motion.div 
                className="flex gap-8 absolute left-0 ease-in-out"
                animate={{ x: `calc(-${newsIndex * 100}% - ${newsIndex * 2}rem)` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {TEST_NEWS.map((news) => (
                  <div key={news.id} className="min-w-full md:min-w-[calc(50%-1rem)] lg:min-w-[calc(33.333%-1.33rem)] p-8 border-4 border-brand-dark bg-brand-light shadow-[12px_12px_0_0_var(--brand-dark)]">
                    <div className="text-brand-dark/50 font-bold mb-4 uppercase tracking-widest text-xs">{news.date}</div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight text-brand-dark mb-4 h-16">{news.title}</h3>
                    <p className="text-brand-dark/80 font-bold mb-6">{news.snippet}</p>
                    <button onClick={() => setSelectedNews(news)} className="bg-brand-dark text-brand-light px-6 py-2 font-bold uppercase tracking-widest text-xs hover:bg-brand-accent border-2 border-brand-dark transition-colors cursor-none">
                       Read Full Story
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* News Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-brand-dark/80" onClick={() => setSelectedNews(null)}></div>
           <div className="relative z-10 bg-brand-light border-4 border-brand-dark p-8 md:p-12 max-w-2xl w-full card-brutal shadow-[16px_16px_0_0_var(--brand-accent)]">
              <div className="text-brand-accent font-bold uppercase tracking-widest text-sm mb-4">{selectedNews.date}</div>
              <h3 className="text-4xl font-bold uppercase tracking-tight text-brand-dark mb-6">{selectedNews.title}</h3>
              <div className="text-brand-dark font-bold text-lg mb-8 leading-relaxed border-t-2 border-brand-dark pt-6">
                 {selectedNews.snippet}
                 <br/><br/>
                 Here is the extended content for the detailed news article about "{selectedNews.title}". The Azerbaijani fashion industry is rapidly expanding and our platform captures everything you need to know.
              </div>
              <button 
                onClick={() => setSelectedNews(null)}
                className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent transition-all cursor-none"
              >
                Close
              </button>
           </div>
        </div>
      )}

      {/* Opportunities Section */}
      <section className="p-8 md:p-16 lg:p-24 border-b-2 border-brand-dark overflow-hidden bg-brand-light">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <div className="mb-16 border-b-4 border-brand-dark pb-8">
            <div className="font-bold text-brand-dark mb-4 tracking-widest text-sm uppercase">04 // Join Us</div>
            <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-4 text-brand-dark">
              Opportunities
            </h2>
            <p className="text-brand-dark font-bold text-xl uppercase tracking-widest max-w-3xl border-t-2 border-brand-dark pt-4 mt-8">
              Open Vacancies, Internships, and Volunteer Programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[ 
              { title: "Vacancies", desc: "Join the core team behind the biggest fashion events in the country. We are looking for experienced event coordinators, digital marketers, and art directors.", action: "View Openings", link: "/vacancies" },
              { title: "Internships", desc: "Gain real-world experience in the fashion industry. Our 3-month intensive programs are perfect for students and recent graduates looking to make their mark.", action: "Apply Now", link: "/internships" },
              { title: "Volunteers", desc: "Be part of the backstage magic. Help us run the biggest fashion events in the country.", action: "Sign Up", link: "/volunteers" },
            ].map((role, i) => (
              <motion.div 
                key={role.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card-brutal p-8 flex flex-col h-full bg-brand-light"
              >
                <h3 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-4">{role.title}</h3>
                <p className="text-brand-dark font-bold mb-6 flex-grow">
                  {role.desc}
                </p>
                <Link to={role.link} className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0_0_var(--brand-accent)] transition-all cursor-none text-center block">
                  {role.action}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Partners Section */}
      <section className="p-8 md:p-16 lg:p-24 border-b-2 border-brand-dark overflow-hidden bg-brand-light">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <div className="mb-16 border-b-4 border-brand-dark pb-8">
            <div className="font-bold text-brand-dark mb-4 tracking-widest text-sm uppercase">05 // Sponsorships</div>
            <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-4 text-brand-dark">
              Sponsor a Show
            </h2>
            <p className="text-brand-dark font-bold text-xl uppercase tracking-widest max-w-3xl border-t-2 border-brand-dark pt-4 mt-8">
              Partner with the most highly anticipated fashion events in Azerbaijan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="card-brutal p-8 md:p-12 bg-brand-muted">
              <h3 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-6">Why Sponsor?</h3>
              <ul className="space-y-4 font-bold text-brand-dark">
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent mt-1">●</span>
                  Brand visibility across digital, print, and physical spaces during fashion week.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent mt-1">●</span>
                  Direct engagement with an exclusive demographic of industry professionals, influencers, and high-net-worth individuals.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent mt-1">●</span>
                  VIP access and dedicated lounges for your premium clients.
                </li>
              </ul>
            </div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-brand-dark text-brand-light p-8 md:p-12 text-center card-brutal shadow-[12px_12px_0_0_var(--brand-accent)] transition-all"
            >
              <h3 className="text-3xl font-bold uppercase tracking-tighter mb-4 text-brand-light">Apply for Sponsorship</h3>
              <p className="text-brand-light/80 mb-8 font-bold">
                Tell us about your brand and which upcoming events align with your marketing goals. Our partnership team will be in touch.
              </p>
              <form className="flex flex-col gap-4 text-left" onSubmit={handleSponsorshipSubmit}>
                 <input type="text" placeholder="Brand Name" required value={sponsorshipForm.brandName} onChange={e => setSponsorshipForm({ ...sponsorshipForm, brandName: e.target.value })} className="w-full bg-brand-light text-brand-dark border-2 border-brand-light px-4 py-3 font-bold uppercase tracking-widest text-sm outline-none focus:border-brand-accent" />
                 <input type="email" placeholder="Contact Email" required value={sponsorshipForm.email} onChange={e => setSponsorshipForm({ ...sponsorshipForm, email: e.target.value })} className="w-full bg-brand-light text-brand-dark border-2 border-brand-light px-4 py-3 font-bold uppercase tracking-widest text-sm outline-none focus:border-brand-accent" />
                 <textarea placeholder="Message / Details" required value={sponsorshipForm.message} onChange={e => setSponsorshipForm({ ...sponsorshipForm, message: e.target.value })} className="w-full bg-brand-light text-brand-dark border-2 border-brand-light px-4 py-3 font-bold uppercase tracking-widest text-sm outline-none focus:border-brand-accent h-24 resize-none"></textarea>
                 <button disabled={sponsorshipStatus === 'submitting'} type="submit" className="bg-brand-accent text-brand-light border-2 border-brand-accent px-8 py-4 font-bold uppercase tracking-widest hover:bg-brand-light hover:text-brand-dark transition-all cursor-none w-full mt-4 disabled:opacity-50">
                   {sponsorshipStatus === 'submitting' ? 'Submitting...' : (sponsorshipStatus === 'success' ? 'Submitted!' : 'Send Request')}
                 </button>
                 {sponsorshipStatus === 'error' && <p className="text-red-300 font-bold text-xs uppercase tracking-widest">Error submitting request.</p>}
              </form>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Newsletter / CTA */}
      {/* Newsletter Section */}
      <section className="bg-brand-accent text-brand-light p-12 md:p-24 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] border-[40px] border-[#fff]/20 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] border-[20px] border-[#fff]/20 rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto flex flex-col items-center"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter uppercase leading-none text-brand-light">Join the<br/>Front Row</h2>
          <p className="text-brand-light mb-12 text-xl font-bold max-w-xl">Subscribe to our newsletter for updates on upcoming collections, exclusive event information, and backstage news.</p>
          <form className="flex flex-col sm:flex-row w-full max-w-xl gap-0 relative" onSubmit={handleSubscribe}>
             <input 
               type="email" 
               placeholder="ENTER YOUR EMAIL" 
               required 
               value={subEmail}
               onChange={e => setSubEmail(e.target.value)}
               className="flex-1 bg-brand-light text-brand-dark p-4 outline-none font-bold uppercase tracking-widest text-sm border-2 border-brand-dark sm:border-r-0" 
             />
             <button disabled={subStatus === 'subscribing'} type="submit" className="bg-brand-dark text-brand-light font-bold text-sm tracking-widest px-8 py-4 uppercase border-2 border-brand-dark hover:bg-brand-light hover:text-brand-dark transition-colors cursor-none disabled:opacity-50">
               {subStatus === 'subscribing' ? '...' : (subStatus === 'success' ? 'DONE' : 'SUBSCRIBE')}
             </button>
             {subStatus === 'error' && <span className="absolute -bottom-8 left-0 text-red-300 font-bold text-xs tracking-widest">Error subscribing. Try again.</span>}
          </form>
        </motion.div>
      </section>
    </div>
  );
}
