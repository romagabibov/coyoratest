import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Globe, MapPin, ArrowUpRight, X } from 'lucide-react';

const EDUCATION_PROGRAMS: any[] = [];

export default function Education() {
  const [selectedUni, setSelectedUni] = useState<typeof EDUCATION_PROGRAMS[0] | null>(null);

  const localEducation = JSON.parse(localStorage.getItem('MOCK_EDUCATION') || '[]');
  const combinedEducation = [
    ...localEducation.map((e: any) => ({
      id: e.id,
      name: e.name,
      location: e.location,
      description: e.details || 'Program added via Admin panel.',
      programs: e.program ? [e.program] : ['Fashion Design & Creation'],
      price: e.price || '',
      website: e.website || '',
      image: e.imageUrl || 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&q=80'
    })),
    ...EDUCATION_PROGRAMS
  ];

  return (
    <div className="animate-in fade-in duration-700 bg-brand-light min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        
        <div className="mb-16 border-b-4 border-brand-dark pb-8">
           <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tighter text-brand-dark mb-6 leading-none">
             Study<br/>Fashion
           </h1>
           <p className="text-brand-dark font-bold text-xl md:text-2xl uppercase tracking-widest max-w-3xl">
             Discover top institutions to master fashion design, textile art, and fashion business.
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {combinedEducation.map((uni, index) => (
            <motion.div 
              key={uni.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="card-brutal border-4 border-brand-dark bg-brand-light flex flex-col group overflow-hidden shadow-[12px_12px_0_0_var(--brand-dark)] hover:shadow-[4px_4px_0_0_var(--brand-accent)] transition-all hover:-translate-y-1 hover:-translate-x-1"
            >
              <div className="relative h-64 border-b-4 border-brand-dark overflow-hidden">
                <img 
                  src={uni.image} 
                  alt={uni.name} 
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" 
                  crossOrigin="anonymous" 
                />
                <div className="absolute top-4 right-4 bg-brand-accent text-brand-light p-2 border-2 border-brand-dark flex items-center justify-center">
                  <Building2 size={24} />
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-brand-dark/50 font-bold uppercase tracking-widest mb-4 text-xs">
                  <MapPin size={16} />
                  {uni.location}
                </div>
                
                <h2 className="text-3xl font-bold uppercase tracking-tight text-brand-dark mb-4 group-hover:text-brand-accent transition-colors">
                  {uni.name}
                </h2>
                
                <p className="text-brand-dark/80 font-bold mb-8 flex-grow">
                  {uni.description}
                </p>
                
                <div className="border-t-2 border-brand-dark pt-6 mt-auto">
                  <h3 className="font-bold uppercase tracking-widest text-brand-dark mb-4 text-sm flex items-center gap-2">
                    <Globe size={16} /> 
                    Programs Available
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
                    {uni.programs.map(prog => (
                      <span key={prog} className="border-2 border-brand-dark px-3 py-1 bg-brand-muted text-brand-dark">
                        {prog}
                      </span>
                    ))}
                  </div>
                </div>

                <button onClick={() => setSelectedUni(uni)} className="mt-8 w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent transition-all flex items-center justify-between group/btn cursor-none">
                  Learn More
                  <ArrowUpRight size={20} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedUni && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-brand-dark/80" onClick={() => setSelectedUni(null)}></div>
           <div className="relative z-10 bg-brand-light border-4 border-brand-dark p-8 md:p-12 max-w-2xl w-full card-brutal shadow-[16px_16px_0_0_var(--brand-accent)] max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-3xl font-bold uppercase tracking-tight text-brand-dark pr-8">{selectedUni.name}</h3>
                 <button onClick={() => setSelectedUni(null)} className="text-brand-dark hover:text-brand-accent">
                    <X size={32} />
                 </button>
              </div>
              <img src={selectedUni.image} alt={selectedUni.name} className="w-full h-64 object-cover border-2 border-brand-dark mb-6 grayscale" crossOrigin="anonymous" />
              <div className="flex items-center gap-2 text-brand-dark font-bold uppercase tracking-widest mb-4 text-sm">
                <MapPin size={20} />
                {selectedUni.location}
              </div>
              <div className="text-brand-dark font-bold text-lg mb-8 leading-relaxed">
                 {selectedUni.description}
              </div>
              <h4 className="font-bold uppercase tracking-widest text-brand-dark mb-4 border-b-2 border-brand-dark pb-2">Full Course List</h4>
              <ul className="mb-8 space-y-2">
                 {selectedUni.programs.map((p, i) => (
                    <li key={i} className="flex gap-2 items-center font-bold text-brand-dark">
                       <span className="text-brand-accent">&bull;</span> {p}
                    </li>
                 ))}
              </ul>
              {selectedUni.price && (
                 <div className="mb-4 text-brand-dark font-bold">
                    <span className="uppercase tracking-widest text-brand-dark/50 mr-2 text-sm">Price:</span>
                    {selectedUni.price}
                 </div>
              )}
              {selectedUni.website && (
                 <div className="mb-8 text-brand-dark font-bold">
                    <span className="uppercase tracking-widest text-brand-dark/50 mr-2 text-sm">Website:</span>
                    <a href={selectedUni.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors underline">
                       {selectedUni.website}
                    </a>
                 </div>
              )}
              <button onClick={() => setSelectedUni(null)} className="w-full bg-brand-dark text-brand-light border-2 border-brand-dark px-4 py-4 font-bold uppercase tracking-widest hover:bg-brand-accent hover:border-brand-accent transition-all cursor-none">
                 Close
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
