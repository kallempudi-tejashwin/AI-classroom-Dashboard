import React from 'react';

const BlossomBackground: React.FC = () => {
    const petals = Array.from({ length: 15 });

    const styles: React.CSSProperties = {
        '--petal-color-light': '#fecdd3',
        '--petal-color-dark': '#be185d',
    } as React.CSSProperties;

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#fff1f2] dark:bg-[#2c0b1a]" style={styles}>
             <div className="absolute inset-0 backdrop-blur-3xl"></div>
            {petals.map((_, i) => {
                const size = Math.random() * 10 + 5; // 5px to 15px
                const duration = Math.random() * 15 + 10; // 10s to 25s
                const delay = Math.random() * 25; // 0s to 25s
                const left = Math.random() * 100; // 0% to 100%

                return (
                    <div
                        key={i}
                        className="absolute will-change-transform"
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            left: `${left}vw`,
                            top: '-10vh',
                            animation: `fall ${duration}s linear ${delay}s infinite`,
                        }}
                    >
                        <div 
                            className="w-full h-full bg-[var(--petal-color-light)] dark:bg-[var(--petal-color-dark)] rounded-[50%_0] rotate-45 animate-[twinkle_3s_ease-in-out_infinite]"
                            style={{ animationDelay: `${delay}s`}}
                        ></div>
                    </div>
                );
            })}
        </div>
    );
};

export default BlossomBackground;
