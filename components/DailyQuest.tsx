import React, { useState, useEffect } from 'react';
import { WorkoutPlan, Exercise } from '../types';
import { visualizeGoal, getExerciseAlternatives } from '../services/geminiService';
import { CheckCircle, AlertTriangle, Clock, Trophy, Eye, Loader2, BrainCircuit, Play, Pause, Timer, SkipForward, RefreshCw, ChevronRight, Activity } from 'lucide-react';

interface Props {
  plan: WorkoutPlan;
  onAccept: () => void;
  onCancel: () => void;
  onUpdatePlan: (newPlan: WorkoutPlan) => void;
}

const DailyQuest: React.FC<Props> = ({ plan, onAccept, onCancel, onUpdatePlan }) => {
  // Local state to track generated images for exercises
  const [exerciseImages, setExerciseImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  
  // Timers state
  const [activeTimer, setActiveTimer] = useState<string | null>(null); // Index or ID of exercise
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Swap State
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const [alternatives, setAlternatives] = useState<Exercise[]>([]);
  const [isLoadingSwap, setIsLoadingSwap] = useState(false);

  const handleVisualize = async (exerciseName: string, id: string) => {
    if (loadingImages[id] || exerciseImages[id]) return;

    setLoadingImages(prev => ({ ...prev, [id]: true }));
    try {
      const img = await visualizeGoal(exerciseName);
      if (img) {
        setExerciseImages(prev => ({ ...prev, [id]: img }));
      }
    } catch (e) {
      console.error("Failed to visualize", e);
    } finally {
      setLoadingImages(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSwapRequest = async (index: number, exerciseName: string) => {
      setSwappingIndex(index);
      setIsLoadingSwap(true);
      const alts = await getExerciseAlternatives(exerciseName, plan.targetMuscles.join(', '));
      setAlternatives(alts);
      setIsLoadingSwap(false);
  };

  const confirmSwap = (newExercise: Exercise) => {
      if (swappingIndex === null) return;
      
      const newExercises = [...plan.exercises];
      newExercises[swappingIndex] = newExercise;
      
      onUpdatePlan({ ...plan, exercises: newExercises });
      setSwappingIndex(null);
      setAlternatives([]);
      // Clear image cache for this slot
      setExerciseImages(prev => {
          const newMap = {...prev};
          delete newMap[`ex-${swappingIndex}`];
          return newMap;
      });
  };

  const startRestTimer = (timeString: string, id: string) => {
      if (!timeString) return;
      // Parse "60s", "90s", "2min"
      let seconds = 60;
      if(timeString.includes('min')) {
          seconds = parseInt(timeString) * 60;
      } else {
          seconds = parseInt(timeString);
      }

      setActiveTimer(id);
      setTimeLeft(seconds);
  };

  useEffect(() => {
      let interval: any;
      if (activeTimer !== null && timeLeft > 0) {
          interval = setInterval(() => {
              setTimeLeft(prev => prev - 1);
          }, 1000);
      } else if (timeLeft === 0) {
          setActiveTimer(null);
      }
      return () => clearInterval(interval);
  }, [activeTimer, timeLeft]);

  // Defensive Check: Ensure plan exists before rendering
  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl bg-black border-2 border-red-500 shadow-[0_0_50px_rgba(255,0,60,0.3)] relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-red-900/30 p-6 border-b border-red-500 flex justify-between items-center flex-shrink-0">
          <div>
             <div className="text-red-500 font-bold tracking-[0.2em] text-xs animate-pulse">ALARME DE QUEST</div>
             <h2 className="text-2xl md:text-3xl font-black text-white mt-1 uppercase italic">{plan.title || 'Missão Desconhecida'}</h2>
             {plan.suggestedSchedule && Array.isArray(plan.suggestedSchedule) && (
                 <div className="text-[10px] text-gray-400 mt-1 uppercase">
                     AGENDA: <span className="text-white font-bold">{plan.suggestedSchedule.join(', ')}</span>
                 </div>
             )}
          </div>
          <AlertTriangle size={32} className="text-red-500" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar relative">
          
          <div className="flex gap-4 text-sm text-gray-400">
             <div className="flex items-center gap-1">
                 <Clock size={16} className="text-cyan-400" /> {plan.estimatedDuration || '45 min'}
             </div>
             <div className="flex items-center gap-1">
                 <Trophy size={16} className="text-yellow-400" /> {plan.xpReward || 0} XP
             </div>
          </div>

          {/* PHASE 1: MOBILITY */}
          {plan.mobilityRoutine && plan.mobilityRoutine.length > 0 && (
              <div className="space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest border-b border-cyan-900 pb-2">
                      <Activity size={20} /> FASE 1: PREPARAÇÃO & MOBILIDADE (OBRIGATÓRIO)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {plan.mobilityRoutine.map((mob, i) => {
                          const id = `mob-${i}`;
                          // Safe access to properties
                          const name = mob?.name || 'Mobilidade';
                          const duration = mob?.duration || '1 min';
                          const description = mob?.description || 'Prepare as articulações.';
                          
                          return (
                              <div key={i} className="bg-cyan-900/10 border border-cyan-500/30 p-4 rounded relative overflow-hidden group hover:border-cyan-500 transition-colors">
                                  <h4 className="font-bold text-white text-sm mb-1">{name}</h4>
                                  <div className="text-xs text-cyan-400 font-bold mb-2">{duration}</div>
                                  <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{description}</p>
                                  
                                  {/* Mobility Visualizer */}
                                  <div className="mt-2 h-24 bg-black relative border border-cyan-900 rounded overflow-hidden">
                                      {exerciseImages[id] ? (
                                           <img src={exerciseImages[id]} alt={name} className="w-full h-full object-cover opacity-80" />
                                      ) : (
                                          <button 
                                            onClick={() => handleVisualize(description, id)}
                                            disabled={loadingImages[id]}
                                            className="w-full h-full flex flex-col items-center justify-center text-cyan-600 hover:text-cyan-400 transition-colors"
                                          >
                                              {loadingImages[id] ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                                              <span className="text-[8px] mt-1 font-bold uppercase">Visualizar</span>
                                          </button>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* PHASE 2: WORKOUT */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest border-b border-red-900 pb-2">
                 <div className="w-2 h-2 bg-red-500 animate-pulse"></div> FASE 2: PROTOCOLO DE HIPERTROFIA
            </div>

            {plan.exercises && plan.exercises.length > 0 ? (
                plan.exercises.map((ex, idx) => {
                    if (!ex) return null; // Defensive check
                    const id = `ex-${idx}`;
                    return (
                    <div key={idx} className="bg-gray-900/40 border border-gray-800 p-1 relative overflow-hidden group">
                        {/* Active Marker */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600 z-10"></div>

                        <div className="p-4 pl-6 relative z-0">
                            {/* Title Row */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-xl text-white uppercase tracking-wider">{ex.name}</h4>
                                    <button 
                                        onClick={() => handleSwapRequest(idx, ex.name)}
                                        className="p-1 text-gray-500 hover:text-cyan-400 transition-colors"
                                        title="Trocar Exercício por Variação"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                                        ex.difficulty === 'Hell' ? 'border-red-600 text-red-500' : 
                                        ex.difficulty === 'Hard' ? 'border-orange-600 text-orange-500' : 'border-green-600 text-green-500'
                                    }`}>
                                        {ex.difficulty || 'Normal'}
                                    </span>
                                    {ex.grip && ex.grip !== 'N/A' && (
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border border-cyan-600 text-cyan-400">
                                            PEGADA: {ex.grip}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Notes Quote */}
                            {ex.notes && (
                                <div className="mb-4 pl-4 border-l-2 border-gray-700 italic text-gray-400 text-sm font-mono">
                                    " {ex.notes} "
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Technical Analysis Box (Left) */}
                                {ex.technicalTips && (
                                    <div className="relative border-2 border-dashed border-cyan-900/60 bg-black/20 p-4 rounded-sm flex flex-col justify-between group-hover:border-cyan-500/30 transition-colors h-full">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3 text-cyan-400 font-bold uppercase tracking-widest text-[10px]">
                                                <BrainCircuit size={14} /> Análise de Técnica
                                            </div>
                                            <p className="text-sm text-gray-300 font-mono leading-relaxed relative z-10 text-justify">
                                                {ex.technicalTips}
                                            </p>
                                        </div>
                                        <div className="absolute bottom-1 right-1 opacity-5 text-cyan-500 pointer-events-none">
                                            <BrainCircuit size={80} />
                                        </div>
                                    </div>
                                )}

                                {/* Visual & Stats (Right) */}
                                <div className="flex flex-col gap-2 h-full">
                                    {/* Holographic Video Player Simulation */}
                                    <div className="flex-1 min-h-[160px] w-full bg-black border border-cyan-900/50 relative group/video overflow-hidden rounded-sm">
                                        {exerciseImages[id] ? (
                                            <div className="w-full h-full relative">
                                                {/* Fake Scanlines */}
                                                <div className="absolute inset-0 z-10 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.1)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                                                <div className="absolute inset-0 z-10 animate-[scan_3s_linear_infinite] bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent h-[20%] w-full pointer-events-none"></div>
                                                
                                                <img src={exerciseImages[id]} alt={ex.name} className="w-full h-full object-cover opacity-80 filter contrast-125 brightness-110" />
                                                
                                                {/* HUD Elements */}
                                                <div className="absolute top-2 left-2 text-[8px] text-cyan-400 font-mono border border-cyan-500/50 px-1 bg-black/50">
                                                    REC /// MODEL_0{idx + 1}
                                                </div>
                                                <div className="absolute bottom-2 left-2 right-2 h-1 bg-gray-800">
                                                    <div className="h-full bg-cyan-500 w-1/3 animate-pulse"></div>
                                                </div>
                                                <div className="absolute bottom-4 right-2 text-cyan-400 animate-pulse">
                                                    <Play size={16} fill="currentColor" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/20">
                                                <button 
                                                    onClick={() => handleVisualize(ex.name, id)}
                                                    disabled={loadingImages[id]}
                                                    className="text-xs flex flex-col items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
                                                >
                                                    {loadingImages[id] ? <Loader2 size={32} className="animate-spin" /> : <BrainCircuit size={32} />}
                                                    <span className="uppercase tracking-wider font-bold text-[10px]">
                                                        {loadingImages[id] ? "MATERIALIZANDO..." : "CARREGAR SIMULAÇÃO"}
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats Bar */}
                                    <div className="grid grid-cols-3 gap-1 h-12">
                                        <div className="bg-gray-900/80 flex flex-col items-center justify-center border border-gray-800">
                                            <span className="text-[8px] text-gray-500 uppercase">Sets</span>
                                            <span className="text-cyan-400 font-bold">{ex.sets}</span>
                                        </div>
                                        <div className="bg-gray-900/80 flex flex-col items-center justify-center border border-gray-800">
                                            <span className="text-[8px] text-gray-500 uppercase">Reps</span>
                                            <span className="text-cyan-400 font-bold">{ex.reps}</span>
                                        </div>
                                        <div 
                                            className="bg-gray-900/80 flex flex-col items-center justify-center border border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
                                            onClick={() => startRestTimer(ex.restTime, id)}
                                        >
                                            {activeTimer === id ? (
                                                <span className="text-red-500 font-bold animate-pulse">{timeLeft}s</span>
                                            ) : (
                                                <>
                                                    <span className="text-[8px] text-gray-500 uppercase">Descanso</span>
                                                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                                                        {ex.restTime} <Timer size={10} />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )})
            ) : (
                <div className="p-4 border border-red-500 bg-red-900/20 text-red-400 text-center text-sm">
                    Nenhum exercício carregado. Protocolo de emergência falhou.
                </div>
            )}
          </div>

          {/* Swap Modal Overlay */}
          {swappingIndex !== null && (
              <div className="absolute inset-0 bg-black/95 z-20 flex flex-col p-6 animate-in fade-in slide-in-from-bottom-10 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
                          <RefreshCw size={18} /> Substituição Tática
                      </h3>
                      <button onClick={() => setSwappingIndex(null)} className="text-gray-500 hover:text-white">Cancelar</button>
                  </div>

                  {isLoadingSwap ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-cyan-500">
                          <Loader2 size={40} className="animate-spin" />
                          <span className="text-xs uppercase tracking-widest">Calculando Alternativas...</span>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                          {alternatives.map((alt, i) => (
                              <button 
                                key={i} 
                                onClick={() => confirmSwap(alt)}
                                className="bg-gray-900 border border-gray-700 hover:border-cyan-500 p-4 text-left group transition-all"
                              >
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">{alt.name}</span>
                                      <ChevronRight size={16} className="text-gray-600 group-hover:text-cyan-500" />
                                  </div>
                                  <div className="text-xs text-gray-400 flex gap-3">
                                      <span>Sets: {alt.sets}</span>
                                      <span>Reps: {alt.reps}</span>
                                      <span className="text-yellow-600">{alt.difficulty}</span>
                                  </div>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-red-900/50 flex justify-between gap-4 bg-black flex-shrink-0 items-center">
            <div className="hidden md:block text-xs text-gray-500 font-mono">
                SISTEMA V2.5 // AWAITING INPUT
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <button 
                    onClick={onCancel}
                    className="flex-1 md:flex-none px-6 py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-all uppercase font-bold tracking-wider"
                >
                    Recusar
                </button>
                <button 
                    onClick={onAccept}
                    className="flex-1 md:flex-none px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,60,0.5)] flex items-center justify-center gap-2 group"
                >
                    <CheckCircle size={20} className="group-hover:scale-110 transition-transform"/>
                    ACEITAR MISSÃO
                </button>
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
  );
};

export default DailyQuest;