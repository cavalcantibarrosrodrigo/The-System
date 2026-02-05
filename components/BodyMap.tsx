import React from 'react';
import { MuscleGroup } from '../types';

interface Props {
  onSelectionChange: (selected: MuscleGroup[]) => void;
  selected: MuscleGroup[];
  gender: 'male' | 'female';
}

const BodyMap: React.FC<Props> = React.memo(({ onSelectionChange, selected, gender }) => {
  const toggleMuscle = (muscle: MuscleGroup) => {
    if (selected.includes(muscle)) {
      onSelectionChange(selected.filter(m => m !== muscle));
    } else {
      onSelectionChange([...selected, muscle]);
    }
  };

  const isSelected = (m: MuscleGroup) => selected.includes(m);
  const getFill = (m: MuscleGroup) => isSelected(m) ? "rgba(255, 0, 60, 0.6)" : "rgba(0, 243, 255, 0.05)";
  const getStroke = (m: MuscleGroup) => isSelected(m) ? "#ff003c" : "#00f3ff";
  const getClass = (m: MuscleGroup) => `cursor-pointer transition-all duration-300 hover:opacity-80 ${isSelected(m) ? 'animate-pulse' : ''}`;

  return (
    <div className="glass-panel p-6 h-full flex flex-col items-center justify-center relative neon-border overflow-hidden">
      <div className="absolute top-4 left-4 text-cyan-400 uppercase tracking-widest text-xs font-bold z-10">
        Escaneamento Biológico // Seleção de Alvo
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#004444 1px, transparent 1px), linear-gradient(90deg, #004444 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Character SVG - Conditional Rendering based on Gender */}
      <div className="relative w-full max-w-[300px] h-[500px] my-4 z-10">
        <svg viewBox="0 0 300 600" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,243,255,0.2)]">
            <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {gender === 'male' ? (
                // MALE SILHOUETTE
                <>
                    {/* NECK */}
                    <path d="M135 70 L135 90 L110 100 M165 70 L165 90 L190 100" stroke="#004444" strokeWidth="2" fill="none" opacity="0.5"/>
                    {/* HEAD */}
                    <path d="M150 25 C135 25 125 35 125 55 C125 75 135 85 150 85 C165 85 175 75 175 55 C175 35 165 25 150 25 Z" fill="none" stroke="#00f3ff" strokeWidth="2" className="opacity-50"/>
                    {/* SHOULDERS */}
                    <g onClick={() => toggleMuscle('shoulders')} className={getClass('shoulders')}>
                        <path d="M110 100 Q90 100 80 120 L85 150 Q105 140 120 130 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="2"/>
                        <path d="M190 100 Q210 100 220 120 L215 150 Q195 140 180 130 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="2"/>
                    </g>
                    {/* CHEST */}
                    <g onClick={() => toggleMuscle('chest')} className={getClass('chest')}>
                        <path d="M120 130 Q150 140 180 130 L175 180 Q150 190 125 180 Z" fill={getFill('chest')} stroke={getStroke('chest')} strokeWidth="2"/>
                    </g>
                    {/* BACK */}
                    <g onClick={() => toggleMuscle('back')} className={getClass('back')}>
                        <path d="M120 130 L110 180 L125 220 L130 180 Z" fill={getFill('back')} stroke={getStroke('back')} strokeWidth="2"/>
                        <path d="M180 130 L190 180 L175 220 L170 180 Z" fill={getFill('back')} stroke={getStroke('back')} strokeWidth="2"/>
                    </g>
                    {/* ARMS */}
                    <g onClick={() => toggleMuscle('arms')} className={getClass('arms')}>
                        <path d="M85 150 Q75 180 85 200 L90 250 L105 240 L100 200 Q110 180 105 145 Z" fill={getFill('arms')} stroke={getStroke('arms')} strokeWidth="2"/>
                        <path d="M215 150 Q225 180 215 200 L210 250 L195 240 L200 200 Q190 180 195 145 Z" fill={getFill('arms')} stroke={getStroke('arms')} strokeWidth="2"/>
                    </g>
                    {/* CORE */}
                    <g onClick={() => toggleMuscle('core')} className={getClass('core')}>
                        <path d="M130 180 L170 180 L165 240 L150 250 L135 240 Z" fill={getFill('core')} stroke={getStroke('core')} strokeWidth="2"/>
                        <path d="M125 220 L135 240 L135 260 L125 250 Z" fill={getFill('core')} stroke={getStroke('core')} strokeWidth="2"/>
                        <path d="M175 220 L165 240 L165 260 L175 250 Z" fill={getFill('core')} stroke={getStroke('core')} strokeWidth="2"/>
                    </g>
                    {/* LEGS */}
                    <g onClick={() => toggleMuscle('legs')} className={getClass('legs')}>
                        <path d="M125 250 L175 250 L180 280 L120 280 Z" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="2"/>
                        <path d="M120 280 L145 280 L140 380 L125 380 L120 450 L140 450 L145 380 Z" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="2"/>
                        <path d="M180 280 L155 280 L160 380 L175 380 L180 450 L160 450 L155 380 Z" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="2"/>
                    </g>
                </>
            ) : (
                // FEMALE SILHOUETTE (Narrower shoulders, wider hips)
                <>
                    {/* NECK */}
                    <path d="M140 75 L140 90 L125 100 M160 75 L160 90 L175 100" stroke="#004444" strokeWidth="2" fill="none" opacity="0.5"/>
                    {/* HEAD */}
                    <path d="M150 30 C138 30 130 40 130 55 C130 70 138 80 150 80 C162 80 170 70 170 55 C170 40 162 30 150 30 Z" fill="none" stroke="#00f3ff" strokeWidth="2" className="opacity-50"/>
                    {/* SHOULDERS (Narrower) */}
                    <g onClick={() => toggleMuscle('shoulders')} className={getClass('shoulders')}>
                        <path d="M125 100 Q115 100 110 115 L112 140 Q125 130 135 125 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="2"/>
                        <path d="M175 100 Q185 100 190 115 L188 140 Q175 130 165 125 Z" fill={getFill('shoulders')} stroke={getStroke('shoulders')} strokeWidth="2"/>
                    </g>
                    {/* CHEST */}
                    <g onClick={() => toggleMuscle('chest')} className={getClass('chest')}>
                        <path d="M130 125 Q150 145 170 125 L165 160 Q150 170 135 160 Z" fill={getFill('chest')} stroke={getStroke('chest')} strokeWidth="2"/>
                    </g>
                    {/* BACK */}
                    <g onClick={() => toggleMuscle('back')} className={getClass('back')}>
                         <path d="M130 125 L125 160 L135 190 L140 160 Z" fill={getFill('back')} stroke={getStroke('back')} strokeWidth="2"/>
                         <path d="M170 125 L175 160 L165 190 L160 160 Z" fill={getFill('back')} stroke={getStroke('back')} strokeWidth="2"/>
                    </g>
                    {/* ARMS */}
                    <g onClick={() => toggleMuscle('arms')} className={getClass('arms')}>
                        <path d="M112 140 Q105 170 110 190 L112 240 L125 230 L122 190 Q128 170 125 135 Z" fill={getFill('arms')} stroke={getStroke('arms')} strokeWidth="2"/>
                        <path d="M188 140 Q195 170 190 190 L188 240 L175 230 L178 190 Q172 170 175 135 Z" fill={getFill('arms')} stroke={getStroke('arms')} strokeWidth="2"/>
                    </g>
                    {/* CORE (Hourglass) */}
                    <g onClick={() => toggleMuscle('core')} className={getClass('core')}>
                        <path d="M135 160 L165 160 L160 200 L150 210 L140 200 Z" fill={getFill('core')} stroke={getStroke('core')} strokeWidth="2"/>
                        <path d="M135 190 L140 200 L135 220 L125 210 Z" fill={getFill('core')} stroke={getStroke('core')} strokeWidth="2"/>
                         <path d="M165 190 L160 200 L165 220 L175 210 Z" fill={getFill('core')} stroke={getStroke('core')} strokeWidth="2"/>
                    </g>
                    {/* LEGS (Wider Hips) */}
                    <g onClick={() => toggleMuscle('legs')} className={getClass('legs')}>
                        <path d="M125 210 L175 210 L185 240 L115 240 Z" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="2"/>
                        <path d="M115 240 L145 240 L140 360 L125 360 L120 440 L135 440 L145 360 Z" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="2"/>
                        <path d="M185 240 L155 240 L160 360 L175 360 L180 440 L165 440 L155 360 Z" fill={getFill('legs')} stroke={getStroke('legs')} strokeWidth="2"/>
                    </g>
                </>
            )}

        </svg>

        {/* Scan Line Animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 opacity-50 shadow-[0_0_20px_#00f3ff] animate-[scan_2.5s_linear_infinite]"></div>
      </div>
        <style>{`
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}</style>

      <div className="grid grid-cols-2 gap-2 w-full mt-2 relative z-10">
          <div className="text-center bg-black/50 p-2 border border-gray-800">
            <span className="text-gray-500 text-[10px] block uppercase">Regiões</span>
            <span className="text-red-500 font-bold text-lg">{selected.length}</span>
          </div>
          <div className="text-center bg-black/50 p-2 border border-gray-800">
             <span className="text-gray-500 text-[10px] block uppercase">Status</span>
             <span className="text-cyan-500 font-bold text-lg animate-pulse">{selected.length > 0 ? 'PRONTO' : 'AGUARDANDO'}</span>
          </div>
      </div>
    </div>
  );
});

export default BodyMap;