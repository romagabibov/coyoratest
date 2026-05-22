import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Event } from '../types';

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const d = await getDoc(doc(db, 'events', id));
        if (d.exists()) {
          setEvent({ id: d.id, ...d.data() } as Event);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `events/${id}`);
      }
    };
    fetchEvent();
  }, [id]);

  const handleBuy = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!event || event.availableTickets <= 0) return;

    setLoading(true);
    try {
      // 1. Setup ticket
      const ticketId = crypto.randomUUID(); // In modern browsers
      const ticketRef = doc(db, 'tickets', ticketId);
      
      const purchaseTime = Date.now();
      await setDoc(ticketRef, {
        eventId: event.id,
        userId: currentUser.uid,
        purchaseDate: purchaseTime,
        status: 'active',
        qrCodeData: JSON.stringify({ ticketId, eventId: event.id })
      });
      
      // 2. Decrement available ticket amount
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        availableTickets: event.availableTickets - 1
      });

      alert(t('purchase_success'));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error purchasing ticket');
      handleFirestoreError(err, OperationType.CREATE, 'tickets');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return (
    <div className="flex justify-center p-20">
      <div className="w-12 h-12 border-4 border-brand-dark border-r-transparent animate-spin"></div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start animate-in fade-in duration-700 py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="aspect-[3/4] relative border-4 border-brand-dark bg-brand-muted p-2 shadow-[16px_16px_0_0_var(--brand-dark)]">
        <div className="w-full h-full border-2 border-brand-dark overflow-hidden bg-brand-muted">
          {event.imageUrl ? (
             <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover grayscale-[30%]" crossOrigin="anonymous" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-8xl font-bold uppercase tracking-tighter text-brand-dark/20">AZ</div>
          )}
        </div>
      </div>
      <div className="flex flex-col bg-brand-light border-4 border-brand-dark p-8 md:p-12 shadow-[16px_16px_0_0_var(--brand-dark)]">
         <h1 className="text-5xl lg:text-7xl font-bold uppercase tracking-tighter text-brand-dark mb-8 leading-[0.9] border-b-4 border-brand-dark pb-6">
            <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-base font-bold uppercase tracking-widest text-brand-dark/50 hover:text-brand-accent mb-4 transition-colors cursor-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              {t('back_to_events', 'Back to Events')}
            </button>
            {event.title}
         </h1>
         
         <div className="border-b-4 border-brand-dark pb-8 mb-8 flex flex-col gap-6 text-sm font-bold text-brand-dark">
            <div className="flex justify-between items-end border-b-2 border-brand-dark/20 pb-2">
              <span className="uppercase tracking-widest text-brand-dark/50 mr-4">Date</span>
              <span className="text-brand-dark text-right">{t('date', { date: new Date(event.date).toLocaleDateString() }).replace('Date: ', '')}</span>
            </div>
            <div className="flex justify-between items-end border-b-2 border-brand-dark/20 pb-2">
              <span className="uppercase tracking-widest text-brand-dark/50 mr-4">Location</span>
              <span className="text-brand-dark text-right text-base leading-tight break-words max-w-[60%]">{t('location', { location: event.location }).replace('Location: ', '')}</span>
            </div>
            <div className="flex justify-between items-end border-b-2 border-brand-dark/20 pb-2">
              <span className="uppercase tracking-widest text-brand-dark/50 mr-4">Price</span>
              <span className="text-brand-dark text-2xl uppercase tracking-tighter">{t('price', { price: event.price }).replace('Price: ', '')}</span>
            </div>
            <div className="flex justify-between items-end border-b-2 border-brand-dark/20 pb-2">
              <span className="uppercase tracking-widest text-brand-dark/50 mr-4">Availability</span>
              <span className="text-brand-dark">{t('tickets_available', { count: event.availableTickets })} left</span>
            </div>
         </div>
         
         <div className="text-brand-dark font-bold text-lg leading-relaxed mb-12 whitespace-pre-wrap">
           {event.description}
         </div>
         
         {error && <div className="mt-4 mb-4 p-4 bg-red-100 text-red-900 text-sm font-bold uppercase tracking-widest border-2 border-red-900 text-center">{error}</div>}
         
         <button 
           onClick={handleBuy} 
           disabled={loading || event.availableTickets <= 0}
           className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-5 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[8px_8px_0_0_var(--brand-accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-auto text-center"
         >
           {loading ? 'Processing...' : event.availableTickets > 0 ? t('buy_ticket') : 'Sold Out'}
         </button>
      </div>
    </div>
  );
}
