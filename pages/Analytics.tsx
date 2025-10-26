import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import { streamChatResponse, analyzeImage, performComplexQuery } from '../services/geminiService';
import type { ChatMessage } from '../types';

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.94 14.53a2.4 2.4 0 0 1 0-3.06,2.4 2.4 0 0 1 3.06 0,2.4 2.4 0 0 1 0 3.06,2.4 2.4 0 0 1-3.06 0Z"/><path d="M12 3v2"/><path d="m21.19 4.81-1.42 1.42"/><path d="M21 12h-2"/><path d="m19.77 19.77-1.42-1.42"/><path d="M12 21v-2"/><path d="m4.23 19.77 1.42-1.42"/><path d="M3 12h2"/><path d="m4.81 4.81 1.42 1.42"/></svg>
);

const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);


const Analytics: React.FC = () => {
    // Chatbot state
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Image analysis state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageResult, setImageResult] = useState('');
    const [isImageLoading, setIsImageLoading] = useState(false);
    
    // Complex query state
    const [complexPrompt, setComplexPrompt] = useState('');
    const [complexResult, setComplexResult] = useState('');
    const [isComplexLoading, setIsComplexLoading] = useState(false);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;
        
        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: chatInput }] };
        setChatHistory(prev => [...prev, newUserMessage]);
        setChatInput('');
        setIsChatLoading(true);

        const modelResponse: ChatMessage = { role: 'model', parts: [{ text: '' }] };
        setChatHistory(prev => [...prev, modelResponse]);

        try {
            const stream = await streamChatResponse(chatInput);
            let fullResponseText = '';
            for await (const chunk of stream) {
                fullResponseText += chunk.text;
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { role: 'model', parts: [{ text: fullResponseText }] };
                    return newHistory;
                });
            }
        } catch (error) {
            console.error(error);
             setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { role: 'model', parts: [{ text: 'Sorry, something went wrong.' }] };
                return newHistory;
            });
        } finally {
            setIsChatLoading(false);
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleImageAnalysis = async () => {
        if (!imageFile || !imagePrompt) return;
        setIsImageLoading(true);
        setImageResult('');

        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const result = await analyzeImage(base64String, imageFile.type, imagePrompt);
            setImageResult(result);
            setIsImageLoading(false);
        };
    };

    const handleComplexQuery = async () => {
        if (!complexPrompt) return;
        setIsComplexLoading(true);
        setComplexResult('');
        const result = await performComplexQuery(complexPrompt);
        setComplexResult(result);
        setIsComplexLoading(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="AI Assistant Chat" className="lg:col-span-2">
                <div className="flex flex-col h-[500px]">
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-md">
                         {chatHistory.length === 0 && <p className="text-center text-text-secondary">Ask me anything about your inventory or sales!</p>}
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white border'}`}>
                                    {msg.parts[0].text}
                                </div>
                            </div>
                        ))}
                         {isChatLoading && chatHistory[chatHistory.length - 1]?.role === 'model' && chatHistory[chatHistory.length - 1]?.parts[0]?.text.length === 0 && (
                            <div className="flex justify-start"><Spinner size="sm"/></div>
                        )}
                    </div>
                    <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                        <Input 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)} 
                            placeholder="e.g., Which product has the lowest stock?" 
                            className="flex-1"
                            disabled={isChatLoading}
                        />
                        <Button type="submit" disabled={isChatLoading}><SendIcon className="w-5 h-5"/></Button>
                    </form>
                </div>
            </Card>

            <Card title="Analyze Image">
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary">Upload an image of a product or inventory shelf to get AI-powered insights.</p>
                    <Input type="file" accept="image/*" onChange={handleImageChange} />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="max-h-60 rounded-md mx-auto" />}
                    <Input placeholder="e.g., Identify the products on this shelf." value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} />
                    <Button onClick={handleImageAnalysis} disabled={isImageLoading || !imageFile || !imagePrompt} className="w-full">
                        {isImageLoading ? <Spinner size="sm" /> : 'Analyze'}
                    </Button>
                    {imageResult && <div className="p-4 bg-gray-50 rounded-md border mt-4 whitespace-pre-wrap">{imageResult}</div>}
                </div>
            </Card>

            <Card title="Thinking Mode">
                 <div className="space-y-4">
                    <p className="text-sm text-text-secondary">Use this for complex queries that require deep reasoning, powered by Gemini 2.5 Pro.</p>
                    <textarea 
                        rows={5} 
                        className="w-full p-2 border border-border rounded-md focus:ring-primary focus:border-primary"
                        placeholder="e.g., Analyze my monthly sales data and suggest three strategies to improve profitability..."
                        value={complexPrompt}
                        onChange={e => setComplexPrompt(e.target.value)}
                    ></textarea>
                    <Button onClick={handleComplexQuery} disabled={isComplexLoading || !complexPrompt} className="w-full" leftIcon={<SparklesIcon className="w-5 h-5"/>}>
                        {isComplexLoading ? <Spinner size="sm" /> : 'Execute Complex Query'}
                    </Button>
                    {complexResult && <div className="p-4 bg-gray-50 rounded-md border mt-4 whitespace-pre-wrap">{complexResult}</div>}
                </div>
            </Card>
        </div>
    );
};

export default Analytics;