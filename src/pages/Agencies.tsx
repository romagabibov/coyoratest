import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, ArrowUpRight, X, Star } from 'lucide-react';

const AGENCIES: any[] = [];

export default function Agencies() {
  const [selectedAgency, setSelectedAgency] = useState<typeof AGENCIES[0] | null>(null);

  const localAgencies = JSON.parse(localStorage.getItem('MOCK_AGENCIES') || '[]');
  const combinedAgencies = [
    ...localAgencies.map((a: any) => ({
      id: a.id,
      name: a.name,
      location: a.location,
      description: 'Agency added via Admin Panel.',
      focus: ['Scouting', 'Placement'],
      image: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80'
    })),
    ...AGENCIES
  ];

  return (
    <div className="animate-in fade-in duration-700 bg-brand-light min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        
        <div className="mb-16 border-b-4 border-brand-dark pb-8">
           <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tighter text-brand-dark mb-6 leading-none">
             Model<br/>Agencies
           </h1>
           <p className="text-brand-dark font-bold text-xl md:text-2xl uppercase tracking-widest max-w-3xl">
             Discover top modeling & casting agencies representing the faces of Azerbaijani fashion.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {combinedAgencies.map((agency, index) => (
            <motion.div 
              key={agency.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="card-brutal border-4 border-brand-dark bg-brand-light flex flex-col group overflow-hidden shadow-[12px_12px_0_0_var(--brand-accent)] hover:shadow-none transition-all hover:translate-y-1 hover:translate-x-1"
            >
              <div className="relative h-72 border-b-4 border-brand-dark overflow-hidden">
                <img 
                  src={agency.image} 
                  alt={agency.name} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" 
                  crossOrigin="anonymous" 
                />
                <div className="absolute top-4 left-4 bg-brand-light text-brand-dark p-2 border-2 border-brand-dark flex items-center justify-center font-bold">
                  <Star size={20} className="mr-2" />
                  AGENCY
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-brand-dark/50 font-bold uppercase tracking-widest mb-4 text-xs">
                  <MapPin size={16} />
                  {agency.location}
                </div>
                
                <h2 className="text-2xl font-bold uppercase tracking-tight text-brand-dark mb-4 group-hover:text-brand-accent transition-colors">
                  {agency.name}
                </h2>
                
                <p className="text-brand-dark/80 font-bold mb-8 flex-grow line-clamp-3">
                  {agency.description}
                </p>
                
                <div className="border-t-2 border-brand-dark pt-6 mt-auto">
                  <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
                    {agency.focus.map(f => (
                      <span key={f} className="border-2 border-brand-dark px-2 py-1 bg-brand-muted text-brand-dark">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <button onClick={() => setSelectedAgency(agency)} className="mt-8 w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent transition-all flex items-center justify-between group/btn cursor-none">
                  View Specs
                  <ArrowUpRight size={20} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedAgency && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm" onClick={() => setSelectedAgency(null)}></div>
           <div className="relative z-10 bg-brand-light border-4 border-brand-dark p-8 md:p-12 max-w-2xl w-full card-brutal shadow-[16px_16px_0_0_var(--brand-accent)] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-3xl font-bold uppercase tracking-tight text-brand-dark pr-8">{selectedAgency.name}</h3>
                 <button onClick={() => setSelectedAgency(null)} className="text-brand-dark hover:text-brand-accent">
                    <X size={32} />
                 </button>
              </div>
              <img src={selectedAgency.image} alt={selectedAgency.name} className="w-full h-64 object-cover border-2 border-brand-dark mb-6" crossOrigin="anonymous" />
              <div className="flex items-center gap-2 text-brand-dark font-bold uppercase tracking-widest mb-4 text-sm">
                <MapPin size={20} />
                {selectedAgency.location}
              </div>
              <div className="text-brand-dark font-bold text-lg mb-8 leading-relaxed">
                 {selectedAgency.description}
              </div>
              <h4 className="font-bold uppercase tracking-widest text-brand-dark mb-4 border-b-2 border-brand-dark pb-2">Agency Focus</h4>
              <ul className="mb-8 space-y-2">
                 {selectedAgency.focus.map((f, i) => (
                    <li key={i} className="flex gap-2 items-center font-bold text-brand-dark">
                       <span className="text-brand-accent">&bull;</span> {f}
                    </li>
                 ))}
              </ul>
              <button onClick={() => setSelectedAgency(null)} className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent transition-all cursor-none">
                 Close
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
