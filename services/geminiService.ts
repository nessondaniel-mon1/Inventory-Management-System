import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import type { ChatMessage, Sale, Product, ReorderSuggestion, ForecastDataPoint, SegmentedCustomer, ExtractedData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const flashModel = 'gemini-2.5-flash';
const proModel = 'gemini-2.5-pro'; // Use pro for more complex analysis

// --- CHAT FUNCTIONALITY ---
let chat: Chat | null = null;

const getChat = (): Chat => {
    if (!chat) {
        chat = ai.chats.create({
            model: flashModel,
            history: [],
            config: {
                systemInstruction: 'You are a helpful assistant for an inventory management system. Your responses should be concise, accurate, and presented in clear Markdown format. When asked for data summaries or lists, use tables or bullet points for readability. Analyze the provided JSON context to answer user questions about their inventory, sales, or customers.',
            },
        });
    }
    return chat;
}

export const streamChatResponse = async (message: string, context?: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const currentChat = getChat();
    
    const fullMessage = context
        ? `Here is the current business data summary in JSON format. Use this to answer my question:\n\n${context}\n\nQuestion: ${message}`
        : message;

    const response = await currentChat.sendMessageStream({ message: fullMessage });
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

// --- DATA EXTRACTION ---
export const analyzeFileForDataExtraction = async (base64Data: string, mimeType: string): Promise<ExtractedData> => {
    try {
        const filePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Data,
            },
        };

        const prompt = `
            Analyze the provided file (which could be a receipt, invoice, product list, or other business document)
            and extract all relevant information for an inventory management system.
            Identify any products, suppliers, customers, and bills.
            - For products, extract name, price, and stock quantity.
            - For suppliers, extract name, contact person, phone number, and a list of items they supply if available.
            - For customers, extract name, phone number, and address. Assume their type is 'credit' unless specified otherwise.
            - For bills, extract the vendor, a description, the total amount, and the due date. Assume the category is 'Other' and it's not recurring unless specified.

            If a required field is missing for an item, omit that entire item from the array.
            Return ONLY the JSON object that adheres to the provided schema. Do not include any conversational text or markdown.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                products: {
                    type: Type.ARRAY,
                    description: "List of products found in the document.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Product name." },
                            price: { type: Type.NUMBER, description: "Price per unit." },
                            stock: { type: Type.INTEGER, description: "Available quantity or stock." },
                        },
                        required: ["name", "price", "stock"]
                    }
                },
                suppliers: {
                    type: Type.ARRAY,
                    description: "List of suppliers found in the document.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Supplier's company name." },
                            contactPerson: { type: Type.STRING, description: "Name of the contact person." },
                            phone: { type: Type.STRING, description: "Supplier's phone number." },
                            itemsSupplied: {
                                type: Type.ARRAY,
                                description: "An array of product names supplied by this vendor.",
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["name", "contactPerson", "phone"]
                    }
                },
                customers: {
                    type: Type.ARRAY,
                    description: "List of customers found in the document.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Customer's name." },
                            type: { type: Type.STRING, description: "Customer type, either 'credit' or 'invoice'." },
                            phone: { type: Type.STRING, description: "Customer's phone number." },
                            address: { type: Type.STRING, description: "Customer's address." },
                        },
                        required: ["name", "phone", "address", "type"]
                    }
                },
                bills: {
                    type: Type.ARRAY,
                    description: "List of bills or expenses found in the document.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            vendor: { type: Type.STRING, description: "The name of the vendor or company the bill is from." },
                            description: { type: Type.STRING, description: "A brief description of the bill." },
                            amount: { type: Type.NUMBER, description: "The total amount due." },
                            dueDate: { type: Type.STRING, description: "The due date in YYYY-MM-DD format." },
                            category: { type: Type.STRING, description: "Category of the bill (e.g., Utilities, Rent, Supplies)." },
                            isRecurring: { type: Type.BOOLEAN, description: "Whether the bill is recurring." }
                        },
                        required: ["vendor", "description", "amount", "dueDate"]
                    }
                }
            }
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: proModel,
            contents: { parts: [{ text: prompt }, filePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ExtractedData;

    } catch (error) {
        console.error("Error analyzing file for data extraction:", error);
        return {};
    }
};


// --- ANALYTICS FUNCTIONS ---

export const generateForecast = async (historicalSales: Sale[], daysToForecast: number): Promise<{ sales: number[], profit: number[] }> => {
    try {
        const prompt = `
            Analyze the following historical sales data (JSON format) for the last 90 days.
            The data includes total sale amount and profit for each transaction.
            Identify trends, weekly patterns, and overall velocity.
            Based on your analysis, provide a daily sales and profit forecast for the next ${daysToForecast} days.
            Return ONLY a JSON object with two keys: "sales" and "profit", where each key holds an array of ${daysToForecast} numbers representing the daily forecast. Do not include any other text or markdown.

            Historical Data:
            ${JSON.stringify(historicalSales.map(s => ({ date: s.date, total: s.total, profit: s.profit })))}
        `;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                sales: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: `An array of exactly ${daysToForecast} numbers for the sales forecast.`
                },
                profit: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: `An array of exactly ${daysToForecast} numbers for the profit forecast.`
                }
            },
            required: ["sales", "profit"]
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: proModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonText = response.text.trim();
        
        let parsableText = jsonText;
        const jsonMatch = jsonText.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            parsableText = jsonMatch[2];
        }

        const parsed = JSON.parse(parsableText);
        
        if (
            parsed &&
            typeof parsed === 'object' &&
            Array.isArray(parsed.sales) && 
            Array.isArray(parsed.profit) &&
            parsed.sales.length === daysToForecast &&
            parsed.profit.length === daysToForecast
        ) {
            return parsed;
        }

        console.error("Unexpected AI response format:", JSON.stringify(parsed, null, 2));
        throw new Error("Invalid format received from AI");

    } catch (error) {
        console.error("Error generating forecast:", error);
        const emptyForecast = Array(daysToForecast).fill(0);
        return { sales: emptyForecast, profit: emptyForecast };
    }
};

export const generateReorderSuggestions = async (products: Product[], sales: Sale[]): Promise<ReorderSuggestion[]> => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSales = sales.filter(s => new Date(s.date) >= thirtyDaysAgo);

        const prompt = `
            You are an expert inventory management assistant.
            Analyze the provided list of products (with their current stock) and recent sales data from the last 30 days.
            For each product, calculate its daily sales velocity.
            Based on the velocity and current stock, predict how many days of stock are remaining.
            Suggest a reasonable reorder quantity to maintain a 30-day supply.
            Focus on items with less than 15 days of stock remaining or items with low stock (under 20 units).
            Return a JSON array of objects, where each object represents a product needing reordering.

            Products Data:
            ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, stock: p.stock })))}

            Recent Sales Data (last 30 days):
            ${JSON.stringify(recentSales.flatMap(s => s.items.map(i => ({ productId: i.productId, quantity: i.quantity, date: s.date }))))}
        `;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    productId: { type: Type.STRING },
                    productName: { type: Type.STRING },
                    currentStock: { type: Type.INTEGER },
                    predictedDaysRemaining: { type: Type.INTEGER },
                    suggestedReorderQuantity: { type: Type.INTEGER }
                },
                required: ["productId", "productName", "currentStock", "predictedDaysRemaining", "suggestedReorderQuantity"]
            }
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: proModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ReorderSuggestion[];

    } catch (error) {
        console.error("Error generating reorder suggestions:", error);
        return [];
    }
};


export const generateCustomerSummary = async (
    vips: SegmentedCustomer[],
    loyals: SegmentedCustomer[],
    atRisk: SegmentedCustomer[]
): Promise<string> => {
    try {
        const prompt = `
            You are a business analyst. I will provide you with lists of customer segments.
            - VIP Customers (top spenders)
            - Loyal Customers (most frequent buyers)
            - At-Risk Customers (haven't purchased recently)

            Please provide a brief, actionable summary (2-3 sentences) for the business owner. Highlight key customers and suggest strategies to engage these segments.
            Keep it friendly and encouraging.

            Data:
            VIPs: ${JSON.stringify(vips)}
            Loyals: ${JSON.stringify(loyals)}
            At-Risk: ${JSON.stringify(atRisk)}
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: flashModel,
            contents: prompt,
        });

        return response.text;

    } catch (error) {
        console.error("Error generating customer summary:", error);
        return "Could not generate a summary at this time.";
    }
};

export const generateReport = async (prompt: string, context: object): Promise<string> => {
    try {
        const fullPrompt = `
            You are a data analyst for an inventory management system.
            A user has requested a report. Analyze the following comprehensive business data provided in JSON format to fulfill their request.
            Generate a clear, well-structured report using Markdown formatting. Use tables for tabular data, lists for itemizations, and bold text for headers and important figures.
            Respond ONLY with the Markdown report. Do not include any conversational text, apologies, or explanations outside of the report itself.

            Business Data:
            ${JSON.stringify(context)}

            User's Request:
            "${prompt}"
        `;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: proModel,
            contents: fullPrompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error generating report:", error);
        return "Sorry, an error occurred while generating the report. Please try a different query.";
    }
};