import React, { useState } from 'react';
import { Player } from '../types';
import { INITIAL_PLAYER } from '../constants';
import { Shield, User, Lock, ChevronRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface Props {
  onLogin: (player: Player, username: string) => void;
}

const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = () => {
    if (!username || !password) {
      setError("Preencha todos os campos.");
      return;
    }

    const dbString = localStorage.getItem('system_users_db');
    let db = dbString ? JSON.parse(dbString) : {};

    if (isRegistering) {
      if (db[username]) {
        setError("Usuário já existe.");
        return;
      }
      // Create new user
      const newPlayer = { ...INITIAL_PLAYER, name: username };
      db[username] = { password, data: newPlayer };
      localStorage.setItem('system_users_db', JSON.stringify(db));
      onLogin(newPlayer, username);
    } else {
      // Login
      if (!db[username] || db[username].password !== password) {
        setError("Credenciais inválidas.");
        return;
      }
      onLogin(db[username].data, username);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-mono">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 opacity-50 shadow-[0_0_20px_#00f3ff] animate-[scan_3s_linear_infinite]"></div>

      <div className="w-full max-w-md bg-gray-900/80 border border-cyan-500 p-8 relative z-10 shadow-[0_0_30px_rgba(0,243,255,0.2)]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white italic tracking-widest mb-2 system-font">THE SYSTEM</h1>
          <p className="text-cyan-500 text-xs tracking-[0.3em] uppercase">Autenticação de Jogador</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Codinome (Usuário)</label>
            <div className="flex items-center bg-black border border-gray-700 p-3 focus-within:border-cyan-500 transition-colors">
              <User size={18} className="text-gray-500 mr-3" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-transparent text-white w-full focus:outline-none"
                placeholder="Hunter_01"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Chave de Acesso (Senha)</label>
            <div className="flex items-center bg-black border border-gray-700 p-3 focus-within:border-cyan-500 transition-colors relative">
              <Lock size={18} className="text-gray-500 mr-3" />
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-white w-full focus:outline-none pr-8"
                placeholder="********"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-500 hover:text-cyan-400 transition-colors"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-900/20 p-2 border border-red-500/50">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <button 
            onClick={handleAuth}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2"
          >
            {isRegistering ? 'Iniciar Cadastro' : 'Acessar Sistema'} <ChevronRight size={18} />
          </button>

          <div className="text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              className="text-gray-500 text-xs hover:text-white transition-colors uppercase tracking-wider"
            >
              {isRegistering ? 'Já possui conta? Login' : 'Novo usuário? Registrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;