import React, { useState, useEffect } from 'react';
import { doc, setDoc, collection, getDocs, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Trash2, Edit2, Check, X, Eye } from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'tickets'>('events');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [designers, setDesigners] = useState<any[]>(() => JSON.parse(localStorage.getItem('MOCK_DESIGNERS') || '[]'));
  const [education, setEducation] = useState<any[]>(() => JSON.parse(localStorage.getItem('MOCK_EDUCATION') || '[]'));
  const [agencies, setAgencies] = useState<any[]>(() => JSON.parse(localStorage.getItem('MOCK_AGENCIES') || '[]'));

  useEffect(() => {
    // Only initialize from localStorage if there's no data, but do not inject mock data
    // because the user wants to start from scratch.
    const d = localStorage.getItem('MOCK_DESIGNERS');
    const e = localStorage.getItem('MOCK_EDUCATION');
    const a = localStorage.getItem('MOCK_AGENCIES');
    
    if (d) setDesigners(JSON.parse(d));
    if (e) setEducation(JSON.parse(e));
    if (a) setAgencies(JSON.parse(a));
  }, []);

  const [addModalType, setAddModalType] = useState<'designers'|'education'|'agencies'|'job'|null>(null);
  const [addModalEditingId, setAddModalEditingId] = useState<number | null>(null);
  
  const INITIAL_MODAL_DATA = { 
    name: '', details: '', location: '', salary: '', type: 'Full-time',
    bio: '', links: '', program: '', price: '', website: '', imageUrl: '' 
  };
  const [addModalData, setAddModalData] = useState(INITIAL_MODAL_DATA);
  const [ticketSearch, setTicketSearch] = useState('');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addModalData.name) return;

    if (addModalType === 'designers') {
      const newD = addModalEditingId 
        ? designers.map(d => d.id === addModalEditingId ? { ...d, name: addModalData.name, focus: addModalData.details || 'N/A', bio: addModalData.bio, links: addModalData.links } : d)
        : [...designers, { id: Date.now(), name: addModalData.name, focus: addModalData.details || 'N/A', bio: addModalData.bio, links: addModalData.links }];
      setDesigners(newD);
      localStorage.setItem('MOCK_DESIGNERS', JSON.stringify(newD));
    } else if (addModalType === 'education') {
      const newE = addModalEditingId
        ? education.map(e => e.id === addModalEditingId ? { ...e, name: addModalData.name, location: addModalData.location || 'N/A', program: addModalData.program, price: addModalData.price, website: addModalData.website, imageUrl: addModalData.imageUrl, details: addModalData.details } : e)
        : [...education, { id: Date.now(), name: addModalData.name, location: addModalData.location || 'N/A', program: addModalData.program, price: addModalData.price, website: addModalData.website, imageUrl: addModalData.imageUrl, details: addModalData.details }];
      setEducation(newE);
      localStorage.setItem('MOCK_EDUCATION', JSON.stringify(newE));
    } else if (addModalType === 'agencies') {
      const newA = addModalEditingId
        ? agencies.map(a => a.id === addModalEditingId ? { ...a, name: addModalData.name, location: addModalData.details || 'N/A' } : a)
        : [...agencies, { id: Date.now(), name: addModalData.name, location: addModalData.details || 'N/A' }];
      setAgencies(newA);
      localStorage.setItem('MOCK_AGENCIES', JSON.stringify(newA));
    } else if (addModalType === 'job') {
      try {
         await addDoc(collection(db, 'vacancies'), {
            title: addModalData.name,
            description: addModalData.details,
            location: addModalData.location,
            salary: addModalData.salary,
            type: addModalData.type,
            employerId: 'PLATFORM_ADMIN',
            createdAt: serverTimestamp()
         });
         alert('Vacancy posted successfully');
      } catch (err) {
         handleFirestoreError(err, OperationType.CREATE, 'vacancies');
      }
    }
    setAddModalType(null);
    setAddModalEditingId(null);
    setAddModalData(INITIAL_MODAL_DATA);
  };

  const startEditMockItem = (type: 'designers'|'education'|'agencies', selected: any) => {
    setAddModalType(type);
    setAddModalEditingId(selected.id);
    setAddModalData({ 
      ...INITIAL_MODAL_DATA,
      name: selected.name || '', 
      details: selected.focus || selected.details || (type === 'agencies' ? selected.location : '') || '',
      location: selected.location || '',
      bio: selected.bio || '',
      links: selected.links || '',
      program: selected.program || '',
      price: selected.price || '',
      website: selected.website || '',
      imageUrl: selected.imageUrl || ''
    });
  };

  const deleteMockItem = (type: 'designers'|'education'|'agencies', id: number) => {
    if (!confirm('Delete this entry?')) return;
    if (type === 'designers') {
      const newD = designers.filter(d => d.id !== id);
      setDesigners(newD);
      localStorage.setItem('MOCK_DESIGNERS', JSON.stringify(newD));
    }
    if (type === 'education') {
      const newE = education.filter(e => e.id !== id);
      setEducation(newE);
      localStorage.setItem('MOCK_EDUCATION', JSON.stringify(newE));
    }
    if (type === 'agencies') {
      const newA = agencies.filter(a => a.id !== id);
      setAgencies(newA);
      localStorage.setItem('MOCK_AGENCIES', JSON.stringify(newA));
    }
  };

  const [formData, setFormData] = useState({
    id: '', title: '', description: '', date: '', location: '', imageUrl: '', price: 0, totalTickets: 100
  });
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'events') fetchEvents();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'tickets') fetchTickets();
      if (activeTab === 'sponsorships') fetchSponsorships();
      if (activeTab === 'careers') fetchJobApplications();
    }
  }, [isAdmin, activeTab]);

  const fetchSponsorships = async () => {
    try {
      const qs = await getDocs(collection(db, 'sponsorships'));
      setSponsorships(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'sponsorships');
    }
  };

  const fetchJobApplications = async () => {
    try {
      const qs = await getDocs(collection(db, 'jobApplications'));
      setJobApplications(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'jobApplications');
    }
  };

  const fetchEvents = async () => {
    try {
      const qs = await getDocs(collection(db, 'events'));
      setEvents(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'events');
    }
  };

  const fetchUsers = async () => {
    try {
      const qs = await getDocs(collection(db, 'users'));
      setUsers(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }
  };

  const fetchTickets = async () => {
    try {
      const qs = await getDocs(collection(db, 'tickets'));
      setTickets(qs.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'tickets');
    }
  };

  if (!isAdmin) {
    return <div className="p-12 text-center text-brand-dark/50 font-bold uppercase tracking-widest">{t('no_events') || 'Access Denied'}</div>;
  }

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const timestamp = Date.now();
      const eventDate = new Date(formData.date).getTime();
      
      if (isEditingEvent && formData.id) {
        const eventRef = doc(db, 'events', formData.id);
        const eventData = events.find(ev => ev.id === formData.id);
        await updateDoc(eventRef, {
          title: formData.title, description: formData.description, date: eventDate,
          location: formData.location, imageUrl: formData.imageUrl, price: Number(formData.price),
          totalTickets: Number(formData.totalTickets),
          availableTickets: Number(formData.totalTickets) - (eventData.totalTickets - eventData.availableTickets),
          updatedAt: timestamp
        });
      } else {
        const eventId = crypto.randomUUID();
        const eventRef = doc(db, 'events', eventId);
        await setDoc(eventRef, {
          title: formData.title, description: formData.description, date: eventDate,
          location: formData.location, imageUrl: formData.imageUrl, price: Number(formData.price),
          totalTickets: Number(formData.totalTickets), availableTickets: Number(formData.totalTickets),
          createdAt: timestamp, updatedAt: timestamp
        });
      }
      setShowEventForm(false);
      fetchEvents();
      alert(isEditingEvent ? 'Event updated!' : 'Event created!');
    } catch (err) {
      handleFirestoreError(err, isEditingEvent ? OperationType.UPDATE : OperationType.CREATE, 'events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      fetchEvents();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'events');
    }
  };

  const startEditEvent = (ev: any) => {
    setFormData({
      id: ev.id, title: ev.title, description: ev.description, location: ev.location,
      imageUrl: ev.imageUrl, price: ev.price, totalTickets: ev.totalTickets,
      date: new Date(ev.date).toISOString().slice(0, 16)
    });
    setIsEditingEvent(true);
    setShowEventForm(true);
  };

  const handleUpdateUserRole = async (userId: string, currentRole: string, createdAt: number) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', userId), { role: newRole, createdAt });
      fetchUsers();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      fetchUsers();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'users');
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await deleteDoc(doc(db, 'tickets', id));
      fetchTickets();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'tickets');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 animate-in fade-in duration-700">
      <div className="mb-12 border-b-4 border-brand-dark pb-8">
        <h1 className="text-5xl lg:text-7xl font-bold uppercase tracking-tighter mb-8 text-brand-dark">Admin Console</h1>
        <div className="flex flex-wrap gap-4">
          {['events', 'users', 'tickets', 'designers', 'sponsorships', 'careers', 'education', 'agencies'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-bold uppercase tracking-widest border-2 border-brand-dark transition-all cursor-none ${
                activeTab === tab ? 'bg-brand-dark text-brand-light' : 'bg-transparent text-brand-dark hover:bg-brand-accent hover:border-brand-accent hover:text-brand-light'
              }`}>
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'events' && (
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark">Manage Events</h2>
            {!showEventForm && (
              <button onClick={() => {
                setFormData({ id: '', title: '', description: '', date: '', location: '', imageUrl: '', price: 0, totalTickets: 100 });
                setIsEditingEvent(false);
                setShowEventForm(true);
              }} className="bg-brand-dark text-brand-light px-6 py-3 font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors">
                + Create New Event
              </button>
            )}
          </div>

          {showEventForm ? (
            <div className="bg-brand-light border-4 border-brand-dark p-8 md:p-12 shadow-[16px_16px_0_0_var(--brand-dark)] mb-12">
              <div className="flex justify-between items-center mb-8 border-b-4 border-brand-dark pb-6">
                 <h3 className="text-4xl font-bold uppercase tracking-tighter text-brand-dark">{isEditingEvent ? 'Edit Event' : t('create_event')}</h3>
                 <button onClick={() => setShowEventForm(false)} className="hover:text-brand-accent"><X size={32} /></button>
              </div>
              <form onSubmit={handleEventSubmit} className="flex flex-col gap-8 relative z-10">
                <div>
                   <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">{t('event_title')}</label>
                   <input required type="text" className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-bold rounded-none"
                     value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                   <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">{t('event_description')}</label>
                   <textarea required rows={4} className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-bold rounded-none resize-none"
                     value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                     <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Date</label>
                     <input required type="datetime-local" className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-bold rounded-none"
                       value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Location</label>
                     <input required type="text" className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-bold rounded-none"
                       value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                </div>
                <div>
                   <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Image URL</label>
                   <input type="url" required className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-bold rounded-none"
                     value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                     <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Price (AZN)</label>
                     <input required type="number" min="0" step="0.01" className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-bold rounded-none"
                       value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                  </div>
                  <div>
                     <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Total Tickets</label>
                     <input required type="number" min="1" className="w-full bg-transparent border-2 border-brand-dark p-4 focus:outline-none focus:border-brand-accent transition-colors font-bold rounded-none"
                       value={formData.totalTickets} onChange={e => setFormData({...formData, totalTickets: Number(e.target.value)})} />
                  </div>
                </div>
                <button disabled={loading} type="submit" className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-5 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[8px_8px_0_0_var(--brand-accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-center">
                   {loading ? 'Saving...' : (isEditingEvent ? 'Update Event' : t('create_event'))}
                </button>
              </form>
            </div>
          ) : (
             <div className="flex flex-col gap-4">
                {events.map((ev: any) => (
                  <div key={ev.id} className="card-brutal p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-6">
                        <img src={ev.imageUrl} alt="" className="w-24 h-24 object-cover border-2 border-brand-dark grayscale-[50%]" />
                        <div>
                           <h4 className="text-xl font-bold uppercase tracking-tight text-brand-dark">{ev.title}</h4>
                           <p className="font-bold text-brand-dark/50">{new Date(ev.date).toLocaleDateString()} &middot; {ev.availableTickets} / {ev.totalTickets} left</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => startEditEvent(ev)} className="w-12 h-12 flex items-center justify-center border-2 border-brand-dark hover:bg-brand-accent hover:text-brand-light hover:border-brand-accent transition-colors bg-brand-light">
                           <Edit2 size={20} />
                        </button>
                        <button onClick={() => handleDeleteEvent(ev.id)} className="w-12 h-12 flex items-center justify-center border-2 border-brand-dark hover:bg-brand-accent hover:text-brand-light hover:border-brand-accent transition-colors bg-brand-light text-brand-dark">
                           <Trash2 size={20} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="overflow-x-auto border-4 border-brand-dark shadow-[16px_16px_0_0_var(--brand-dark)] bg-brand-light">
           <table className="w-full text-left font-bold border-collapse">
              <thead>
                 <tr className="border-b-4 border-brand-dark bg-brand-muted text-brand-dark uppercase tracking-widest text-sm">
                    <th className="p-6 border-r-2 border-brand-dark">Email</th>
                    <th className="p-6 border-r-2 border-brand-dark">Name</th>
                    <th className="p-6 border-r-2 border-brand-dark">Joined</th>
                    <th className="p-6 border-r-2 border-brand-dark">Role</th>
                    <th className="p-6 text-center">Actions</th>
                 </tr>
              </thead>
              <tbody>
                 {users.map(u => (
                    <tr key={u.id} className="border-b-2 border-brand-dark/20 hover:bg-brand-muted/50 transition-colors">
                       <td className="p-6 border-r-2 border-brand-dark/20">{u.email}</td>
                       <td className="p-6 border-r-2 border-brand-dark/20">{u.name}</td>
                       <td className="p-6 border-r-2 border-brand-dark/20 text-brand-dark/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                       <td className="p-6 border-r-2 border-brand-dark/20">
                          <span className={`px-3 py-1 text-xs uppercase tracking-widest border-2 ${u.role === 'admin' ? 'border-brand-accent text-brand-accent' : 'border-brand-dark text-brand-dark'}`}>
                             {u.role}
                          </span>
                       </td>
                       <td className="p-6 flex justify-center gap-4">
                          <button onClick={() => handleUpdateUserRole(u.id, u.role, u.createdAt)} 
                                  className="text-xs uppercase tracking-widest font-bold border-b-2 border-brand-dark hover:text-brand-accent hover:border-brand-accent transition-colors pb-1">
                             Toggle Role
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} 
                                  className="text-xs uppercase tracking-widest font-bold text-brand-accent border-b-2 border-brand-accent hover:text-red-600 hover:border-red-600 transition-colors pb-1">
                             Delete
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="overflow-x-auto border-4 border-brand-dark shadow-[16px_16px_0_0_var(--brand-dark)] bg-brand-light pb-8">
           <div className="p-6 border-b-4 border-brand-dark flex flex-col md:flex-row gap-4 justify-between items-center bg-brand-muted">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-brand-dark">Tickets Search</h2>
              <input type="text" placeholder="Search by Ticket ID or Email..." value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} className="w-full md:w-96 bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent text-sm" />
           </div>
           <table className="w-full text-left font-bold border-collapse">
              <thead>
                 <tr className="border-b-4 border-brand-dark bg-brand-muted text-brand-dark uppercase tracking-widest text-sm">
                    <th className="p-6 border-r-2 border-brand-dark">Ticket ID</th>
                    <th className="p-6 border-r-2 border-brand-dark">Buyer (User)</th>
                    <th className="p-6 border-r-2 border-brand-dark">Event & Date</th>
                    <th className="p-6 border-r-2 border-brand-dark">Qty</th>
                    <th className="p-6 border-r-2 border-brand-dark">Status</th>
                    <th className="p-6 border-r-2 border-brand-dark">Purchase Date</th>
                    <th className="p-6">Actions</th>
                 </tr>
              </thead>
              <tbody>
                 {tickets
                  .filter(t => t.id.toLowerCase().includes(ticketSearch.toLowerCase()) || (t.userId.toLowerCase().includes(ticketSearch.toLowerCase())))
                  .map(t => {
                    const evt = events.find(e => e.id === t.eventId);
                    return (
                      <tr key={t.id} className="border-b-2 border-brand-dark/20 hover:bg-brand-muted/50 transition-colors">
                         <td className="p-6 border-r-2 border-brand-dark/20 text-xs font-mono">{t.id.slice(0,8)}...</td>
                         <td className="p-6 border-r-2 border-brand-dark/20 text-brand-accent text-xs font-mono block truncate w-32">{t.userId}</td>
                         <td className="p-6 border-r-2 border-brand-dark/20">
                           <div className="flex flex-col">
                             <span>{evt?.title || 'Unknown'}</span>
                             <span className="text-xs text-brand-dark/50">{evt?.date ? new Date(evt.date).toLocaleDateString() : 'N/A'}</span>
                           </div>
                         </td>
                         <td className="p-6 border-r-2 border-brand-dark/20 font-mono text-center">{t.quantity || 1}</td>
                         <td className="p-6 border-r-2 border-brand-dark/20 uppercase tracking-widest text-xs">
                           <span className={`${t.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>{t.status}</span>
                         </td>
                         <td className="p-6 border-r-2 border-brand-dark/20 text-brand-dark/50">{new Date(t.purchaseDate).toLocaleDateString()}</td>
                         <td className="p-6 flex justify-center">
                            <button onClick={() => handleDeleteTicket(t.id)} className="w-10 h-10 flex items-center justify-center border-2 border-brand-dark hover:bg-brand-accent hover:text-brand-light hover:border-brand-accent transition-colors bg-brand-light text-brand-dark">
                               <Trash2 size={16} />
                            </button>
                         </td>
                      </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
      )}

      {activeTab === 'designers' as any && (
        <div className="bg-brand-light border-4 border-brand-dark shadow-[16px_16px_0_0_var(--brand-dark)] p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark">Manage Designers</h2>
            <button onClick={() => setAddModalType('designers')} className="bg-brand-dark text-brand-light px-6 py-3 font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors cursor-none">
              + Add Designer
            </button>
          </div>
          <div className="border-2 border-brand-dark overflow-x-auto text-left">
            <table className="w-full font-bold border-collapse">
              <thead>
                <tr className="border-b-2 border-brand-dark bg-brand-muted text-brand-dark uppercase tracking-widest text-sm">
                  <th className="p-4 border-r-2 border-brand-dark">Name</th>
                  <th className="p-4 border-r-2 border-brand-dark">Focus</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {designers.map(d => (
                  <tr key={d.id} className="border-b-2 border-brand-dark/20 hover:bg-brand-muted/50 transition-colors">
                    <td className="p-4 border-r-2 border-brand-dark/20">{d.name}</td>
                    <td className="p-4 border-r-2 border-brand-dark/20">{d.focus}</td>
                    <td className="p-4 flex gap-4">
                      <button onClick={() => startEditMockItem('designers', d)} className="text-brand-dark hover:text-brand-accent uppercase tracking-widest text-xs font-bold border-b-2 border-brand-dark hover:border-brand-accent pb-1 transition-colors flex items-center gap-1"><Edit2 size={12}/> Edit</button>
                      <button onClick={() => deleteMockItem('designers', d.id)} className="text-red-500 hover:text-red-700 uppercase tracking-widest text-xs font-bold border-b-2 border-red-500 pb-1 flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                    </td>
                  </tr>
                ))}
                {designers.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-brand-dark/50">No designers.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sponsorships' && (
        <div className="bg-brand-light border-4 border-brand-dark shadow-[16px_16px_0_0_var(--brand-dark)] p-8">
          <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-8">Sponsorship Applications</h2>
          <div className="overflow-x-auto border-2 border-brand-dark">
             <table className="w-full text-left font-bold border-collapse">
                <thead>
                   <tr className="border-b-2 border-brand-dark bg-brand-muted text-brand-dark uppercase tracking-widest text-sm">
                      <th className="p-4 border-r-2 border-brand-dark">Date</th>
                      <th className="p-4 border-r-2 border-brand-dark">Brand</th>
                      <th className="p-4 border-r-2 border-brand-dark">Email</th>
                      <th className="p-4 border-r-2 border-brand-dark">Status</th>
                   </tr>
                </thead>
                <tbody>
                   {sponsorships.length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-brand-dark/50">No applications found.</td></tr>
                   ) : (
                      sponsorships.map(s => (
                        <tr key={s.id} className="border-b-2 border-brand-dark/20 hover:bg-brand-muted/50 transition-colors">
                           <td className="p-4 border-r-2 border-brand-dark/20 text-xs font-mono">{new Date(s.createdAt).toLocaleDateString()}</td>
                           <td className="p-4 border-r-2 border-brand-dark/20 text-brand-dark">{s.brandName}</td>
                           <td className="p-4 border-r-2 border-brand-dark/20 text-brand-accent">{s.email}</td>
                           <td className="p-4 border-r-2 border-brand-dark/20 uppercase tracking-widest text-xs">{s.status}</td>
                        </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'careers' && (
        <div className="bg-brand-light border-4 border-brand-dark shadow-[16px_16px_0_0_var(--brand-dark)] p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark">Job Applications</h2>
            <button onClick={() => setAddModalType('job')} className="bg-brand-dark text-brand-light px-6 py-3 font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors cursor-none">
              + Post Job
            </button>
          </div>
          <div className="overflow-x-auto border-2 border-brand-dark">
             <table className="w-full text-left font-bold border-collapse">
                <thead>
                   <tr className="border-b-2 border-brand-dark bg-brand-muted text-brand-dark uppercase tracking-widest text-sm">
                      <th className="p-4 border-r-2 border-brand-dark">Date</th>
                      <th className="p-4 border-r-2 border-brand-dark">Name</th>
                      <th className="p-4 border-r-2 border-brand-dark">Email</th>
                      <th className="p-4 border-r-2 border-brand-dark">Job ID</th>
                      <th className="p-4 border-r-2 border-brand-dark">Status</th>
                   </tr>
                </thead>
                <tbody>
                   {jobApplications.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-brand-dark/50">No applications found.</td></tr>
                   ) : (
                      jobApplications.map(j => (
                        <tr key={j.id} className="border-b-2 border-brand-dark/20 hover:bg-brand-muted/50 transition-colors">
                           <td className="p-4 border-r-2 border-brand-dark/20 text-xs font-mono">{new Date(j.createdAt).toLocaleDateString()}</td>
                           <td className="p-4 border-r-2 border-brand-dark/20 text-brand-dark">{j.name}</td>
                           <td className="p-4 border-r-2 border-brand-dark/20 text-brand-accent">{j.email}</td>
                           <td className="p-4 border-r-2 border-brand-dark/20 text-xs font-mono">{j.jobId}</td>
                           <td className="p-4 border-r-2 border-brand-dark/20 uppercase tracking-widest text-xs">{j.status}</td>
                        </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'education' as any && (
        <div className="bg-brand-light border-4 border-brand-dark shadow-[16px_16px_0_0_var(--brand-dark)] p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark">Manage Education</h2>
            <button onClick={() => setAddModalType('education')} className="bg-brand-dark text-brand-light px-6 py-3 font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors cursor-none">
              + Add Program
            </button>
          </div>
          <div className="border-2 border-brand-dark overflow-x-auto text-left">
            <table className="w-full font-bold border-collapse">
              <thead>
                <tr className="border-b-2 border-brand-dark bg-brand-muted text-brand-dark uppercase tracking-widest text-sm">
                  <th className="p-4 border-r-2 border-brand-dark">Institution / Course Name</th>
                  <th className="p-4 border-r-2 border-brand-dark">Location</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {education.map(e => (
                  <tr key={e.id} className="border-b-2 border-brand-dark/20 hover:bg-brand-muted/50 transition-colors">
                    <td className="p-4 border-r-2 border-brand-dark/20">{e.name}</td>
                    <td className="p-4 border-r-2 border-brand-dark/20">{e.location}</td>
                    <td className="p-4 flex gap-4">
                      <button onClick={() => startEditMockItem('education', e)} className="text-brand-dark hover:text-brand-accent uppercase tracking-widest text-xs font-bold border-b-2 border-brand-dark hover:border-brand-accent pb-1 transition-colors flex items-center gap-1"><Edit2 size={12}/> Edit</button>
                      <button onClick={() => deleteMockItem('education', e.id)} className="text-red-500 hover:text-red-700 uppercase tracking-widest text-xs font-bold border-b-2 border-red-500 pb-1 flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                    </td>
                  </tr>
                ))}
                {education.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-brand-dark/50">No education programs.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'agencies' as any && (
        <div className="bg-brand-light border-4 border-brand-dark shadow-[16px_16px_0_0_var(--brand-dark)] p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark">Manage Agencies</h2>
            <button onClick={() => setAddModalType('agencies')} className="bg-brand-dark text-brand-light px-6 py-3 font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors cursor-none">
              + Add Agency
            </button>
          </div>
          <div className="border-2 border-brand-dark overflow-x-auto text-left">
            <table className="w-full font-bold border-collapse">
              <thead>
                <tr className="border-b-2 border-brand-dark bg-brand-muted text-brand-dark uppercase tracking-widest text-sm">
                  <th className="p-4 border-r-2 border-brand-dark">Agency Name</th>
                  <th className="p-4 border-r-2 border-brand-dark">Location</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map(a => (
                  <tr key={a.id} className="border-b-2 border-brand-dark/20 hover:bg-brand-muted/50 transition-colors">
                    <td className="p-4 border-r-2 border-brand-dark/20">{a.name}</td>
                    <td className="p-4 border-r-2 border-brand-dark/20">{a.location}</td>
                    <td className="p-4 flex gap-4">
                      <button onClick={() => startEditMockItem('agencies', a)} className="text-brand-dark hover:text-brand-accent uppercase tracking-widest text-xs font-bold border-b-2 border-brand-dark hover:border-brand-accent pb-1 transition-colors flex items-center gap-1"><Edit2 size={12}/> Edit</button>
                      <button onClick={() => deleteMockItem('agencies', a.id)} className="text-red-500 hover:text-red-700 uppercase tracking-widest text-xs font-bold border-b-2 border-red-500 pb-1 flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                    </td>
                  </tr>
                ))}
                {agencies.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-brand-dark/50">No agencies.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addModalType && (
        <div className="fixed inset-0 bg-brand-dark/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <form onSubmit={handleAddSubmit} className="bg-brand-light border-4 border-brand-dark p-8 shadow-[12px_12px_0_0_var(--brand-dark)] w-full max-w-md">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold uppercase tracking-tight text-brand-dark">
                  Add {addModalType === 'job' ? 'Job' : addModalType === 'designers' ? 'Designer' : addModalType === 'education' ? 'Program' : 'Agency'}
                </h3>
                <button type="button" onClick={() => setAddModalType(null)} className="text-brand-dark hover:text-brand-accent transition-colors">
                   <X size={24} />
                </button>
             </div>
             
             <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                   <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">
                     {addModalType === 'job' ? 'Title' : addModalType === 'education' ? 'University Name' : 'Name'}
                   </label>
                   <input required type="text" className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                     value={addModalData.name} onChange={e => setAddModalData({...addModalData, name: e.target.value})} />
                </div>
                
                {addModalType === 'job' && (
                   <>
                     <div>
                       <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Description</label>
                       <textarea className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent h-24 resize-none"
                         value={addModalData.details} onChange={e => setAddModalData({...addModalData, details: e.target.value})} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Location</label>
                           <input type="text" className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                             value={addModalData.location} onChange={e => setAddModalData({...addModalData, location: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Type</label>
                           <select className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                             value={addModalData.type} onChange={e => setAddModalData({...addModalData, type: e.target.value})}>
                             <option value="Full-time">Full-time</option>
                             <option value="Part-time">Part-time</option>
                             <option value="Contract">Contract</option>
                             <option value="Internship">Internship</option>
                           </select>
                        </div>
                     </div>
                     <div>
                       <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Salary</label>
                       <input type="text" className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                         value={addModalData.salary} onChange={e => setAddModalData({...addModalData, salary: e.target.value})} />
                     </div>
                   </>
                )}

                {addModalType === 'designers' && (
                   <>
                     <div>
                       <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Focus Area</label>
                       <input required type="text" className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                         value={addModalData.details} onChange={e => setAddModalData({...addModalData, details: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Bio / About</label>
                       <textarea className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent h-24 resize-none"
                         value={addModalData.bio} onChange={e => setAddModalData({...addModalData, bio: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Social Links</label>
                       <input type="text" placeholder="https://..." className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                         value={addModalData.links} onChange={e => setAddModalData({...addModalData, links: e.target.value})} />
                     </div>
                   </>
                )}

                {addModalType === 'education' && (
                   <>
                     <div>
                       <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Location</label>
                       <input required type="text" className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                         value={addModalData.location} onChange={e => setAddModalData({...addModalData, location: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Program Name</label>
                       <input type="text" className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                         value={addModalData.program} onChange={e => setAddModalData({...addModalData, program: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Description</label>
                       <textarea className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent h-24 resize-none"
                         value={addModalData.details} onChange={e => setAddModalData({...addModalData, details: e.target.value})} />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Price</label>
                           <input type="text" className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                             value={addModalData.price} onChange={e => setAddModalData({...addModalData, price: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Website</label>
                           <input type="text" placeholder="https://..." className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                             value={addModalData.website} onChange={e => setAddModalData({...addModalData, website: e.target.value})} />
                        </div>
                     </div>
                     <div>
                       <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">Card Image URL</label>
                       <input type="text" placeholder="https://..." className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                         value={addModalData.imageUrl} onChange={e => setAddModalData({...addModalData, imageUrl: e.target.value})} />
                     </div>
                   </>
                )}

                {addModalType === 'agencies' && (
                  <div>
                     <label className="text-sm uppercase tracking-widest text-brand-dark font-bold block mb-2">
                       Location
                     </label>
                     <input required type="text" className="w-full bg-brand-light border-2 border-brand-dark p-3 font-bold focus:outline-none focus:border-brand-accent"
                       value={addModalData.details} onChange={e => setAddModalData({...addModalData, details: e.target.value})} />
                  </div>
                )}
             </div>
             
             <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-brand-dark text-brand-light font-bold uppercase tracking-widest py-4 hover:bg-brand-accent transition-colors">
                  {addModalEditingId ? 'Save' : 'Add'}
                </button>
                <button type="button" onClick={() => { setAddModalType(null); setAddModalEditingId(null); }} className="flex-1 border-2 border-brand-dark text-brand-dark font-bold uppercase tracking-widest py-4 hover:bg-brand-muted transition-colors">
                  Cancel
                </button>
             </div>
           </form>
        </div>
      )}

    </div>
  );
}

