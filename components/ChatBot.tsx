import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { User, Collection, PaymentStatuses, TreasurerProfile } from '../types';
import ChatMessage from './ChatMessage';
import { AiIcon, BoltIcon, CpuChipIcon, GlobeAltIcon, CheckIcon, TrashIcon } from './Icons';

type ChatMode = 'fast' | 'thinking' | 'search';

interface ChatBotProps {
    onClose: () => void;
    users: User[];
    collections: Collection[];
    paymentStatuses: PaymentStatuses;
    treasurerProfile: TreasurerProfile;
}

const modeConfig: { [key in ChatMode]: { icon: React.FC<any>; title: string; description: string; color: string; } } = {
    fast: {
        icon: BoltIcon,
        title: 'Fast',
        description: 'For quick, low-latency answers.',
        color: 'text-yellow-500',
    },
    thinking: {
        icon: CpuChipIcon,
        title: 'Thinking',
        description: 'For complex reasoning tasks.',
        color: 'text-purple-500',
    },
    search: {
        icon: GlobeAltIcon,
        title: 'Search',
        description: 'Grounded with Google Search.',
        color: 'text-blue-500',
    },
};

const ChatBot: React.FC<ChatBotProps> = ({ onClose, users, collections, paymentStatuses, treasurerProfile }) => {
    // Define the welcome message as a constant
    const welcomeMessage = useMemo(() => ({
        role: 'model' as const,
        text: `Hello! I'm Sparky, your AI assistant. I have access to all your treasurer data.\n\nYou can ask me things like:\n- "Who hasn't paid for the field trip?"\n- "How much is left to collect for the class fund?"\n- "What's the latest news on financial regulations for student groups?" (This will use Google Search mode)\n\nHow can I help you today?`
    }), []);

    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; sources?: any[] }[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<ChatMode>('fast');
    const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
    
    const chatSessionRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const modeSelectorRef = useRef<HTMLDivElement>(null);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

    // Load chat history or set welcome message on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('aiChatHistory');
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                    setMessages(parsedHistory);
                    return;
                }
            }
        } catch (error) {
            console.error("Failed to parse chat history from localStorage", error);
            localStorage.removeItem('aiChatHistory');
        }
        // If no valid history, set the welcome message.
        setMessages([welcomeMessage]);
    }, [welcomeMessage]);

    // Save chat history to localStorage, but not the initial welcome message
    useEffect(() => {
        const isJustWelcomeMessage = messages.length === 1 && messages[0] === welcomeMessage;
        if (messages.length > 0 && !isJustWelcomeMessage) {
            localStorage.setItem('aiChatHistory', JSON.stringify(messages));
        } else {
            localStorage.removeItem('aiChatHistory');
        }
    }, [messages, welcomeMessage]);

    const systemInstruction = useMemo(() => {
        const summarizedUsers = users.map(u => ({ id: u.id, name: u.name }));
        const summarizedCollections = collections.map(c => ({ id: c.id, name: c.name, amountPerUser: c.amountPerUser, deadline: c.deadline, isRemitted: !!c.remittanceDetails?.isRemitted }));
        
        const activeCollectionIds = new Set(collections.filter(c => !c.remittanceDetails?.isRemitted).map(c => c.id));
        const summarizedPaymentStatuses: { [key: string]: any } = {};
        for (const userId in paymentStatuses) {
            summarizedPaymentStatuses[userId] = {};
            for (const collectionId in paymentStatuses[userId]) {
                if (activeCollectionIds.has(collectionId)) {
                    summarizedPaymentStatuses[userId][collectionId] = paymentStatuses[userId][collectionId];
                }
            }
        }

        const context = {
            currentDate: new Date().toLocaleDateString(),
            users: summarizedUsers,
            collections: summarizedCollections,
            paymentStatuses: summarizedPaymentStatuses,
        };

        return `You are a helpful and friendly AI assistant for a class treasurer. Your name is Sparky. Use the provided JSON data to answer questions about collections, payments, and students. Be concise and clear. Format your answers using Markdown. Do not mention the JSON data source unless asked.
        
        Context:
        ${JSON.stringify(context, null, 2)}`;
    }, [users, collections, paymentStatuses]);
    

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target as Node)) {
                setIsModeSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClearHistory = () => {
        setMessages([welcomeMessage]);
    };

    const handleSendMessage = async (prompt: string) => {
        if (!prompt.trim() || isLoading) return;

        setError(null);
        setIsLoading(true);
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', text: prompt }]);

        try {
            if (!chatSessionRef.current || chatSessionRef.current.model !== chatMode) {
                let model: string;
                let config: any = { systemInstruction };

                switch (chatMode) {
                    case 'thinking':
                        model = 'gemini-2.5-pro';
                        config.thinkingConfig = { thinkingBudget: 32768 };
                        break;
                    case 'search':
                        model = 'gemini-2.5-flash';
                        config.tools = [{ googleSearch: {} }];
                        break;
                    case 'fast':
                    default:
                        model = 'gemini-flash-lite-latest';
                        break;
                }
                chatSessionRef.current = ai.chats.create({ model, config });
            }
            
            if (chatMode === 'fast') {
                const stream = await chatSessionRef.current.sendMessageStream({ message: prompt });
                
                let currentText = '';
                setMessages(prev => [...prev, { role: 'model', text: '' }]);
                for await (const chunk of stream) {
                    currentText += chunk.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = { role: 'model', text: currentText };
                        return newMessages;
                    });
                }
            } else {
                const response = await chatSessionRef.current.sendMessage({ message: prompt });
                const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                setMessages(prev => [...prev, { role: 'model', text: response.text, sources: sources }]);
            }

        } catch (e: any) {
            console.error(e);
            setError(e.message || 'An error occurred while fetching the response.');
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const CurrentModeIcon = modeConfig[chatMode].icon;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white w-full h-full md:w-[700px] md:h-[80vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center">
                        <AiIcon className="h-8 w-8 mr-2 drop-shadow-sm" />
                        <h2 className="text-xl font-bold text-stone-800">AI Assistant</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleClearHistory} 
                            className="text-stone-500 hover:text-stone-800 p-2 rounded-full hover:bg-stone-200/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Clear chat history"
                            disabled={messages.length <= 1 && messages[0] === welcomeMessage}
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                        <button onClick={onClose} className="text-stone-500 hover:text-stone-800 p-2 rounded-full hover:bg-stone-200/50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-grow p-6 overflow-y-auto bg-stone-50">
                    <div className="space-y-6">
                        {messages.map((msg, index) => <ChatMessage key={index} message={msg} userAvatarUrl={msg.role === 'user' ? treasurerProfile.avatarUrl : undefined} />)}
                        {isLoading && <ChatMessage message={{ role: 'model', text: '...' }} isLoading={true} />}
                        {error && <div className="text-sm text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">{error}</div>}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Form */}
                <footer ref={modeSelectorRef} className="relative p-4 border-t border-stone-200 bg-white flex-shrink-0">
                    {isModeSelectorOpen && (
                        <div 
                            className="absolute bottom-full left-4 mb-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 animate-fade-in" 
                            style={{animationDuration: '150ms'}}
                            aria-label="Chat mode selector"
                        >
                            <ul className="space-y-1">
                                {(['fast', 'thinking', 'search'] as ChatMode[]).map(mode => {
                                    const { icon: Icon, title, description, color } = modeConfig[mode];
                                    const isSelected = chatMode === mode;
                                    return (
                                        <li key={mode}>
                                            <button 
                                                onClick={() => { setChatMode(mode); setIsModeSelectorOpen(false); }}
                                                className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-stone-100'}`}
                                            >
                                                <Icon className={`w-6 h-6 flex-shrink-0 ${color}`} />
                                                <div className="flex-grow">
                                                    <p className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-stone-800'}`}>{title}</p>
                                                    <p className="text-xs text-stone-500">{description}</p>
                                                </div>
                                                {isSelected && <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }} className="relative">
                        <button 
                            type="button" 
                            onClick={() => setIsModeSelectorOpen(prev => !prev)}
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-sm font-semibold text-stone-700 transition-colors"
                            aria-label={`Change chat mode. Current mode: ${chatMode}`}
                        >
                            <CurrentModeIcon className={`w-4 h-4 ${modeConfig[chatMode].color}`} />
                            <span className="capitalize">{chatMode}</span>
                        </button>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask Sparky..."
                            className="w-full pl-32 pr-12 py-3.5 border border-stone-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
                            disabled={isLoading}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                            <button type="submit" disabled={isLoading || !inputValue.trim()} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 3.105a1.5 1.5 0 011.823.19l.003.002 10.94 6.316a1.5 1.5 0 010 2.688L4.93 18.395a1.5 1.5 0 01-2.025-.298l-.004-.007-.002-.003a1.5 1.5 0 01.19-1.823L6.115 11l-3.3-1.905a1.5 1.5 0 01.29-2.788l.002-.002.002-.002z" /></svg>
                            </button>
                        </div>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default ChatBot;