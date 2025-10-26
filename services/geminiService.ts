import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import type { ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const flashModel = 'gemini-2.5-flash';
const proModel = 'gemini-2.5-pro';

// --- CHAT FUNCTIONALITY ---
let chat: Chat | null = null;

const getChat = (): Chat => {
    if (!chat) {
        chat = ai.chats.create({
            model: flashModel,
            history: [],
             config: {
                systemInstruction: 'You are a helpful assistant for an inventory management system. Answer questions concisely and accurately based on the user query.',
            },
        });
    }
    return chat;
}

export const streamChatResponse = async (message: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const currentChat = getChat();
    const response = await currentChat.sendMessageStream({ message });
    return response;
};


// --- IMAGE ANALYSIS ---
export const analyzeImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Image,
            },
        };
        const textPart = { text: prompt };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: flashModel,
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        return "Sorry, I couldn't analyze the image. Please try again.";
    }
};


// --- COMPLEX QUERY (THINKING MODE) ---
export const performComplexQuery = async (prompt: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: proModel,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error with complex query:", error);
        return "Sorry, I encountered an error with that complex query. Please try again.";
    }
};