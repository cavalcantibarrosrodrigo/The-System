export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export interface PlayerStats {
  str: number; // Força
  agi: number; // Agilidade
  vit: number; // Vitalidade
  int: number; // Inteligência
  per: number; // Percepção
}

export interface WorkoutSession {
    id: string;
    date: string;
    title: string;
    muscles: MuscleGroup[];
    type: 'hypertrophy' | 'strength';
}

export type VolumeType = 'low_volume' | 'high_volume' | 'system_auto';

export interface Player {
  name: string;
  job: string;
  title: string;
  level: number;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  xp: number;
  requiredXp: number;
  hp: number;
  maxHp: number;
  mp: number; // Mana Points
  maxMp: number;
  stats: PlayerStats;
  unlockedSkills: string[]; // List of Skill IDs that are unlocked
  gender: 'male' | 'female';
  workoutHistory: WorkoutSession[];
  trainingFocus: 'hypertrophy' | 'strength'; // New field
  strengthCycleStart?: string; // Date string for when the 3-week cycle started
}

export interface MobilityExercise {
    name: string;
    duration: string; // e.g. "30s" or "10 reps"
    description: string; // Detailed description for image gen
    benefit: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restTime: string; // e.g., "60s", "90s", "2min"
  grip?: string; // e.g., "Pronada", "Supinada", "Neutra"
  notes: string;
  technicalTips?: string;
  difficulty: 'Normal' | 'Hard' | 'Hell';
  imageUrl?: string; // Generated visualization
}

export interface WorkoutPlan {
  id: string;
  title: string;
  targetMuscles: MuscleGroup[];
  mobilityRoutine: MobilityExercise[]; // New Phase 1
  exercises: Exercise[]; // Phase 2
  xpReward: number;
  estimatedDuration: string;
  suggestedSchedule?: string[]; // Days of week for this plan
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  imageUrl?: string;
  isThinking?: boolean;
}

export type CalisthenicsCategory = 'push' | 'pull' | 'legs' | 'core';

export interface CalisthenicsSkill {
    id: string;
    name: string;
    level: 1 | 2 | 3 | 4 | 5;
    category: CalisthenicsCategory;
    description?: string; // Loaded dynamically
    execution?: string[]; // Loaded dynamically
}

export type TrainingFrequency = '3x_week' | 'every_other_day' | 'system_auto' | 'custom_split';

export interface SplitStrategy {
    description: string; // Simple explanation for the user
    frequency: string;
    schedule: string;
    volume: string;
    rest: string;
    technique: string;
    defaultDays: string[]; // Default recommended days
}