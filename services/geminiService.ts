import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPTS } from "../constants";
import { WorkoutPlan, MuscleGroup, TrainingFrequency, Exercise, VolumeType } from "../types";

// Helper to safely access API KEY
const getApiKey = () => {
    // 1. Try LocalStorage (Manual Override for users)
    if (typeof window !== 'undefined') {
        const localKey = localStorage.getItem('sys_api_key');
        if (localKey) return localKey;
    }

    // 2. Try process.env (Standard/Netlify)
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    
    // 3. Try Vite env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    
    return '';
};

const getAi = () => {
    const key = getApiKey();
    if(!key) {
        console.warn("SYSTEM WARNING: API Key not detected. Switching to Offline/Fallback protocols.");
        return null;
    }
    return new GoogleGenAI({ apiKey: key });
};

// Helper to clean JSON string from Markdown code blocks
const cleanJson = (text: string): string => {
    if (!text) return "{}";
    let cleaned = text.trim();
    // Remove ```json and ```
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
    }
    return cleaned.trim();
};

// --- OFFLINE FALLBACK GENERATOR ---
const generateOfflineWorkout = (
    muscles: MuscleGroup[], 
    level: number, 
    mode: 'hypertrophy' | 'strength'
): WorkoutPlan => {
    const isStrength = mode === 'strength';
    const exercises: Exercise[] = [];

    muscles.forEach((muscle, index) => {
        let name = "Exercício Padrão";
        let sets = isStrength ? 5 : 4;
        let reps = isStrength ? "3-5" : "8-12";
        
        switch(muscle) {
            case 'chest': name = index === 0 ? "Supino Reto (Barra)" : "Crucifixo Inclinado"; break;
            case 'back': name = index === 0 ? "Levantamento Terra" : "Puxada Frontal"; break;
            case 'legs': name = index === 0 ? "Agachamento Livre" : "Leg Press 45"; break;
            case 'shoulders': name = "Desenvolvimento Militar"; break;
            case 'arms': name = "Rosca Direta + Tríceps Testa"; break;
            case 'core': name = "Prancha Abdominal"; reps = "Falha"; break;
        }

        exercises.push({
            name: `${name} [OFFLINE]`,
            sets: sets,
            reps: reps,
            restTime: isStrength ? "3min" : "90s",
            difficulty: "Normal",
            technicalTips: "Conexão mente-músculo. Controle a fase excêntrica.",
            notes: "Protocolo de emergência ativado.",
            grip: "Normal"
        });
    });

    return {
        id: `offline-${Date.now()}`,
        title: `TREINO DE EMERGÊNCIA: ${muscles.join(' + ').toUpperCase()}`,
        targetMuscles: muscles,
        xpReward: 150 + (level * 10),
        estimatedDuration: "45-60 min",
        mobilityRoutine: [
            {
                name: "Rotação Articular",
                duration: "1 min",
                description: "Gire as articulações alvo suavemente para lubrificação.",
                benefit: "Preparação articular."
            },
            {
                name: "Alongamento Dinâmico",
                duration: "2 min",
                description: "Movimentos balísticos controlados.",
                benefit: "Ativação muscular."
            }
        ],
        exercises: exercises
    };
};

/**
 * Generates a structured workout plan.
 */
export const generateWorkout = async (
  muscles: MuscleGroup[],
  level: number,
  frequency: TrainingFrequency = '3x_week',
  gender: 'male' | 'female' = 'male',
  mode: 'hypertrophy' | 'strength' = 'hypertrophy',
  volumeType: VolumeType = 'system_auto',
  preferredDays: string[] = []
): Promise<WorkoutPlan | null> => {
  try {
    const ai = getAi();
    
    // FALLBACK IF NO AI CLIENT
    if (!ai) {
        return generateOfflineWorkout(muscles, level, mode);
    }

    let freqText = "";
    switch (frequency) {
        case 'every_other_day': freqText = "Dia Sim, Dia Não."; break;
        case '3x_week': freqText = "3 Vezes por Semana."; break;
        case 'system_auto': freqText = "A critério do Sistema."; break;
        case 'custom_split': freqText = `Dias Fixos: ${preferredDays.join(', ')}.`; break;
    }

    if (preferredDays.length > 0) {
        freqText += ` (Agenda Definida: ${preferredDays.join(', ')}).`;
    }

    let systemInstruction = SYSTEM_PROMPTS.WORKOUT_GEN;
    let modeText = "Foco em HIPERTROFIA.";
    let volumeInstruction = "";

    switch(volumeType) {
        case 'low_volume': volumeInstruction = "BAIXO VOLUME (HIT)."; break;
        case 'high_volume': volumeInstruction = "ALTO VOLUME (Pump)."; break;
        case 'system_auto': volumeInstruction = "VOLUME OTIMIZADO."; break;
    }

    if (mode === 'strength') {
        systemInstruction = SYSTEM_PROMPTS.WORKOUT_STRENGTH;
        modeText = "MODO FORÇA (STRENGTH MODE).";
    }

    const prompt = `
    Crie um treino OTIMIZADO para Nível ${level}.
    Gênero: ${gender === 'female' ? 'FEMININO' : 'MASCULINO'}.
    Alvo: ${muscles.join(', ')}.
    Modo: ${modeText}
    Volume: ${volumeInstruction}
    
    INSTRUÇÕES:
    1. Fase 1: MOBILIDADE (3 exercícios).
    2. Fase 2: MUSCULAÇÃO.
    `;

    try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                xpReward: { type: Type.NUMBER },
                estimatedDuration: { type: Type.STRING },
                mobilityRoutine: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            duration: { type: Type.STRING },
                            description: { type: Type.STRING },
                            benefit: { type: Type.STRING }
                        },
                        required: ["name", "duration", "description", "benefit"]
                    }
                },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      sets: { type: Type.NUMBER },
                      reps: { type: Type.STRING },
                      restTime: { type: Type.STRING },
                      grip: { type: Type.STRING },
                      notes: { type: Type.STRING },
                      technicalTips: { type: Type.STRING },
                      difficulty: { type: Type.STRING, enum: ["Normal", "Hard", "Hell"] }
                    },
                    required: ["name", "sets", "reps", "restTime", "difficulty", "technicalTips", "grip"]
                  }
                }
              },
              required: ["title", "xpReward", "estimatedDuration", "mobilityRoutine", "exercises"]
            }
          }
        });

        if (response.text) {
          const cleanedText = cleanJson(response.text);
          let data;
          try {
             data = JSON.parse(cleanedText);
          } catch(e) {
             throw new Error("JSON Parse Error");
          }
          
          // STRICT VALIDATION & SANITIZATION
          // Prevents crashes by ensuring structure is valid
          if (!data || typeof data !== 'object') {
              throw new Error("Invalid AI Response structure");
          }

          // Ensure exercises is array
          if (!Array.isArray(data.exercises)) {
              throw new Error("Missing exercises array");
          }

          // Filter out nulls or malformed exercises
          data.exercises = data.exercises.filter((e: any) => e && typeof e === 'object' && e.name);

          if (data.exercises.length === 0) {
               throw new Error("No valid exercises returned");
          }

          // Ensure mobilityRoutine is array (safe fallback)
          if (!Array.isArray(data.mobilityRoutine)) {
             data.mobilityRoutine = [];
          }
          data.mobilityRoutine = data.mobilityRoutine.filter((m: any) => m && typeof m === 'object');

          return { 
              ...data, 
              id: Date.now().toString(), 
              targetMuscles: muscles,
              suggestedSchedule: preferredDays 
          };
        }
    } catch (apiError) {
        console.error("AI API Error (Fallback triggered):", apiError);
        // Fallback on API failure
        return generateOfflineWorkout(muscles, level, mode);
    }
    
    return generateOfflineWorkout(muscles, level, mode);

  } catch (error) {
    console.error("System Error [Generation]:", error);
    return generateOfflineWorkout(muscles, level, mode);
  }
};

/**
 * Fetch alternatives for a specific exercise to allow swapping.
 */
export const getExerciseAlternatives = async (
    currentExercise: string, 
    muscle: string
): Promise<Exercise[]> => {
    try {
        const ai = getAi();
        if (!ai) return [];

        const prompt = `Substitua "${currentExercise}" (${muscle}). 4 opções. JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        alternatives: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    sets: { type: Type.NUMBER },
                                    reps: { type: Type.STRING },
                                    restTime: { type: Type.STRING },
                                    grip: { type: Type.STRING },
                                    notes: { type: Type.STRING },
                                    technicalTips: { type: Type.STRING },
                                    difficulty: { type: Type.STRING, enum: ["Normal", "Hard", "Hell"] }
                                },
                                required: ["name", "sets", "reps", "restTime", "difficulty", "technicalTips", "grip"]
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
             const cleanedText = cleanJson(response.text);
             const data = JSON.parse(cleanedText);
             return data.alternatives || [];
        }
        return [];
    } catch (e) {
        console.error("Error swapping", e);
        return [];
    }
}

/**
 * Generate a visualization of a goal or exercise.
 */
export const visualizeGoal = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAi();
    if (!ai) return null;

    const enhancedPrompt = `
      Technical fitness illustration of: ${prompt}.
      Layout: Split-panel composition (Side-by-side).
      Left Panel: The STARTING position.
      Right Panel: The ENDING position.
      Style: "Solo Leveling" System UI holographic blueprint. Dark background, Neon Blue wireframe.
      Details: Muscle groups highlighted RED.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("System Error [Image Gen]:", error);
    return null;
  }
};

/**
 * Chat with the System Intelligence.
 */
export const chatWithSystem = async (message: string, history: {role: string, parts: {text: string}[]}[] = []): Promise<string> => {
  try {
    const ai = getAi();
    if (!ai) return "SISTEMA OFFLINE. Verifique a conexão com a API.";

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_PROMPTS.COACH,
      },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Sem resposta do Sistema.";
  } catch (error) {
    console.error("System Error [Chat]:", error);
    return "Erro: O Sistema não pode processar a solicitação.";
  }
};

/**
 * Analyze an image (Physique or Equipment).
 */
export const analyzeImage = async (base64Image: string, promptText: string): Promise<string> => {
  try {
    const ai = getAi();
    if (!ai) return "SISTEMA OFFLINE. Visão indisponível.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: promptText }
        ]
      },
      config: {
        systemInstruction: "Analista de físico e postura de elite."
      }
    });
    return response.text || "Falha na Análise.";
  } catch (error) {
    console.error("System Error [Vision]:", error);
    return "Erro: Falha na análise de imagem.";
  }
};

/**
 * Fetches detailed technical execution steps for a specific skill.
 */
export const getSkillDetails = async (skillName: string): Promise<{ description: string, execution: string[], technicalTips: string } | null> => {
  try {
    const ai = getAi();
    if (!ai) return null;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Análise técnica: ${skillName}.`,
      config: {
        systemInstruction: SYSTEM_PROMPTS.SKILL_ANALYSIS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             description: { type: Type.STRING },
             execution: { type: Type.ARRAY, items: { type: Type.STRING } },
             technicalTips: { type: Type.STRING }
          },
          required: ["description", "execution", "technicalTips"]
        }
      }
    });

    if (response.text) {
      const cleaned = cleanJson(response.text);
      return JSON.parse(cleaned);
    }
    return null;
  } catch (error) {
    console.error("System Error [Skill Details]:", error);
    return null;
  }
}

/**
 * Search for specific fitness knowledge using Grounding.
 */
export const searchFitnessData = async (query: string): Promise<{text: string, sources: any[]}> => {
  try {
    const ai = getAi();
    if (!ai) return { text: "SISTEMA OFFLINE.", sources: [] };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text || "Nenhum dado encontrado.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = chunks.filter((c: any) => c.web).map((c: any) => ({
      title: c.web.title,
      uri: c.web.uri
    }));

    return { text, sources };
  } catch (error) {
     console.error("System Error [Search]:", error);
     return { text: "Funcionalidade de busca indisponível.", sources: [] };
  }
};