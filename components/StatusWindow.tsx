import React, { useState } from 'react';
import { Player, WorkoutPlan } from '../types';
import { visualizeGoal } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Shield, Zap, Heart, Brain, Eye, User, CheckCircle, Dumbbell, Crown, Clock, Flame, Hand, Eye as EyeIcon, Loader2, X } from 'lucide-react';

interface Props {
  player: Player;
  activeQuest: WorkoutPlan | null;
  onFinishQuest: () => void;
}

const StatusWindow: React.FC<Props> = ({ player, activeQuest, onFinishQuest }) => {
  const [visualizingIndex, setVisualizingIndex] = useState<number | null>(null);
  const [images, setImages] = useState<Record<number, string>>({});
  const [loadingImage, setLoadingImage] = useState(false);

  // Mapping RPG stats to Fitness Attributes for the Chart
  const statData = [
    { subject: 'FORÇA', A: player.stats.str, fullMark: 100 },
    { subject: 'MOBILIDADE', A: player.stats.agi, fullMark: 100 },
    { subject: 'RESILIÊNCIA', A: player.stats.vit, fullMark: 100 },
    { subject: 'TÉCNICA', A: player.stats.int, fullMark: 100 },
    { subject: 'DISCIPLINA', A: player.stats.per, fullMark: 100 },
  ];

  const handleVisualize = async (exerciseName: string, index: number) => {
    if(images[index]) {
        setVisualizingIndex(index);
        return;
    }

    setLoadingImage(true);
    setVisualizingIndex(index);
    try {
        const img = await visualizeGoal(exerciseName);
        if(img) {
            setImages(prev => ({...prev, [index]: img}));
        }
    } catch(e) {
        console.error(e);
    } finally {
        setLoadingImage(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-none neon-border relative overflow-hidden h-full flex flex-col custom-scrollbar overflow-y-auto">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500 opacity-5 blur-3xl pointer-events-none"></div>

      <h2 className="text-2xl font-bold tracking-widest text-cyan-400 mb-4 border-b border-cyan-900 pb-2 uppercase flex items-center gap-2">
        <User size={24} /> Janela de Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Stats & Info */}
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">NOME</p>
            <p className="text-xl font-bold uppercase">{player.name}</p>
          </div>
          
          <div className="flex justify-between items-end">
             <div className="space-y-1">
              <p className="text-gray-400 text-sm">NÍVEL</p>
              <p className="text-4xl font-black text-cyan-400 leading-none">{player.level}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-gray-400 text-sm">RANK</p>
              <p className="text-4xl font-black text-white leading-none">{player.rank}</p>
            </div>
          </div>

          <div className="flex gap-4">
              <div className="space-y-1 border-l-2 border-cyan-500 pl-3 bg-cyan-900/10 py-1 flex-1">
                 <p className="text-gray-500 text-[10px] uppercase tracking-widest">Classe Atual</p>
                 <p className="text-sm font-bold tracking-wider text-white">{player.job}</p>
              </div>
              
              <div className="space-y-1 border-l-2 border-red-500 pl-3 bg-red-900/10 py-1 flex-1">
                 <p className="text-gray-500 text-[10px] uppercase tracking-widest">Título Conquistado</p>
                 <p className="text-sm font-bold tracking-wider text-red-400">{player.title}</p>
              </div>
          </div>

          {/* HP / MP Bars */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-red-400">
              <span>HP (Energia Vital)</span>
              <span>{player.hp}/{player.maxHp}</span>
            </div>
            <div className="w-full bg-gray-900 h-2">
              <div className="bg-red-600 h-2" style={{ width: `${(player.hp/player.maxHp)*100}%` }}></div>
            </div>

            <div className="flex justify-between text-xs text-blue-400">
              <span>MP (Foco Mental)</span>
              <span>{player.mp}/{player.maxMp}</span>
            </div>
            <div className="w-full bg-gray-900 h-2">
              <div className="bg-blue-600 h-2" style={{ width: `${(player.mp/player.maxMp)*100}%` }}></div>
            </div>
          </div>

           {/* Detailed Stats Mapped to Fitness Concepts */}
           <div className="grid grid-cols-2 gap-2 pt-4">
             <div className="flex items-center gap-2 p-2 bg-gray-900/50 border-l-2 border-red-500">
                <Shield size={16} className="text-red-500" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Força</div>
                  <div className="text-lg font-bold">{player.stats.str}</div>
                </div>
             </div>
             <div className="flex items-center gap-2 p-2 bg-gray-900/50 border-l-2 border-green-500">
                <Zap size={16} className="text-green-500" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Mobilidade</div>
                  <div className="text-lg font-bold">{player.stats.agi}</div>
                </div>
             </div>
             <div className="flex items-center gap-2 p-2 bg-gray-900/50 border-l-2 border-yellow-500">
                <Heart size={16} className="text-yellow-500" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Resiliência</div>
                  <div className="text-lg font-bold">{player.stats.vit}</div>
                </div>
             </div>
             <div className="flex items-center gap-2 p-2 bg-gray-900/50 border-l-2 border-purple-500">
                <Brain size={16} className="text-purple-500" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Técnica</div>
                  <div className="text-lg font-bold">{player.stats.int}</div>
                </div>
             </div>
             <div className="flex items-center gap-2 p-2 bg-gray-900/50 border-l-2 border-cyan-500">
                <Eye size={16} className="text-cyan-500" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Disciplina</div>
                  <div className="text-lg font-bold">{player.stats.per}</div>
                </div>
             </div>
           </div>
        </div>

        {/* Right Column: Chart */}
        <div className="relative flex items-center justify-center min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={statData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 10, fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Jogador"
                dataKey="A"
                stroke="#00f3ff"
                strokeWidth={2}
                fill="#00f3ff"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Quest Section */}
      {activeQuest && (
          <div className="mt-auto border-2 border-yellow-500 bg-yellow-900/10 p-4 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center justify-between mb-4 border-b border-yellow-500/30 pb-2">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold tracking-widest uppercase">
                      <Crown size={20} className="animate-pulse" />
                      QUEST EM ANDAMENTO
                  </div>
                  <div className="text-xs text-yellow-200">
                      RECOMPENSA: {activeQuest.xpReward} XP
                  </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4 uppercase">{activeQuest.title}</h3>
              
              <div className="mb-6 space-y-4">
                  {activeQuest.exercises.map((ex, i) => (
                      <div key={i} className="bg-black/60 border border-gray-700 p-3 rounded group hover:border-yellow-500 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                  <Dumbbell size={16} className="text-yellow-500" />
                                  <span className="font-bold text-sm uppercase text-gray-200">{ex.name}</span>
                              </div>
                              <button 
                                onClick={() => handleVisualize(ex.name, i)}
                                className="text-cyan-400 hover:text-cyan-200 transition-colors"
                                title="Visualizar Exercício"
                              >
                                  <EyeIcon size={16} />
                              </button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400 mb-2">
                              <div className="bg-gray-800/50 px-2 py-1 rounded">Sets: <span className="text-white font-bold">{ex.sets}</span></div>
                              <div className="bg-gray-800/50 px-2 py-1 rounded">Reps: <span className="text-white font-bold">{ex.reps}</span></div>
                              <div className="bg-gray-800/50 px-2 py-1 rounded flex items-center gap-1">
                                  <Clock size={10} /> <span className="text-white font-bold">{ex.restTime}</span>
                              </div>
                              <div className="bg-gray-800/50 px-2 py-1 rounded flex items-center gap-1">
                                  <Hand size={10} /> <span className="text-white font-bold">{ex.grip || 'Normal'}</span>
                              </div>
                          </div>
                          
                          {ex.technicalTips && (
                              <div className="text-[10px] text-gray-500 flex items-start gap-1 italic border-t border-gray-800 pt-2 mt-1">
                                  <Flame size={10} className="text-red-500 mt-0.5" />
                                  <span>{ex.technicalTips}</span>
                              </div>
                          )}
                      </div>
                  ))}
              </div>

              <button
                  onClick={onFinishQuest}
                  className="w-full py-4 bg-yellow-400 text-black font-black uppercase tracking-[0.2em] text-lg hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center justify-center gap-2 animate-pulse"
              >
                  <CheckCircle size={24} />
                  TREINO CONCLUÍDO
              </button>
          </div>
      )}

      {/* Image Modal */}
      {visualizingIndex !== null && (
          <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
              <div className="w-full h-full max-h-[400px] border border-cyan-500 relative bg-black">
                  <button 
                    onClick={() => setVisualizingIndex(null)}
                    className="absolute top-2 right-2 text-cyan-500 hover:text-white z-10"
                  >
                      <X size={24} />
                  </button>
                  {loadingImage ? (
                      <div className="flex flex-col items-center justify-center h-full text-cyan-500 gap-2">
                          <Loader2 size={32} className="animate-spin" />
                          <span className="text-xs uppercase tracking-widest">Materializando...</span>
                      </div>
                  ) : images[visualizingIndex] ? (
                      <img src={images[visualizingIndex]} alt="Exercise" className="w-full h-full object-contain" />
                  ) : (
                      <div className="flex items-center justify-center h-full text-red-500">Erro na Visualização</div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default StatusWindow;