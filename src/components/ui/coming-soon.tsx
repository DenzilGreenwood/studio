import React from 'react';

interface ComingSoonProps {
    title?: string;
    description?: string;
    className?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
    title = "Coming Soon",
    description = "This feature is currently under development and will be available soon.",
    className = ""
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center ${className}`}>
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 max-w-md">{description}</p>
        </div>
    );
};