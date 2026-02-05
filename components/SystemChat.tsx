import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithSystem, searchFitnessData, visualizeGoal, analyzeImage } from '../services/geminiService';
import { Send, Image as ImageIcon, Search, Zap, Loader2, Sparkles } from 'lucide-react';

const SystemChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'system',
      text: 'SISTEMA ONLINE. Pergunte sobre seu treino, ou solicite uma análise biológica.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'search' | 'visualize'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() && mode !== 'visualize') return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let responseText = '';
    let imageUrl = undefined;

    try {
      if (mode === 'search') {
        const result = await searchFitnessData(userMsg.text);
        responseText = result.text;
        if(result.sources.length > 0) {
             responseText += `\n\nFONTES:\n${result.sources.map(s => `- ${s.title} (${s.uri})`).join('\n')}`;
        }
      } else if (mode === 'visualize') {
        responseText = "Visualizando conceito solicitado...";
        const img = await visualizeGoal(userMsg.text);
        if (img) imageUrl = img;
        responseText = "Visualização completa.";
      } else {
        // Chat Mode
        // Construct history for API
        const history = messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));
        responseText = await chatWithSystem(userMsg.text, history);
      }
    } catch (e) {
      responseText = "ERRO NO SISTEMA: Conexão Perdida.";
    }

    const systemMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date(),
      imageUrl: imageUrl
    };

    setMessages(prev => [...prev, systemMsg]);
    setIsLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          
          const userMsg: ChatMessage = {
              id: Date.now().toString(),
              role: 'user',
              text: "Analise esta imagem.",
              timestamp: new Date(),
              imageUrl: base64
          };
          setMessages(prev => [...prev, userMsg]);
          setIsLoading(true);

          const analysis = await analyzeImage(base64Data, "Analise este físico/equipamento/postura. Dê estimativa de status ou correção de forma.");
           const systemMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: analysis,
              timestamp: new Date()
          };
          setMessages(prev => [...prev, systemMsg]);
          setIsLoading(false);
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="glass-panel flex flex-col h-full neon-border">
      <div className="p-4 border-b border-cyan-900 bg-black/40 flex justify-between items-center">
        <h3 className="text-cyan-400 font-bold tracking-widest flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-ping' : 'bg-green-500'}`}></div>
            INTELIGÊNCIA DO SISTEMA
        </h3>
        <div className="flex gap-2">
            <button 
                onClick={() => setMode('chat')}
                className={`p-2 rounded hover:bg-cyan-900/50 transition-colors ${mode === 'chat' ? 'text-cyan-400 bg-cyan-900/30' : 'text-gray-500'}`}
                title="Chat"
            >
                <Zap size={18} />
            </button>
            <button 
                onClick={() => setMode('search')}
                className={`p-2 rounded hover:bg-cyan-900/50 transition-colors ${mode === 'search' ? 'text-cyan-400 bg-cyan-900/30' : 'text-gray-500'}`}
                title="Busca (Grounding)"
            >
                <Search size={18} />
            </button>
             <button 
                onClick={() => setMode('visualize')}
                className={`p-2 rounded hover:bg-cyan-900/50 transition-colors ${mode === 'visualize' ? 'text-cyan-400 bg-cyan-900/30' : 'text-gray-500'}`}
                title="Visualizar"
            >
                <Sparkles size={18} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg border ${
              msg.role === 'user' 
                ? 'bg-cyan-900/20 border-cyan-700 text-white' 
                : 'bg-gray-900/80 border-gray-700 text-cyan-50' // System text slightly tinted
            }`}>
               {msg.imageUrl && (
                   <img src={msg.imageUrl} alt="uploaded" className="max-w-full rounded mb-2 border border-cyan-500/50" />
               )}
              <div className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {msg.text}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 text-right">
                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
             <div className="flex justify-start">
                 <div className="bg-gray-900/80 border border-gray-700 p-3 rounded-lg flex items-center gap-2">
                    <Loader2 className="animate-spin text-cyan-400" size={16} />
                    <span className="text-xs text-cyan-400 animate-pulse">PROCESSANDO...</span>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black/60 border-t border-cyan-900">
        <div className="flex gap-2">
            <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
            />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-cyan-500 text-gray-300 hover:text-cyan-400 transition-all"
          >
            <ImageIcon size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'search' ? "Buscar na base de dados..." : mode === 'visualize' ? "Descreva o físico alvo..." : "Comande o Sistema..."}
            className="flex-1 bg-black border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="p-3 bg-cyan-900/50 rounded border border-cyan-700 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemChat;