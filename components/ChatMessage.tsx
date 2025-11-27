import React, { useEffect, useRef } from 'react';
import { AiIcon, UserCircleIcon } from './Icons';

declare const marked: any;
declare const DOMPurify: any;

interface ChatMessageProps {
    message: {
        role: 'user' | 'model';
        text: string;
        sources?: any[];
    };
    isLoading?: boolean;
    userAvatarUrl?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading, userAvatarUrl }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const isUser = message.role === 'user';

    useEffect(() => {
        if (!isUser && contentRef.current && message.text) {
            const rawHtml = marked.parse(message.text);
            contentRef.current.innerHTML = DOMPurify.sanitize(rawHtml);
        }
    }, [isUser, message.text]);

    const bubbleClasses = isUser
        ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-br-none shadow-md'
        : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none shadow-sm';

    const containerClasses = isUser ? 'justify-end' : 'justify-start';

    return (
        <div className={`flex items-end gap-3 ${containerClasses}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                    <AiIcon className="w-6 h-6 drop-shadow-sm" />
                </div>
            )}
            <div className={`max-w-md w-fit`}>
                <div className={`px-5 py-3.5 rounded-2xl ${bubbleClasses}`}>
                    {isUser ? (
                        <p className="whitespace-pre-wrap font-medium">{message.text}</p>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center space-x-1.5 p-1">
                            <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                            <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                    ) : (
                        <div ref={contentRef} className="prose prose-sm max-w-none prose-stone"></div>
                    )}
                </div>
                {message.sources && message.sources.length > 0 && (
                     <div className="mt-2 text-xs text-stone-500 bg-white p-2 rounded-lg border border-stone-100 shadow-sm inline-block">
                        <h4 className="font-bold mb-1 text-stone-600 uppercase tracking-wider text-[10px]">Sources</h4>
                        <ul className="space-y-1">
                            {message.sources.map((source, index) => (
                                <li key={index} className="flex items-center">
                                    <a 
                                        href={source.web.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline truncate max-w-[200px] block"
                                    >
                                        {source.web.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {isUser && (
                 userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="User" className="flex-shrink-0 w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
                        <UserCircleIcon className="w-5 h-5 text-stone-600" />
                    </div>
                )
            )}
        </div>
    );
};

export default ChatMessage;