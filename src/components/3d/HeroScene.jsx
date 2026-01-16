import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cloud, Sky, Environment, Float, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Soft Mountain (Low Poly / Abstract)
const Mountain = (props) => {
    return (
        <mesh {...props} receiveShadow castShadow>
            <coneGeometry args={[30, 15, 5]} /> {/* Low poly cone */}
            <meshStandardMaterial
                color="#8d6e63" // Earth brown
                roughness={0.8}
                metalness={0.1}
                flatShading={true}
            />
        </mesh>
    );
};

const HeroScene = () => {
    return (
        <Canvas shadows dpr={[1, 2]} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}>
            <PerspectiveCamera makeDefault position={[0, 2, 12]} fov={50} />

            {/* Cinematic Lighting */}
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <Environment preset="sunset" />

            {/* Floating Clouds / Mist */}
            <Cloud position={[-4, -2, -10]} args={[3, 2]} opacity={0.5} speed={0.4} width={10} depth={1.5} segments={20} />
            <Cloud position={[4, 2, -5]} args={[3, 2]} opacity={0.5} speed={0.4} width={10} depth={1.5} segments={20} />

            {/* Ambient Particles */}
            <Sparkles count={50} scale={12} size={4} speed={0.4} opacity={0.5} color="#fff" />

            {/* Mountains / Landscape */}
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
                <Mountain position={[-8, -6, -10]} rotation={[0, 0, 0.1]} scale={1.2} />
                <Mountain position={[8, -6, -15]} rotation={[0, 0, -0.1]} scale={1.5} />
                <Mountain position={[0, -7, -20]} scale={2.5} />
            </Float>

            {/* Soft Fog for Depth */}
            <fog attach="fog" args={['#fff0e6', 5, 30]} />
        </Canvas>
    );
};

export default HeroScene;
