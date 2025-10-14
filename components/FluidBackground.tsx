import React from 'react';

const FluidBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f0e8f8] dark:bg-[#1a1222]">
            <div className="absolute inset-0 backdrop-blur-3xl"></div>
            <div 
                className="absolute top-[-10%] left-[10%] w-72 h-72 bg-[#d8b4fe]/60 dark:bg-[#d8b4fe]/30 rounded-full filter blur-3xl animate-[moveBlob1_25s_ease-in-out_infinite]"
            />
            <div
                className="absolute bottom-[-5%] right-[5%] w-96 h-96 bg-[#a7f3d0]/60 dark:bg-[#a7f3d0]/30 rounded-full filter blur-3xl animate-[moveBlob2_30s_ease-in-out_infinite]"
            />
             <div
                className="absolute bottom-[25%] left-[20%] w-60 h-60 bg-[#fbcfe8]/50 dark:bg-[#fbcfe8]/20 rounded-full filter blur-3xl animate-[moveBlob3_28s_ease-in-out_infinite]"
            />
        </div>
    );
};

export default FluidBackground;