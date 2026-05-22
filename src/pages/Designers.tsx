import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Instagram, Globe, X } from 'lucide-react';

interface Designer {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  socials: {
    instagram?: string;
    website?: string;
  };
}

const DESIGNERS: Designer[] = [];

export default function Designers() {
  const { t } = useTranslation();
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);

  const localDesigners = JSON.parse(localStorage.getItem('MOCK_DESIGNERS') || '[]');
  const combinedDesigners = [
    ...localDesigners.map((d: any) => ({
      id: String(d.id),
      name: d.name,
      category: d.focus || 'Designer',
      image: 'https://images.unsplash.com/photo-1550614000-4b95d466989b?auto=format&fit=crop&q=80',
      description: d.bio || 'Designer added via the Admin Dashboard.',
      socials: { website: d.links }
    })),
    ...DESIGNERS
  ];

  // Group designers by first letter
  const groupedDesigners = combinedDesigners.reduce((acc, designer) => {
    const letter = designer.name.charAt(0).toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(designer);
    return acc;
  }, {} as Record<string, Designer[]>);

  const sortedLetters = Object.keys(groupedDesigners).sort();

  return (
    <div className="animate-in fade-in duration-700 py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-16 border-b-4 border-brand-dark pb-8">
        <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-4 text-brand-dark">
          A-Z {t('designers') || 'Designers'}
        </h1>
        <p className="text-brand-dark font-bold text-xl uppercase tracking-widest max-w-3xl">
          Discover the visionaries shaping the future of Azerbaijani fashion. The ultimate directory of local brands and haute couture masters.
        </p>
      </div>

      <div className="space-y-24">
        {sortedLetters.map(letter => (
          <div key={letter} className="relative">
            <div className="flex items-baseline gap-6 mb-12">
              <h2 className="text-[8rem] md:text-[12rem] font-bold text-brand-dark select-none leading-none -ml-4 uppercase tracking-tighter">{letter}.</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {groupedDesigners[letter].map(designer => (
                <button 
                  key={designer.id}
                  onClick={() => setSelectedDesigner(designer)}
                  className="card-brutal p-6 text-left group flex flex-col h-full"
                >
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-brand-dark group-hover:text-brand-accent transition-colors mb-4">{designer.name}</h3>
                  <p className="text-sm uppercase tracking-widest font-bold text-brand-dark/60 mt-auto pt-4 border-t-2 border-brand-dark/10 group-hover:border-brand-dark transition-colors">{designer.category}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Designer Modal */}
      {selectedDesigner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-brand-muted/90 backdrop-blur-sm" onClick={() => setSelectedDesigner(null)}></div>
          
          <div className="relative bg-brand-light w-full max-w-5xl max-h-[90vh] overflow-y-auto border-4 border-brand-dark shadow-[16px_16px_0_0_var(--brand-dark)] flex flex-col md:flex-row">
            <button 
              onClick={() => setSelectedDesigner(null)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-brand-light border-2 border-brand-dark text-brand-dark flex items-center justify-center hover:bg-brand-accent hover:text-brand-light transition-colors shadow-[4px_4px_0_0_var(--brand-dark)]"
            >
              <X size={24} strokeWidth={3} />
            </button>
            
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto md:min-h-[60vh] bg-brand-muted relative border-b-4 md:border-b-0 md:border-r-4 border-brand-dark p-2">
              <img 
                src={selectedDesigner.image} 
                alt={selectedDesigner.name} 
                className="w-full h-full object-cover grayscale-[20%]" 
                crossOrigin="anonymous" 
              />
            </div>
            
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col bg-brand-light">
              <span className="text-sm font-bold tracking-[0.2em] uppercase text-brand-accent mb-6 block border-b-2 border-brand-dark pb-4">
                {selectedDesigner.category}
              </span>
              <h2 className="text-5xl lg:text-6xl font-bold uppercase tracking-tighter text-brand-dark mb-8 leading-[0.9]">
                {selectedDesigner.name}
              </h2>
              
              <p className="text-brand-dark leading-relaxed font-bold mb-12 text-lg">
                {selectedDesigner.description}
              </p>
              
              <div className="mt-auto pt-8 border-t-2 border-brand-dark">
                <h4 className="text-sm font-bold uppercase tracking-widest text-brand-dark mb-6">Connect</h4>
                <div className="flex gap-4">
                  {selectedDesigner.socials.instagram && (
                    <a 
                      href={selectedDesigner.socials.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-14 h-14 bg-brand-light border-2 border-brand-dark flex items-center justify-center text-brand-dark hover:bg-brand-accent hover:text-brand-light hover:border-brand-accent shadow-[4px_4px_0_0_var(--brand-dark)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                      <Instagram size={24} strokeWidth={2.5} />
                    </a>
                  )}
                  {selectedDesigner.socials.website && (
                    <a 
                      href={selectedDesigner.socials.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-14 h-14 bg-brand-light border-2 border-brand-dark flex items-center justify-center text-brand-dark hover:bg-brand-accent hover:text-brand-light hover:border-brand-accent shadow-[4px_4px_0_0_var(--brand-dark)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                      <Globe size={24} strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
