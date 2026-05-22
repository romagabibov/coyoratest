import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { Event } from '../types';
import { Link } from 'react-router';

export default function Home() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Event[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as Event);
      });
      setEvents(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'events');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="animate-in fade-in duration-700 py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-16 border-b-4 border-brand-dark pb-8">
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-4 text-brand-dark">
          {t('upcoming_events')}
        </h1>
        <p className="text-brand-dark font-bold text-xl uppercase tracking-widest max-w-2xl">Discover the most exclusive fashion shows and events happening across Azerbaijan.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-12 h-12 border-4 border-brand-dark border-r-transparent animate-spin"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center p-20 border-4 border-brand-dark max-w-lg mx-auto bg-brand-muted">
          <p className="text-2xl font-bold uppercase tracking-widest">{t('no_events')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((ev, i) => (
            <Link key={ev.id} to={`/event/${ev.id}`} className="block group">
              <div 
                className="card-brutal h-full flex flex-col relative"
              >
                <div className="aspect-[4/5] md:aspect-square relative overflow-hidden bg-brand-muted border-b-2 border-brand-dark">
                  {ev.imageUrl ? (
                    <img 
                      src={ev.imageUrl} 
                      alt={ev.title} 
                      className="object-cover w-full h-full grayscale-[50%] group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100" 
                      crossOrigin="anonymous"
                    />
                  ) : (
                     <div className="w-full h-full flex flex-col justify-center items-center">
                       <span className="font-bold text-6xl tracking-tighter text-brand-dark/20">AZ</span>
                     </div>
                  )}
                  <div className="absolute top-4 right-4 bg-brand-light border-2 border-brand-dark px-4 py-2 font-bold uppercase tracking-widest text-xs shadow-[4px_4px_0_0_var(--brand-dark)]">
                    {new Date(ev.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-bold uppercase tracking-tight mb-4 text-brand-dark group-hover:text-brand-accent transition-colors leading-none">{ev.title}</h2>
                  </div>
                  <div className="flex justify-between items-end font-bold uppercase tracking-widest text-sm pt-6 mt-6 border-t-2 border-brand-dark">
                    <span className="text-xl">{t('price', { price: ev.price })}</span>
                    <span className="text-brand-accent">{t('tickets_available', { count: ev.availableTickets })} left</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
