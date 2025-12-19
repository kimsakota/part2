
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TOEICQuestion, QuestionType } from "../types";

const API_KEY = process.env.API_KEY || "";

export const generateTOEICQuestions = async (count: number = 15): Promise<TOEICQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: `Generate exactly ${count} TOEIC Part 2 questions (ETS 2024 trends). 
    Focus on tricky responses. 
    Format: JSON array. 
    Explain in 1 short sentence.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: Object.values(QuestionType) },
            prompt: { type: Type.STRING },
            optionA: { type: Type.STRING },
            optionB: { type: Type.STRING },
            optionC: { type: Type.STRING },
            correctOption: { type: Type.STRING, enum: ['A', 'B', 'C'] },
            explanation: { type: Type.STRING },
            vietnameseTranslation: {
              type: Type.OBJECT,
              properties: {
                prompt: { type: Type.STRING },
                optionA: { type: Type.STRING },
                optionB: { type: Type.STRING },
                optionC: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["prompt", "optionA", "optionB", "optionC", "explanation"]
            }
          },
          required: ["id", "type", "prompt", "optionA", "optionB", "optionC", "correctOption", "explanation", "vietnameseTranslation"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse questions", error);
    return [];
  }
};

export const generateAudio = async (text: string, voice: string = 'Kore'): Promise<Uint8Array | null> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    // Nếu gặp lỗi quota, ném lỗi ra ngoài để App.tsx xử lý retry
    if (error instanceof Error && error.message.includes("quota")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    console.error("Audio generation failed", error);
    return null;
  }
};

export const decodeAudioDataCustom = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return audioBuffer;
};
