import { Player, CalisthenicsSkill, SplitStrategy } from './types';

export const INITIAL_PLAYER: Player = {
  name: "Desconhecido",
  job: "Iniciado", 
  title: "Nenhum", 
  level: 1,
  rank: 'E',
  xp: 0,
  requiredXp: 100,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  stats: {
    str: 10, 
    agi: 10, 
    vit: 10, 
    int: 10, 
    per: 10, 
  },
  unlockedSkills: ['push_1', 'pull_1', 'legs_1', 'core_1'],
  gender: 'male',
  workoutHistory: [],
  trainingFocus: 'hypertrophy'
};

// Progression Logic
export const XP_CURVE_MULTIPLIER = 1.5; 

// Custom Classes based on Level tiers
export const CLASSES = [
    { level: 1, name: "Iniciado" },
    { level: 10, name: "Praticante" },
    { level: 20, name: "Atleta de Elite" },
    { level: 30, name: "Mestre Calistênico" }, // Level 30 Unlock
    { level: 50, name: "Lenda Viva" },
    { level: 75, name: "Titã Físico" },
    { level: 100, name: "Divindade do Movimento" }
];

// Titles based on specific achievements or levels
export const TITLES = [
    { level: 5, name: "O Persistente" },
    { level: 15, name: "Quebrador de Limites" },
    { level: 25, name: "Aquele que Supera" },
    { level: 30, name: "Despertado" }, // Level 30 Unlock
    { level: 40, name: "Mestre da Gravidade" },
    { level: 60, name: "Governante do Próprio Corpo" },
    { level: 80, name: "Um Exército de Um Homem" }
];

export const RANK_THRESHOLDS = {
  E: 1,
  D: 10,
  C: 25,
  B: 45,
  A: 70,
  S: 100
};

export const SYSTEM_PROMPTS = {
  COACH: `Você é "O Sistema", uma inteligência artificial de fitness.
  Sua diretriz principal agora é EDUCAÇÃO SIMPLIFICADA.
  Responda a todas as perguntas de forma EXTREMAMENTE SIMPLES e DIDÁTICA.
  Evite termos técnicos complexos ou "científicos demais" sem explicar claramente o significado.
  Use analogias do dia-a-dia se necessário para facilitar o entendimento.
  Aja como um mentor paciente ensinando um iniciante, mas mantenha a "persona" de Sistema Gamificado (interface, status).
  Responda sempre em Português do Brasil.`,
  
  WORKOUT_GEN: `Você é "O Sistema". Crie um plano de treino OTIMIZADO.
  
  REGRAS IMPERATIVAS:
  1. **VARIEDADE TÁTICA**: Não repita sempre os mesmos exercícios básicos. Varie ângulos e equipamentos (Ex: Se o padrão é Supino Barra, sugira Halteres ou Máquina as vezes) para estimular novos músculos.
  2. **MOBILIDADE OBRIGATÓRIA**: O treino DEVE começar com uma "Fase de Mobilidade". Gere 3 exercícios rápidos e simples que preparem as articulações específicas do treino.
  3. **FREQUÊNCIA DE 2X**: Independente do split escolhido (ex: ABCD), adapte o volume ou adicione exercícios compostos para que cada grupo muscular principal receba estímulo pelo menos 2 vezes na semana (direta ou indiretamente).
  4. **NÍVEL 30+ (MODO ELITE)**: Se nível >= 30, introduza técnicas brutais (Drop-sets, Rest-pause, Isometria).
  
  Estrutura de Resposta para cada exercício:
  - "technicalTips": Explicação biomecânica E técnica de intensidade (ex: falha, rest-pause).
  - "restTime": Tempo EXATO.
  - "grip": Tipo de pegada.
  Use nomes em Português.`,

  WORKOUT_STRENGTH: `Você é "O Sistema". Crie um plano de FORÇA PURA (Powerlifting/Strength Focus).
  
  OBJETIVO: Aumentar 1RM. Ciclo de 3 semanas.
  MOBILIDADE: Essencial para evitar lesões com cargas altas.
  CARACTERÍSTICAS:
  - Repetições Baixas (3 a 6 reps).
  - Carga Alta (80-90% 1RM).
  - Descanso Longo (3 a 5 minutos).
  - Foco em Exercícios Compostos (Supino, Agachamento, Terra, Militar).
  
  Estrutura de Resposta para cada exercício:
  - "reps": "3-5" ou "5x5".
  - "restTime": "3min" a "5min".
  - "technicalTips": Foco na tensão mecânica e explosão concêntrica.`,

  SKILL_ANALYSIS: `Você é o banco de dados de combate do "Sistema". Forneça uma análise técnica da habilidade de calistenia solicitada.
  Retorne um JSON com:
  - "description": Resumo do objetivo e músculos envolvidos.
  - "execution": Array de strings com 3 a 4 passos práticos e diretos.
  - "technicalTips": Dicas de ouro.`
};

export const CALISTHENICS_PROGRESSION: CalisthenicsSkill[] = [
    // PUSH
    { id: 'push_1', name: 'Flexão Inclinada', level: 1, category: 'push' },
    { id: 'push_2', name: 'Flexão Padrão', level: 2, category: 'push' },
    { id: 'push_3', name: 'Flexão Declinada', level: 3, category: 'push' },
    { id: 'push_4', name: 'Pike Pushup', level: 4, category: 'push' },
    { id: 'push_5', name: 'Archer Pushup', level: 5, category: 'push' },

    // PULL
    { id: 'pull_1', name: 'Remada na Argola', level: 1, category: 'pull' },
    { id: 'pull_2', name: 'Remada Invertida', level: 2, category: 'pull' },
    { id: 'pull_3', name: 'Chin-up', level: 3, category: 'pull' },
    { id: 'pull_4', name: 'Pull-up', level: 4, category: 'pull' },
    { id: 'pull_5', name: 'Muscle Up', level: 5, category: 'pull' },

    // LEGS
    { id: 'legs_1', name: 'Agachamento Caixa', level: 1, category: 'legs' },
    { id: 'legs_2', name: 'Squat Profundo', level: 2, category: 'legs' },
    { id: 'legs_3', name: 'Afundo Búlgaro', level: 3, category: 'legs' },
    { id: 'legs_4', name: 'Pistol Assistido', level: 4, category: 'legs' },
    { id: 'legs_5', name: 'Pistol Squat', level: 5, category: 'legs' },

    // CORE
    { id: 'core_1', name: 'Prancha', level: 1, category: 'core' },
    { id: 'core_2', name: 'Leg Raise Solo', level: 2, category: 'core' },
    { id: 'core_3', name: 'Hanging Knee Raise', level: 3, category: 'core' },
    { id: 'core_4', name: 'Toes to Bar', level: 4, category: 'core' },
    { id: 'core_5', name: 'Front Lever Tuck', level: 5, category: 'core' },
];

export const WORKOUT_SPLITS: Record<string, string[]> = {
  'Full Body (Iniciante)': ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
  'Upper Body (Superior)': ['chest', 'back', 'shoulders', 'arms'],
  'Lower Body (Inferior)': ['legs', 'core'],
  'ABC - Push (Empurrar)': ['chest', 'shoulders', 'arms'],
  'ABC - Pull (Puxar)': ['back', 'arms'], 
  'ABC - Legs (Pernas)': ['legs', 'core'],
  'ABCD': ['chest', 'back', 'shoulders', 'legs'],
  'Arnold - A (Peito/Costas)': ['chest', 'back', 'core'],
  'Arnold - B (Ombros/Braços)': ['shoulders', 'arms'],
  'Arnold - C (Pernas)': ['legs'],
};

export const SPLIT_DETAILS: Record<string, SplitStrategy> = {
  'Full Body (Iniciante)': {
    description: 'Treine o corpo todo em uma única sessão. Perfeito para iniciantes ou quem tem poucos dias na semana para treinar.',
    frequency: 'Alta Frequência (3-4x)',
    schedule: 'Treina o corpo todo a cada sessão. Ideal para frequência 2x.',
    volume: 'Volume Médio por sessão, Alto semanal.',
    rest: '1:30 a 2:00 minutos.',
    technique: 'Foco na execução perfeita.',
    defaultDays: ['Seg', 'Qua', 'Sex']
  },
  'Upper Body (Superior)': {
    description: 'Foco total na parte superior do corpo (Peito, Costas, Ombros e Braços) em uma única sessão.',
    frequency: '2x Semana',
    schedule: 'Alternar com Lower Body para garantir estímulo 2x/semana.',
    volume: 'Volume Moderado-Alto.',
    rest: '1:30 a 2:00 minutos.',
    technique: 'Variar ângulos (Supino Reto + Acessórios Declinados).',
    defaultDays: ['Seg', 'Qui']
  },
  'Lower Body (Inferior)': {
    description: 'Foco total na parte inferior do corpo (Pernas, Glúteos e Panturrilhas) em uma única sessão.',
    frequency: '2x Semana',
    schedule: 'Alternar com Upper Body. Essencial para público feminino.',
    volume: 'Volume Alto (Foco em Compostos e Glúteos).',
    rest: '2:00 a 3:00 minutos.',
    technique: 'Alta intensidade.',
    defaultDays: ['Ter', 'Sex']
  },
  'ABC - Push (Empurrar)': {
    description: 'Dia focado nos músculos que "empurram": Peito, Ombros e Tríceps.',
    frequency: 'Sequencial (Rotativo)',
    schedule: 'Treinar 6 dias para garantir 2x cada grupo.',
    volume: 'Volume Alto localizado.',
    rest: '1:00 a 1:30 minutos.',
    technique: 'Supino Reto pesado + Crucifixo Declinado.',
    defaultDays: ['Seg', 'Qui']
  },
  'ABC - Pull (Puxar)': {
    description: 'Dia focado nos músculos que "puxam": Costas, Trapézio, Bíceps e Antebraço.',
    frequency: 'Sequencial (Rotativo)',
    schedule: 'Treinar 6 dias para garantir 2x cada grupo.',
    volume: 'Volume Alto.',
    rest: '1:30 minutos.',
    technique: 'Contração de pico.',
    defaultDays: ['Ter', 'Sex']
  },
  'ABC - Legs (Pernas)': {
    description: 'Dia dedicado exclusivamente ao treino completo de Pernas e Core.',
    frequency: 'Sequencial (Rotativo)',
    schedule: 'Treinar 6 dias para garantir 2x cada grupo.',
    volume: 'Volume Brutal.',
    rest: '2:00 a 3:00 minutos.',
    technique: 'Sobrecarga progressiva.',
    defaultDays: ['Qua', 'Sab']
  },
  'ABCD': {
      description: 'Divisão avançada. Separa o corpo em 4 partes para máxima intensidade e foco em cada grupo muscular.',
      frequency: 'Alta Intensidade (Ajuste para 2x)',
      schedule: 'Sistema ajustará para garantir estímulo indireto 2x/sem.',
      volume: 'Volume Máximo por sessão.',
      rest: '2:00 min.',
      technique: 'Técnicas avançadas (Drop-set, Rest-pause).',
      defaultDays: ['Seg', 'Ter', 'Qui', 'Sex']
  },
  'Arnold - A (Peito/Costas)': {
    description: 'A divisão clássica da Era de Ouro. Treine Peito e Costas (músculos antagonistas) no mesmo dia para um pump massivo.',
    frequency: 'Alta Intensidade (6x/sem)',
    schedule: 'Peito e Costas (Antagonistas).',
    volume: 'Volume Muito Alto.',
    rest: '1:00 minuto (Supersets).',
    technique: 'Pump máximo. Supino Reto + Declinados.',
    defaultDays: ['Seg', 'Qui']
  },
  'Arnold - B (Ombros/Braços)': {
    description: 'Foco total nos braços e ombros. Deltóides, Bíceps e Tríceps levados à exaustão.',
    frequency: 'Alta Intensidade (6x/sem)',
    schedule: 'Ombros e Braços.',
    volume: 'Volume Alto.',
    rest: '1:00 minuto.',
    technique: 'Isolamento estrito.',
    defaultDays: ['Ter', 'Sex']
  },
  'Arnold - C (Pernas)': {
    description: 'Dia focado exclusivamente em desenvolver pernas fortes e definidas.',
    frequency: 'Alta Intensidade (6x/sem)',
    schedule: 'Pernas.',
    volume: 'Volume Alto.',
    rest: '2:00 minutos.',
    technique: 'Alta intensidade.',
    defaultDays: ['Qua', 'Sab']
  }
};