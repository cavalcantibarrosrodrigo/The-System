import React, { useState, useEffect, useRef } from 'react';
import { Player, MuscleGroup, WorkoutPlan, TrainingFrequency, WorkoutSession, VolumeType } from './types';
import { INITIAL_PLAYER, XP_CURVE_MULTIPLIER, RANK_THRESHOLDS, WORKOUT_SPLITS, SPLIT_DETAILS, CLASSES, TITLES } from './constants';
import StatusWindow from './components/StatusWindow';
import BodyMap from './components/BodyMap';
import CalendarView from './components/CalendarView'; 
import SystemChat from './components/SystemChat';
import DailyQuest from './components/DailyQuest';
import CalisthenicsTab from './components/CalisthenicsTab'; 
import AuthScreen from './components/AuthScreen';
import { generateWorkout } from './services/geminiService';
import { Activity, MessageSquare, Dumbbell, AlertOctagon, RefreshCw, ChevronDown, Info, BicepsFlexed, CalendarClock, Sparkles, LogOut, Lock, UserCircle, CalendarDays, Zap, Map, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Player State
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [activeTab, setActiveTab] = useState<'status' | 'workout' | 'calisthenics' | 'chat'>('status');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  
  // Quest State
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [questAccepted, setQuestAccepted] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<string>('');
  const [trainingFrequency, setTrainingFrequency] = useState<TrainingFrequency>('3x_week');
  const [volumeType, setVolumeType] = useState<VolumeType>('system_auto');
  
  // Schedule Management
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  // View Toggle for Workout Tab
  const [workoutViewMode, setWorkoutViewMode] = useState<'map' | 'calendar'>('map');

  // Load User on Mount
  useEffect(() => {
    const lastUser = localStorage.getItem('system_last_user');
    if (lastUser) {
        const dbString = localStorage.getItem('system_users_db');
        if (dbString) {
            const db = JSON.parse(dbString);
            if (db[lastUser]) {
                const loadedPlayer = {
                    ...INITIAL_PLAYER,
                    ...db[lastUser].data,
                    gender: db[lastUser].data.gender || 'male',
                    workoutHistory: db[lastUser].data.workoutHistory || [],
                    trainingFocus: db[lastUser].data.trainingFocus || 'hypertrophy'
                };
                setPlayer(loadedPlayer);
                setCurrentUser(lastUser);
            }
        }
    }
  }, []);

  // Global Auto-Save Effect
  // Saves whenever the 'player' object changes, ensuring persistence
  useEffect(() => {
    if (!currentUser) return;
    
    const dbString = localStorage.getItem('system_users_db');
    if (dbString) {
        const db = JSON.parse(dbString);
        if (db[currentUser]) {
            db[currentUser].data = player;
            localStorage.setItem('system_users_db', JSON.stringify(db));
        }
    }
  }, [player, currentUser]);


  const handleLogin = (loadedPlayer: Player, username: string) => {
    const updatedPlayer = {
        ...INITIAL_PLAYER,
        ...loadedPlayer,
        gender: loadedPlayer.gender || 'male',
        workoutHistory: loadedPlayer.workoutHistory || [],
        trainingFocus: loadedPlayer.trainingFocus || 'hypertrophy'
    };
    setPlayer(updatedPlayer);
    setCurrentUser(username);
    localStorage.setItem('system_last_user', username);
    
    // Force immediate save to ensure DB consistency
    const dbString = localStorage.getItem('system_users_db');
    const db = dbString ? JSON.parse(dbString) : {};
    if (db[username]) {
        db[username].data = updatedPlayer;
        localStorage.setItem('system_users_db', JSON.stringify(db));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPlayer(INITIAL_PLAYER);
    setActivePlan(null);
    setQuestAccepted(false);
    localStorage.removeItem('system_last_user');
  };

  // Level Up Logic
  useEffect(() => {
    if (!currentUser) return; 

    let updated = false;
    let newPlayer = { ...player };

    // Check for Level Up
    if (newPlayer.xp >= newPlayer.requiredXp) {
      const remainingXp = newPlayer.xp - newPlayer.requiredXp;
      newPlayer.level += 1;
      newPlayer.xp = remainingXp;
      newPlayer.requiredXp = Math.round(newPlayer.requiredXp * XP_CURVE_MULTIPLIER);

      // Rank Up Logic
      let newRank: Player['rank'] = newPlayer.rank;
      if (newPlayer.level >= RANK_THRESHOLDS.S) newRank = 'S';
      else if (newPlayer.level >= RANK_THRESHOLDS.A) newRank = 'A';
      else if (newPlayer.level >= RANK_THRESHOLDS.B) newRank = 'B';
      else if (newPlayer.level >= RANK_THRESHOLDS.C) newRank = 'C';
      else if (newPlayer.level >= RANK_THRESHOLDS.D) newRank = 'D';
      newPlayer.rank = newRank;

      // Stats Up
      newPlayer.stats.str += 2;
      newPlayer.stats.agi += 2;
      newPlayer.stats.vit += 2;
      newPlayer.stats.int += 1;
      newPlayer.stats.per += 1;

      // Check for Class Upgrade
      const newClass = CLASSES.slice().reverse().find(c => newPlayer.level >= c.level);
      if (newClass && newClass.name !== newPlayer.job) {
         newPlayer.job = newClass.name;
         setNotification(`CLASSE ATUALIZADA: ${newClass.name}`);
      }

       // Check for Title Upgrade
       const newTitle = TITLES.slice().reverse().find(t => newPlayer.level >= t.level);
       if (newTitle && newTitle.name !== newPlayer.title) {
          newPlayer.title = newTitle.name;
       }

      // Check for Elite Mode Unlock
      if (newPlayer.level === 30) {
        setNotification("MODO ELITE DESBLOQUEADO");
      } else {
        setNotification("LEVEL UP!");
      }
      
      updated = true;
      setTimeout(() => setNotification(null), 4000);
    }

    if (updated) {
      setPlayer(newPlayer);
    }
  }, [player.xp, player.requiredXp, player.level, currentUser]);


  // Handlers
  const handleGenerateWorkout = async () => {
    if (selectedMuscles.length === 0) return;
    setIsGenerating(true);
    
    const freqStrategy = preferredDays.length > 0 ? 'custom_split' : trainingFrequency;

    const plan = await generateWorkout(
        selectedMuscles, 
        player.level, 
        freqStrategy, 
        player.gender,
        player.trainingFocus, 
        volumeType, 
        preferredDays
    );
    
    setIsGenerating(false);
    
    if (plan) {
      setActivePlan(plan);
      setQuestAccepted(false);
      // Notify if it's an offline plan
      if (plan.id.startsWith('offline-')) {
          setNotification("MODO OFFLINE ATIVADO: PROTOCOLO DE EMERGÊNCIA");
          setTimeout(() => setNotification(null), 4000);
      }
    } else {
      setNotification("ERRO CRÍTICO NO SISTEMA");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAcceptQuest = () => {
      setQuestAccepted(true);
      setActiveTab('status');
      setNotification("QUEST ACEITA. INICIAR EXECUÇÃO.");
      setTimeout(() => setNotification(null), 3000);
  };

  const handleFinishQuest = () => {
    if (!activePlan) return;
    
    // Add to history
    const session: WorkoutSession = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        title: activePlan.title,
        muscles: activePlan.targetMuscles,
        type: player.trainingFocus
    };

    setPlayer(prev => ({
      ...prev,
      xp: prev.xp + activePlan.xpReward,
      mp: Math.min(prev.maxMp, prev.mp + 10),
      workoutHistory: [session, ...prev.workoutHistory].slice(0, 50)
    }));
    
    setNotification(`TREINO CONCLUÍDO: +${activePlan.xpReward} XP`);
    setTimeout(() => setNotification(null), 3000);
    
    setActivePlan(null);
    setQuestAccepted(false);
    setSelectedMuscles([]);
    setSelectedSplit('');
  };

  const handleSplitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const splitName = e.target.value;
    setSelectedSplit(splitName);
    
    if (splitName && WORKOUT_SPLITS[splitName]) {
        setSelectedMuscles(WORKOUT_SPLITS[splitName] as MuscleGroup[]);
        if (SPLIT_DETAILS[splitName] && SPLIT_DETAILS[splitName].defaultDays) {
            setPreferredDays(SPLIT_DETAILS[splitName].defaultDays);
        } else {
            setPreferredDays([]);
        }
    } else {
        setSelectedMuscles([]);
        setPreferredDays([]);
    }
  };

  const handleGenderToggle = () => {
      setPlayer(prev => ({
          ...prev,
          gender: prev.gender === 'male' ? 'female' : 'male'
      }));
  };

  const toggleTrainingMode = () => {
      const newMode = player.trainingFocus === 'hypertrophy' ? 'strength' : 'hypertrophy';
      setPlayer(prev => ({
          ...prev,
          trainingFocus: newMode,
          strengthCycleStart: newMode === 'strength' ? new Date().toISOString() : undefined
      }));
      setNotification(newMode === 'strength' ? "MODO FORÇA ATIVADO" : "MODO HIPERTROFIA ATIVADO");
      setTimeout(() => setNotification(null), 3000);
  }

  const toggleDay = (day: string) => {
      if (preferredDays.includes(day)) {
          setPreferredDays(prev => prev.filter(d => d !== day));
      } else {
          setPreferredDays(prev => [...prev, day]);
      }
  }

  const handleSkillMastery = (skillId: string, nextSkillId: string | undefined) => {
      setPlayer(prev => ({
          ...prev,
          xp: prev.xp + 50,
          unlockedSkills: nextSkillId && !prev.unlockedSkills.includes(nextSkillId) 
              ? [...prev.unlockedSkills, nextSkillId] 
              : prev.unlockedSkills
      }));
      setNotification("HABILIDADE DOMINADA: +50 XP");
      setTimeout(() => setNotification(null), 3000);
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const getVolumeDescription = (v: VolumeType) => {
      switch(v) {
          case 'low_volume': return "Intensidade Brutal. Poucas séries, carga máxima.";
          case 'high_volume': return "Foco Metabólico. Muitas séries e repetições.";
          case 'system_auto': return "Equilíbrio Perfeito. O Sistema calcula a dose ideal.";
      }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col md:flex-row overflow-hidden relative">
        
      {/* Sidebar Navigation */}
      <div className="w-full md:w-20 bg-gray-900 border-r border-gray-800 flex md:flex-col items-center justify-around md:justify-start py-4 z-20">
        <div className="hidden md:block mb-8 text-cyan-500 animate-pulse">
            <AlertOctagon size={32} />
        </div>
        
        <button 
            onClick={() => setActiveTab('status')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'status' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_#00f3ff]' : 'text-gray-500 hover:text-gray-300'}`}
            title="Status"
        >
            <Activity size={24} />
        </button>
        <button 
             onClick={() => setActiveTab('workout')}
             className={`p-3 rounded-xl transition-all md:mt-4 ${activeTab === 'workout' ? 'bg-red-500/20 text-red-400 shadow-[0_0_10px_#ff003c]' : 'text-gray-500 hover:text-gray-300'}`}
             title="Treino (Daily Quest)"
        >
            <Dumbbell size={24} />
        </button>
        <button 
             onClick={() => setActiveTab('calisthenics')}
             className={`p-3 rounded-xl transition-all md:mt-4 ${activeTab === 'calisthenics' ? 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_10px_#eab308]' : 'text-gray-500 hover:text-gray-300'}`}
             title="Calistenia (Skills)"
        >
            <BicepsFlexed size={24} />
        </button>
        <button 
             onClick={() => setActiveTab('chat')}
             className={`p-3 rounded-xl transition-all md:mt-4 ${activeTab === 'chat' ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_10px_#a855f7]' : 'text-gray-500 hover:text-gray-300'}`}
             title="Sistema"
        >
            <MessageSquare size={24} />
        </button>

        <div className="md:mt-auto">
          <button 
            onClick={handleLogout}
            className="p-3 text-red-500 hover:text-red-300 transition-colors"
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
         {/* Top Bar (Mobile/Desktop) */}
         <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-black/80 backdrop-blur z-10">
             <h1 className="text-xl font-bold tracking-[0.2em] italic text-white system-font">
                THE SYSTEM <span className="text-xs text-gray-500 not-italic">v3.4.1-STABLE</span>
             </h1>
             <div className="flex items-center gap-4">
                 {player.level >= 30 && (
                   <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-500 rounded text-xs text-purple-300 animate-pulse">
                     <Lock size={12} className="text-purple-400" />
                     MODO ELITE
                   </div>
                 )}
                 <div className="text-right">
                     <div className="text-[10px] text-gray-400">NÍVEL</div>
                     <div className="text-xl font-bold text-cyan-400 leading-none">{player.level}</div>
                 </div>
                 <div className="h-8 w-8 rounded bg-gray-800 border border-cyan-500 flex items-center justify-center font-bold text-white">
                     {player.rank}
                 </div>
             </div>
         </div>
        
         {/* XP Bar running across top */}
         <div className="w-full bg-gray-900 h-1">
             <div 
                className="bg-cyan-500 h-1 shadow-[0_0_10px_#00f3ff] transition-all duration-1000" 
                style={{ width: `${(player.xp / player.requiredXp) * 100}%` }}
             ></div>
         </div>

         {/* Content View */}
         <div className="flex-1 p-4 md:p-6 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

            {activeTab === 'status' && (
                <div className="h-full animate-in fade-in zoom-in duration-300">
                    <StatusWindow 
                        player={player} 
                        activeQuest={questAccepted ? activePlan : null}
                        onFinishQuest={handleFinishQuest}
                    />
                </div>
            )}

            {activeTab === 'calisthenics' && (
                <div className="h-full animate-in slide-in-from-right duration-300">
                    <CalisthenicsTab 
                        unlockedSkills={player.unlockedSkills} 
                        onSkillMastery={handleSkillMastery} 
                    />
                </div>
            )}

            {activeTab === 'workout' && (
                <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-300">
                    <div className="lg:col-span-2 h-full flex flex-col relative">
                        {/* Toggle View Button */}
                        <div className="absolute top-2 right-2 z-20 flex bg-black/80 rounded-full border border-gray-700">
                             <button 
                                onClick={() => setWorkoutViewMode('map')}
                                className={`p-2 rounded-l-full transition-colors ${workoutViewMode === 'map' ? 'bg-cyan-900 text-cyan-400' : 'text-gray-500'}`}
                             >
                                 <Map size={16} />
                             </button>
                             <button 
                                onClick={() => setWorkoutViewMode('calendar')}
                                className={`p-2 rounded-r-full transition-colors ${workoutViewMode === 'calendar' ? 'bg-cyan-900 text-cyan-400' : 'text-gray-500'}`}
                             >
                                 <CalendarDays size={16} />
                             </button>
                        </div>

                        {workoutViewMode === 'map' ? (
                             <BodyMap 
                                selected={selectedMuscles} 
                                onSelectionChange={(m) => { setSelectedMuscles(m); setSelectedSplit(''); setPreferredDays([]); }} 
                                gender={player.gender}
                             />
                        ) : (
                             <CalendarView player={player} />
                        )}
                    </div>
                    
                    <div className="glass-panel p-6 flex flex-col neon-border overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b border-red-900 pb-2">
                                <h3 className="text-xl font-bold text-red-500">QUEST DIÁRIA</h3>
                                <button 
                                    onClick={handleGenderToggle}
                                    className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                        player.gender === 'female' 
                                        ? 'bg-pink-900/50 border border-pink-500 text-pink-400' 
                                        : 'bg-blue-900/50 border border-blue-500 text-blue-400'
                                    }`}
                                >
                                    <UserCircle size={14} />
                                    {player.gender === 'female' ? 'Feminino' : 'Masculino'}
                                </button>
                            </div>

                            {/* Mode Toggle */}
                            <button
                                onClick={toggleTrainingMode}
                                className={`w-full mb-4 py-2 px-4 border rounded uppercase font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${
                                    player.trainingFocus === 'strength' 
                                    ? 'bg-purple-900/40 border-purple-500 text-purple-300 shadow-[0_0_15px_#a855f7]' 
                                    : 'bg-gray-900/40 border-gray-700 text-gray-500 hover:border-white hover:text-white'
                                }`}
                            >
                                <Zap size={16} className={player.trainingFocus === 'strength' ? "fill-current" : ""} />
                                {player.trainingFocus === 'strength' ? 'Modo Força (Ativo)' : 'Ativar Modo Força'}
                            </button>

                            {/* Volume Selector */}
                            <div className="mb-4">
                                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider flex items-center gap-2">
                                    <BarChart3 size={14} /> Densidade Volumétrica
                                </label>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <button 
                                        onClick={() => setVolumeType('low_volume')}
                                        className={`p-2 text-[10px] font-bold border rounded transition-all flex flex-col items-center justify-center ${
                                            volumeType === 'low_volume' 
                                            ? 'bg-orange-900/60 border-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' 
                                            : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'
                                        }`}
                                    >
                                        LOW VOL
                                    </button>
                                    <button 
                                        onClick={() => setVolumeType('system_auto')}
                                        className={`p-2 text-[10px] font-bold border rounded transition-all flex flex-col items-center justify-center ${
                                            volumeType === 'system_auto' 
                                            ? 'bg-cyan-900/60 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                                            : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'
                                        }`}
                                    >
                                        AUTO
                                    </button>
                                    <button 
                                        onClick={() => setVolumeType('high_volume')}
                                        className={`p-2 text-[10px] font-bold border rounded transition-all flex flex-col items-center justify-center ${
                                            volumeType === 'high_volume' 
                                            ? 'bg-blue-900/60 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]' 
                                            : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'
                                        }`}
                                    >
                                        HIGH VOL
                                    </button>
                                </div>
                                <div className="p-2 border-l-2 border-gray-700 bg-gray-900/30 text-[10px] text-gray-400 italic">
                                    {getVolumeDescription(volumeType)}
                                </div>
                            </div>

                            {/* Split Selection */}
                            <div className="mb-4">
                                <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Divisão de Treino (Split)</label>
                                <div className="relative">
                                    <select 
                                        value={selectedSplit} 
                                        onChange={handleSplitChange}
                                        className="w-full bg-gray-900 border border-gray-700 text-white p-3 appearance-none rounded focus:border-red-500 focus:outline-none"
                                    >
                                        <option value="">Personalizado</option>
                                        {Object.keys(WORKOUT_SPLITS).map(split => (
                                            <option key={split} value={split}>{split}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 text-gray-500 pointer-events-none" size={16} />
                                </div>
                            </div>

                             {/* SCHEDULE SELECTION */}
                            {selectedSplit && (
                                <div className="mb-4">
                                     <div className="mt-3 p-3 bg-gray-900/50 border border-red-900/50 animate-in slide-in-from-top-2">
                                        <div className="text-[10px] text-gray-400 mb-2 flex items-center gap-2 uppercase font-bold">
                                            <CalendarClock size={12} /> Agenda Programada:
                                        </div>
                                        <div className="flex justify-between gap-1 mb-2">
                                            {WEEKDAYS.map(day => {
                                                const isSelected = preferredDays.includes(day);
                                                return (
                                                    <button 
                                                        key={day}
                                                        onClick={() => toggleDay(day)}
                                                        className={`flex-1 aspect-square rounded flex items-center justify-center text-[10px] font-bold transition-all border ${
                                                            isSelected 
                                                            ? 'bg-red-900 border-red-500 text-white shadow-[0_0_5px_#ff003c]' 
                                                            : 'bg-black border-gray-800 text-gray-600 hover:border-gray-600'
                                                        }`}
                                                    >
                                                        {day.charAt(0)}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <div className="text-[9px] text-gray-500 mt-1 italic text-center">
                                            O sistema irá gerar o treino baseado nesta agenda.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Detailed Split Info */}
                            {selectedSplit && SPLIT_DETAILS[selectedSplit] && (
                                <div className="mb-4 p-4 bg-gray-900/50 border border-cyan-500/30 rounded text-sm space-y-3 animate-in fade-in slide-in-from-top-2 relative overflow-hidden group">
                                     {/* Background decoration */}
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

                                    <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-cyan-900 pb-1 mb-2 relative z-10">
                                        <Info size={16} /> ESTRATÉGIA TÁTICA: {selectedSplit}
                                    </div>

                                    {/* SIMPLE DESCRIPTION */}
                                    <div className="text-gray-300 text-xs italic border-l-2 border-cyan-600 pl-3 py-1 mb-2 bg-black/40">
                                        "{SPLIT_DETAILS[selectedSplit].description}"
                                    </div>
                                    
                                    {/* Technical Specs */}
                                    <div className="grid grid-cols-1 gap-2 relative z-10">
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                             <div className="bg-black/40 p-2 rounded border border-gray-800">
                                                 <span className="text-gray-500 block text-[10px] uppercase font-bold">Frequência</span>
                                                 <span className="text-cyan-400 text-xs">{SPLIT_DETAILS[selectedSplit].frequency}</span>
                                             </div>
                                              <div className="bg-black/40 p-2 rounded border border-gray-800">
                                                 <span className="text-gray-500 block text-[10px] uppercase font-bold">Descanso Ideal</span>
                                                 <span className="text-green-400 text-xs">{SPLIT_DETAILS[selectedSplit].rest}</span>
                                             </div>
                                        </div>

                                        <div className="bg-red-900/10 p-2 rounded border border-red-900/30">
                                            <span className="text-gray-500 block text-[10px] uppercase font-bold flex items-center gap-1">
                                                <Zap size={10} className="text-red-500"/> Foco Técnico
                                            </span>
                                            <span className="text-red-300 text-xs italic">"{SPLIT_DETAILS[selectedSplit].technique}"</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 mb-4">
                                {selectedSplit ? 'Configuração carregada. Inicie para gerar os exercícios.' : 'Selecione grupos musculares ou um split.'}
                            </p>
                            
                            {selectedMuscles.length > 0 && !selectedSplit && (
                                <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto">
                                    {selectedMuscles.map(m => (
                                        <div key={m} className="px-3 py-2 bg-gray-800 rounded border-l-2 border-cyan-500 uppercase text-xs font-bold tracking-wider">
                                            Alvo: {m}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-auto">
                            {activePlan && questAccepted ? (
                                <div className="p-4 border border-yellow-500/50 bg-yellow-900/20 text-center">
                                    <span className="text-yellow-500 font-bold block mb-1">QUEST ATIVA</span>
                                    <span className="text-xs text-gray-400">Verifique a aba STATUS</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerateWorkout}
                                    disabled={selectedMuscles.length === 0 || isGenerating}
                                    className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold uppercase tracking-[0.2em] transition-all clip-path-polygon shadow-[0_0_20px_rgba(255,0,60,0.4)] flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? <><RefreshCw className="animate-spin" /> GERANDO...</> : 'INICIAR QUEST'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="h-full animate-in fade-in duration-300">
                    <SystemChat />
                </div>
            )}
         </div>

         {/* Modals */}
         {activePlan && !questAccepted && (
             <DailyQuest 
                plan={activePlan} 
                onAccept={handleAcceptQuest} 
                onCancel={() => setActivePlan(null)} 
                onUpdatePlan={(p) => setActivePlan(p)}
             />
         )}

         {/* Notifications */}
         {notification && (
             <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black/90 border border-cyan-500 px-8 py-4 z-50 animate-bounce shadow-[0_0_30px_#00f3ff]">
                 <div className="text-cyan-400 font-bold text-xl tracking-widest text-center">{notification}</div>
             </div>
         )}

      </main>
    </div>
  );
};

export default App;