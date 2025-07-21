import React, { useState, useEffect } from 'react';

interface ErrorMessage {
    id: string;
    message: string;
    type?: 'error' | 'warning' | 'info';
}

interface ErrorMessagesProps {
    messages: ErrorMessage[];
    onDismiss: (id: string) => void;
    duration?: number;
}

export const ErrorMessages: React.FC<ErrorMessagesProps> = ({
    messages,
    onDismiss,
    duration = 5000
}) => {
    useEffect(() => {
        messages.forEach((message) => {
            const timer = setTimeout(() => {
                onDismiss(message.id);
            }, duration);

            return () => clearTimeout(timer);
        });
    }, [messages, onDismiss, duration]);

    const getTypeStyles = (type: string = 'error') => {
        switch (type) {
            case 'warning':
                return 'bg-yellow-500 border-yellow-600';
            case 'info':
                return 'bg-blue-500 border-blue-600';
            default:
                return 'bg-red-500 border-red-600';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`
                        ${getTypeStyles(message.type)}
                        text-white px-4 py-3 rounded-lg shadow-lg
                        border-l-4 min-w-80 max-w-96
                        animate-in slide-in-from-right-2 fade-in-0
                    `}
                >
                    <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">{message.message}</p>
                        <button
                            onClick={() => onDismiss(message.id)}
                            className="ml-2 text-white hover:text-gray-200 text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Hook for managing error messages
export const useErrorMessages = () => {
    const [messages, setMessages] = useState<ErrorMessage[]>([]);

    const addMessage = (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
        const id = Date.now().toString();
        setMessages(prev => [...prev, { id, message, type }]);
    };

    const dismissMessage = (id: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== id));
    };

    const clearAll = () => {
        setMessages([]);
    };

    return {
        messages,
        addMessage,
        dismissMessage,
        clearAll
    };
};