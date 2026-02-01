import { useEffect, useRef } from 'react';

/**
 * FloatingParticles - Award-winning Apple-style floating orbs
 * Creates a mesmerizing background with soft, blurred particles
 */
const FloatingParticles = ({ count = 15, colors = ['#0071e3', '#5856d6', '#ff375f'] }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Clear existing particles
        container.innerHTML = '';

        // Create particles
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 200 + 100; // 100-300px (larger)
            const color = colors[Math.floor(Math.random() * colors.length)];
            const duration = Math.random() * 25 + 20; // 20-45s (slower)
            const delay = Math.random() * -15;

            Object.assign(particle.style, {
                position: 'absolute',
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}60 0%, ${color}20 50%, transparent 70%)`, // More visible
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: 'blur(60px)', // Softer blur
                opacity: '0.8', // More visible
                animation: `floatParticle ${duration}s ease-in-out ${delay}s infinite`,
                pointerEvents: 'none',
            });

            container.appendChild(particle);
        }

        // Add keyframes if not already present
        if (!document.getElementById('particle-keyframes')) {
            const style = document.createElement('style');
            style.id = 'particle-keyframes';
            style.textContent = `
                @keyframes floatParticle {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    25% {
                        transform: translate(30px, -40px) scale(1.1);
                    }
                    50% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    75% {
                        transform: translate(40px, 30px) scale(1.05);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        return () => {
            container.innerHTML = '';
        };
    }, [count, colors]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 0,
            }}
            aria-hidden="true"
        />
    );
};

export default FloatingParticles;
