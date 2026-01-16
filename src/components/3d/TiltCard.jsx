import React, { useRef, useState, useEffect } from 'react';

const TiltCard = ({ children, className = '', style = {}, disabled = false }) => {
    const cardRef = useRef(null);
    const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    const [shadow, setShadow] = useState('0 5px 15px rgba(0,0,0,0.1)');
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (disabled) return;

        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e) => {
            if (window.innerWidth < 768) return; // Disable on mobile

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate rotation
            // Center is (width/2, height/2)
            const cx = rect.width / 2;
            const cy = rect.height / 2;

            const dx = x - cx;
            const dy = y - cy;

            // Max rotation deg
            const maxRot = 5;

            // Rotate Y based on X distance (inverted)
            const rotY = (dx / cx) * maxRot;
            // Rotate X based on Y distance (inverted)
            const rotX = -(dy / cy) * maxRot;

            setTransform(`perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`);
            setShadow('0 20px 30px rgba(0,0,0,0.15)');
        };

        const handleMouseLeave = () => {
            setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
            setShadow('0 5px 15px rgba(0,0,0,0.1)');
            setIsHovered(false);
        };

        const handleMouseEnter = () => {
            if (window.innerWidth >= 768) setIsHovered(true);
        }

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);
        card.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            card.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseleave', handleMouseLeave);
            card.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [disabled]);

    return (
        <div
            ref={cardRef}
            className={className}
            style={{
                ...style,
                transform: transform,
                boxShadow: shadow,
                transition: 'transform 0.1s ease-out, box-shadow 0.3s ease',
                transformStyle: 'preserve-3d',
                willChange: 'transform'
            }}
        >
            {children}
        </div>
    );
};

export default TiltCard;
