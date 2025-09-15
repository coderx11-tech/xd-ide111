import React from 'react';
import { Icon } from './Icon';

interface FloatingAiButtonProps {
    onClick: () => void;
}

const FloatingAiButton: React.FC<FloatingAiButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-40 h-14 w-14 bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-cyan-500 transition-transform hover:scale-110"
            title="Open AI Assistant"
        >
            <Icon name="robot" className="h-8 w-8" />
        </button>
    );
};

export default FloatingAiButton;
