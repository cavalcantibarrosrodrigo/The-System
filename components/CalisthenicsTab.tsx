import React, { useState } from 'react';
import { CalisthenicsCategory, CalisthenicsSkill } from '../types';
import { CALISTHENICS_PROGRESSION } from '../constants';
import { getSkillDetails, visualizeGoal } from '../services/geminiService';
import { ChevronRight, Star, Loader2, BrainCircuit, Play, X, Zap, Lock, Trophy } from 'lucide-react';

interface Props {
  unlockedSkills: string[];
  onSkillMastery: (skillId: string, nextSkillId: string | undefined) => void;
}

const CalisthenicsTab: React.FC<Props> = ({ unlockedSkills, onSkillMastery }) => {
  const [activeCategory, setActiveCategory] = useState<CalisthenicsCategory>('push');
  const [selectedSkill, setSelectedSkill] = useState<CalisthenicsSkill | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Detail State
  const [skillDetails, setSkillDetails] = useState<{description: string, execution: string[], technicalTips: string} | null>(null);
  const [skillImage, setSkillImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const categories: {id: CalisthenicsCategory, label: string}[] = [
      { id: 'push', label: 'Empurrar (Push)' },
      { id: 'pull', label: 'Puxar (Pull)' },
      { id: 'legs', label: 'Pernas (Legs)' },
      { id: 'core', label: 'Core / Abs' },
  ];

  const getSkillsByCategory = (cat: CalisthenicsCategory) => {
      return CALISTHENICS_PROGRESSION.filter(s => s.category === cat).sort((a,b) => a.level - b.level);
  };

  const isUnlocked = (skillId: string) => unlockedSkills.includes(skillId);

  const handleSkillClick = async (skill: CalisthenicsSkill) => {
      if (!isUnlocked(skill.id)) return;

      setSelectedSkill(skill);
      setSkillDetails(null);
      setSkillImage(null);
      setIsLoadingDetails(true);
      setLoadingImage(true);

      // Parallel fetch for speed
      getSkillDetails(skill.name).then(details => {
          setSkillDetails(details);
          setIsLoadingDetails(false);
      });

      visualizeGoal(skill.name).then(img => {
          setSkillImage(img);
          setLoadingImage(false);
      });
  };

  const handleMastery = () => {
    if(!selectedSkill) return;
    
    // Find next skill in the same category
    const skillsInCat = getSkillsByCategory(selectedSkill.category);
    const currentIndex = skillsInCat.findIndex(s => s.id === selectedSkill.id);
    const nextSkill = skillsInCat[currentIndex + 1];
    
    onSkillMastery(selectedSkill.id, nextSkill?.id);
    closeModal();
  };

  const closeModal = () => {
      setSelectedSkill(null);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 animate-in fade-in duration-300">
        {/* Sidebar Category Selector */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible flex-shrink-0">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`p-4 border text-left font-bold uppercase tracking-wider transition-all flex items-center justify-between whitespace-nowrap ${
                        activeCategory === cat.id 
                        ? 'bg-cyan-900/40 border-cyan-500 text-white shadow-[0_0_15px_rgba(0,243,255,0.2)]' 
                        : 'bg-black/40 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                    }`}
                >
                    {cat.label}
                    {activeCategory === cat.id && <ChevronRight className="text-cyan-400" size={16} />}
                </button>
            ))}
        </div>

        {/* Skill Tree Area */}
        <div className="flex-1 glass-panel p-6 relative overflow-y-auto custom-scrollbar flex flex-col items-center">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-500 pointer-events-none">
                 <BrainCircuit size={120} />
             </div>
             
             <h2 className="text-2xl font-bold text-cyan-400 mb-8 uppercase tracking-[0.2em] border-b border-cyan-900 pb-2 w-full text-center">
                 Árvore de Habilidades: {categories.find(c => c.id === activeCategory)?.label}
             </h2>

             <div className="relative flex flex-col items-center w-full max-w-2xl gap-8 pb-20">
                 {/* Connection Line */}
                 <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-800 transform -translate-x-1/2 z-0"></div>

                 {getSkillsByCategory(activeCategory).map((skill, index) => {
                     const unlocked = isUnlocked(skill.id);
                     return (
                         <div 
                            key={skill.id} 
                            className={`relative z-10 w-full flex items-center group ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed grayscale opacity-70'}`}
                            onClick={() => handleSkillClick(skill)}
                         >
                             {/* Level Badge */}
                             <div className={`absolute left-1/2 transform -translate-x-1/2 -top-3 z-20 bg-black border ${
                                 !unlocked ? 'border-gray-600 text-gray-500' :
                                 skill.level >= 4 ? 'border-red-500 text-red-500' : 'border-cyan-500 text-cyan-500'
                             } px-2 py-0.5 text-[10px] font-bold uppercase rounded-full`}>
                                 {unlocked ? `LVL ${skill.level}` : <Lock size={12}/>}
                             </div>

                             <div className={`w-full p-5 border-2 bg-black/80 backdrop-blur-sm transition-all duration-300 relative overflow-hidden ${
                                  !unlocked ? 'border-gray-800' :
                                  skill.level >= 4 
                                  ? 'border-gray-700 hover:border-red-500 hover:shadow-[0_0_20px_rgba(255,0,60,0.3)]' 
                                  : 'border-gray-700 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                             }`}>
                                 <div className="flex justify-between items-center">
                                     <h3 className={`text-xl font-bold uppercase tracking-wider ${
                                         !unlocked ? 'text-gray-600' :
                                         skill.level === 5 ? 'text-red-500' : 'text-white'
                                     }`}>
                                         {skill.name}
                                     </h3>
                                     <div className="flex gap-1">
                                         {Array.from({length: skill.level}).map((_, i) => (
                                             <Star key={i} size={12} fill="currentColor" className={unlocked ? (skill.level >= 4 ? "text-red-600" : "text-cyan-600") : "text-gray-800"} />
                                         ))}
                                     </div>
                                 </div>
                                 {unlocked && (
                                     <div className="text-xs text-gray-500 mt-2 font-mono flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                                         <Zap size={12} /> CLIQUE PARA ANÁLISE DO SISTEMA
                                     </div>
                                 )}
                                  {!unlocked && (
                                     <div className="text-xs text-red-900 mt-2 font-mono flex items-center gap-2">
                                         <Lock size={12} /> REQUISITO: NÍVEL {skill.level - 1}
                                     </div>
                                 )}
                             </div>
                         </div>
                     );
                 })}
             </div>
        </div>

        {/* Detail Modal */}
        {selectedSkill && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-4xl bg-black border border-cyan-500 shadow-[0_0_50px_rgba(0,243,255,0.2)] flex flex-col md:flex-row max-h-[90vh] overflow-hidden relative">
                    <button 
                        onClick={closeModal}
                        className="absolute top-2 right-2 p-2 text-gray-500 hover:text-white z-50 bg-black/50 rounded-full"
                    >
                        <X size={24} />
                    </button>

                    {/* Left: Visuals */}
                    <div className="w-full md:w-1/2 bg-gray-900/50 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col">
                        <div className="relative flex-1 min-h-[300px] flex items-center justify-center bg-black overflow-hidden group">
                             {/* Hologram Effects */}
                             <div className="absolute inset-0 z-10 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.05)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                             
                             {loadingImage ? (
                                 <div className="flex flex-col items-center gap-3 text-cyan-500 animate-pulse">
                                     <Loader2 size={40} className="animate-spin" />
                                     <span className="text-xs font-bold tracking-widest">GERANDO SIMULAÇÃO...</span>
                                 </div>
                             ) : skillImage ? (
                                 <>
                                     <div className="absolute inset-0 z-10 animate-[scan_3s_linear_infinite] bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent h-[20%] w-full pointer-events-none"></div>
                                     <img src={skillImage} alt={selectedSkill.name} className="w-full h-full object-cover opacity-80" />
                                     <div className="absolute bottom-4 right-4 text-cyan-400 animate-pulse">
                                         <Play size={24} fill="currentColor" />
                                     </div>
                                 </>
                             ) : (
                                 <div className="text-gray-600 text-xs">ERRO DE PROJEÇÃO</div>
                             )}
                        </div>
                        <div className="p-4 bg-black border-t border-gray-800">
                            <h2 className="text-2xl font-black text-white uppercase italic">{selectedSkill.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                    selectedSkill.level >= 4 ? 'bg-red-900 text-red-200' : 'bg-cyan-900 text-cyan-200'
                                }`}>
                                    NÍVEL {selectedSkill.level}
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">{selectedSkill.category}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Technical Data */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto custom-scrollbar bg-black/80 flex flex-col">
                        {isLoadingDetails ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
                                <Loader2 size={32} className="animate-spin" />
                                <span className="text-xs font-mono">ACESSANDO BANCO DE DADOS...</span>
                            </div>
                        ) : skillDetails ? (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300 flex-1">
                                <div>
                                    <h4 className="text-cyan-500 font-bold uppercase tracking-widest text-xs mb-2 border-b border-cyan-900 pb-1">
                                        Análise
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed font-mono text-justify">
                                        {skillDetails.description}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-cyan-500 font-bold uppercase tracking-widest text-xs mb-3 border-b border-cyan-900 pb-1">
                                        Protocolo de Execução
                                    </h4>
                                    <ul className="space-y-3">
                                        {skillDetails.execution.map((step, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-gray-400">
                                                <span className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-[10px] font-bold text-cyan-600">
                                                    {i + 1}
                                                </span>
                                                <span className="pt-0.5">{step}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-4 border border-dashed border-red-900/50 bg-red-900/10 rounded relative">
                                    <div className="absolute top-2 right-2 text-red-500 opacity-20"><BrainCircuit size={24}/></div>
                                    <h4 className="text-red-500 font-bold uppercase tracking-widest text-[10px] mb-2">
                                        Dica do Sistema
                                    </h4>
                                    <p className="text-gray-300 text-xs italic">
                                        "{skillDetails.technicalTips}"
                                    </p>
                                </div>
                            </div>
                        ) : (
                             <div className="text-red-500 text-xs">DADOS CORROMPIDOS. TENTE NOVAMENTE.</div>
                        )}

                        {/* Mastery Button */}
                        <div className="mt-6 pt-4 border-t border-gray-800">
                             <button
                                onClick={handleMastery}
                                className="w-full py-3 bg-yellow-600/20 border border-yellow-600 hover:bg-yellow-600 hover:text-black text-yellow-500 font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                             >
                                 <Trophy size={18} className="group-hover:scale-125 transition-transform" />
                                 Dominar Habilidade
                             </button>
                             <p className="text-[10px] text-gray-500 text-center mt-2 uppercase">
                                 Completar o domínio desbloqueia o próximo nível
                             </p>
                        </div>
                    </div>
                </div>
                <style>{`
                  @keyframes scan {
                    0% { top: -20%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 120%; opacity: 0; }
                  }
                `}</style>
            </div>
        )}
    </div>
  );
};

export default CalisthenicsTab;