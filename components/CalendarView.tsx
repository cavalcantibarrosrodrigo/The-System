import React from 'react';
import { Player, WorkoutSession } from '../types';
import { CheckCircle, Calendar, ChevronLeft, ChevronRight, Dumbbell, Zap } from 'lucide-react';

interface Props {
  player: Player;
}

const CalendarView: React.FC<Props> = ({ player }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  
  // Get history for this month
  const getSessionForDay = (day: number) => {
    return player.workoutHistory.find(s => {
      const d = new Date(s.date);
      return d.getDate() === day && 
             d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear();
    });
  };

  const isToday = (day: number) => {
      return day === today.getDate() && 
             currentMonth.getMonth() === today.getMonth() && 
             currentMonth.getFullYear() === today.getFullYear();
  };

  const getFutureWorkout = (day: number) => {
      // Very basic projection: If last workout was X, predict next based on standard rotation
      // Only project for future days in current month
      if (day <= today.getDate() && currentMonth.getMonth() === today.getMonth()) return null;
      if (currentMonth.getMonth() < today.getMonth()) return null;
      
      // Every other day logic simulation
      const diffDays = day - today.getDate();
      if (diffDays > 0 && diffDays % 2 === 0) {
          return { type: 'suggested', label: 'Treino' };
      }
      return null;
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Calendar size={18} /> Cronograma do Sistema
          </h3>
          <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-1 hover:text-white text-gray-500"><ChevronLeft size={20}/></button>
              <span className="font-bold text-white w-32 text-center">
                  {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
              </span>
              <button onClick={() => changeMonth(1)} className="p-1 hover:text-white text-gray-500"><ChevronRight size={20}/></button>
          </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
              <div key={d} className="text-[10px] text-gray-500 font-bold">{d}</div>
          ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
          {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-transparent" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const session = getSessionForDay(day);
              const future = !session ? getFutureWorkout(day) : null;
              const todayClass = isToday(day) ? "border border-cyan-500 shadow-[0_0_10px_rgba(0,243,255,0.3)]" : "border border-gray-800";

              return (
                  <div key={day} className={`bg-black/40 ${todayClass} p-1 flex flex-col justify-between min-h-[60px] relative group`}>
                      <span className={`text-xs font-bold ${isToday(day) ? 'text-cyan-400' : 'text-gray-500'}`}>{day}</span>
                      
                      {session && (
                          <div className="mt-1">
                              <div className={`text-[8px] font-bold uppercase truncate px-1 rounded ${
                                  session.type === 'strength' ? 'bg-purple-900 text-purple-200' : 'bg-green-900 text-green-200'
                              }`}>
                                  {session.type === 'strength' ? <Zap size={8} className="inline mr-1"/> : <CheckCircle size={8} className="inline mr-1"/>}
                                  {session.type === 'strength' ? 'FORÇA' : 'TREINO'}
                              </div>
                              <div className="text-[8px] text-gray-400 truncate mt-0.5">{session.muscles[0]}...</div>
                          </div>
                      )}

                      {future && (
                          <div className="mt-1 opacity-50">
                               <div className="text-[8px] font-bold uppercase truncate px-1 rounded border border-gray-600 text-gray-500 border-dashed">
                                  <Dumbbell size={8} className="inline mr-1"/>
                                  PLAN
                              </div>
                          </div>
                      )}
                  </div>
              );
          })}
      </div>
      
      {player.trainingFocus === 'strength' && (
           <div className="mt-4 p-2 bg-purple-900/20 border border-purple-500/50 text-xs text-purple-300">
               <div className="font-bold mb-1 flex items-center gap-2"><Zap size={12}/> CICLO DE FORÇA ATIVO</div>
               <div>Semana: {Math.ceil(((new Date().getTime() - new Date(player.strengthCycleStart || new Date()).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1)} / 3</div>
           </div>
      )}
    </div>
  );
};

export default CalendarView;