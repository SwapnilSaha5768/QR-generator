import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex justify-center items-center h-screen w-full bg-dark/50 backdrop-blur-sm fixed inset-0 z-50">
            <div className="relative w-16 h-16">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                {/* Spinning gradient ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-secondary animate-spin"></div>
                {/* Inner pulse */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 animate-pulse"></div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
