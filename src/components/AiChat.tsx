import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Icon } from './Icon';
import { marked } from 'marked';
import Prism from 'prismjs';

interface AiChatProps {
    history: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
    onPushCode: (code: string) => void;
}

const CodeBlock: React.FC<{ content: string; onPushCode: () => void }> = ({ content, onPushCode }) => {
    useEffect(() => {
        Prism.highlightAll();
    }, [content]);

    return (
        <div className="my-2 bg-slate-900 rounded-md border border-slate-700">
            <div className="flex justify-between items-center px-4 py-1 bg-slate-800 rounded-t-md">
                <span className="text-xs text-slate-400">xylon</span>
                <button onClick={onPushCode} className="text-xs flex items-center gap-1 hover:text-cyan-400">
                    <Icon name="pencil" className="h-3 w-3" /> Push to Editor
                </button>
            </div>
            <pre className="language-xylon p-4 text-sm overflow-x-auto">
                <code className="language-xylon">{content}</code>
            </pre>
        </div>
    );
};

const Message: React.FC<{ message: ChatMessage; onPushCode: (code: string) => void }> = ({ message, onPushCode }) => {
    if (message.role === 'tool') {
        return (
            <div className="flex items-center gap-3 my-2 text-xs text-slate-400 justify-center italic p-2 bg-slate-800/50 rounded-md">
                <Icon name="wrench" className="h-4 w-4 flex-shrink-0" />
                <pre className="whitespace-pre-wrap text-xs"><code>{message.content}</code></pre>
            </div>
        );
    }
    
    const isModel = message.role === 'model';

    const renderContent = () => {
        const parts = message.content.split(/(```xylon\n[\s\S]*?\n```)/g);
        
        return parts.map((part, index) => {
            const codeMatch = part.match(/```xylon\n([\s\S]*?)\n```/);
            if (codeMatch) {
                const code = codeMatch[1];
                return <CodeBlock key={index} content={code} onPushCode={() => onPushCode(code)} />;
            } else if (part.trim() !== '') {
                const html = marked(part);
                return <div key={index} className="prose prose-sm max-w-none prose-invert" dangerouslySetInnerHTML={{ __html: html as string }} />;
            }
            return null;
        });
    };

    return (
        <div className={`flex items-start gap-3 my-4 ${isModel ? '' : 'bg-slate-800/50 p-3 rounded-md'}`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isModel ? 'bg-cyan-600' : 'bg-slate-600'}`}>
                <Icon name={isModel ? "sparkles" : "user"} className="h-5 w-5" />
            </div>
            <div className="flex-grow pt-1">{renderContent()}</div>
        </div>
    );
};

const AiChat: React.FC<AiChatProps> = ({ history, isLoading, onSendMessage, onPushCode }) => {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="bg-slate-900 text-slate-300 h-full flex flex-col">
            <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto">
                {history.map((msg, index) => (
                    <Message key={index} message={msg} onPushCode={onPushCode} />
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3 my-4">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-cyan-600">
                             <Icon name="sparkles" className="h-5 w-5" />
                        </div>
                        <div className="flex-grow pt-1">
                            <span className="bg-slate-300 w-2 h-4 animate-pulse ml-1 inline-block"></span>
                        </div>
                    </div>
                )}
            </div>
            <form onSubmit={handleSubmit} className="flex-shrink-0 p-3 border-t border-slate-700 flex items-center gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI to write code or explain something..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white p-2 rounded-md"
                >
                    <Icon name="send" className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
};

export default AiChat;
