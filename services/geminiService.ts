import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPTS } from "../constants";
import { WorkoutPlan, MuscleGroup, TrainingFrequency, Exercise, VolumeType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a structured workout plan.
 * Handles Hypertrophy, Strength Mode, Volume preferences, and Preferred Days.
 * Now includes Mobility Routine and Variety logic.
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
    
    // Volume Logic
    let volumeInstruction = "";
    switch(volumeType) {
        case 'low_volume':
            volumeInstruction = "BAIXO VOLUME (Low Volume / HIT). Mínimo de séries, falha total.";
            break;
        case 'high_volume':
            volumeInstruction = "ALTO VOLUME (High Volume). Maior número de séries, pump.";
            break;
        case 'system_auto':
            volumeInstruction = "VOLUME OTIMIZADO (Equilíbrio do Sistema).";
            break;
    }

    if (mode === 'strength') {
        systemInstruction = SYSTEM_PROMPTS.WORKOUT_STRENGTH;
        modeText = "MODO FORÇA (STRENGTH MODE). Ciclo de 3 semanas.";
        volumeInstruction += " (Adapte para Força).";
    }

    const prompt = `
    Crie um treino OTIMIZADO para Nível ${level}.
    Gênero: ${gender === 'female' ? 'FEMININO (Foco Inferiores/Definição)' : 'MASCULINO'}.
    Alvo: ${muscles.join(', ')}.
    Agenda: ${freqText}
    Modo: ${modeText}
    Volume: ${volumeInstruction}
    
    INSTRUÇÕES ESPECIAIS:
    1. Fase 1: MOBILIDADE (Obrigatória). Gere 3 exercícios de mobilidade específicos para os músculos alvo. Devem ser rápidos e preparatórios.
    2. Fase 2: MUSCULAÇÃO. Varie os exercícios (Evite repetir apenas o básico se houver variações melhores para o nível).
    3. Descrição da Mobilidade: Deve ser visual e fácil de entender para gerar imagem depois.
    `;

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
      const data = JSON.parse(response.text);
      return { 
          ...data, 
          id: Date.now().toString(), 
          targetMuscles: muscles,
          suggestedSchedule: preferredDays 
      };
    }
    return null;
  } catch (error) {
    console.error("System Error [Generation]:", error);
    return null;
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
        const prompt = `
        Substitua o exercício "${currentExercise}" (Alvo: ${muscle}).
        Gere 4 alternativas biomecanicamente semelhantes.
        Retorne JSON.
        `;

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
             const data = JSON.parse(response.text);
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
 * Updated to show two-state (start/end) positions.
 */
export const visualizeGoal = async (prompt: string): Promise<string | null> => {
  try {
    // Enhanced prompt for two-state visualization
    const enhancedPrompt = `
      Technical fitness illustration of: ${prompt}.
      Layout: Split-panel composition (Side-by-side).
      Left Panel: The STARTING position of the exercise/stretch.
      Right Panel: The ENDING position (peak contraction/extension) of the exercise/stretch.
      Style: "Solo Leveling" System Window UI holographic blueprint. Dark background, Neon Blue wireframe character.
      Details: Muscle groups worked highlighted in RED on both panels.
      Accuracy: Anatomically correct posture.
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
    
    // Find image part
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
 * Chat with the System Intelligence (Pro Model for reasoning).
 */
export const chatWithSystem = async (message: string, history: {role: string, parts: {text: string}[]}[] = []): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_PROMPTS.COACH,
      },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Sistema Offline. Conexão interrompida.";
  } catch (error) {
    console.error("System Error [Chat]:", error);
    return "Erro: O Sistema não pode processar a solicitação.";
  }
};

/**
 * Analyze an image (Physique or Equipment) using Vision (Pro Model).
 */
export const analyzeImage = async (base64Image: string, promptText: string): Promise<string> => {
  try {
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
        systemInstruction: "Você é um analista de físico e postura de elite dentro do 'Sistema'. Analise a imagem com honestidade brutal e forneça ajustes de status ou correções de postura. Responda em Português."
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Análise técnica da habilidade de Calistenia: ${skillName}. Seja extremamente detalhado sobre a forma.`,
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
      return JSON.parse(response.text);
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text || "Nenhum dado encontrado.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Extract web sources
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