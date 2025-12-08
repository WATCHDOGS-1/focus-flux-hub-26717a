import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetTheme } from '@/hooks/use-civilization';

interface Planet3DProps {
    level: number;
    theme: PlanetTheme;
    satelliteCount: number;
    progressPercent: number;
    size: number;
}

const BIOME_MATERIALS: Record<PlanetTheme, THREE.MeshStandardMaterial> = {
    'default': new THREE.MeshStandardMaterial({ color: '#3b82f6', emissive: '#1d4ed8', emissiveIntensity: 0.5 }), // Blue
    'cyberpunk': new THREE.MeshStandardMaterial({ color: '#8b5cf6', emissive: '#a855f7', emissiveIntensity: 0.7 }), // Purple Neon
    'library': new THREE.MeshStandardMaterial({ color: '#78350f', emissive: '#92400e', emissiveIntensity: 0.3 }), // Brown/Warm
    'arena': new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#b91c1c', emissiveIntensity: 0.6 }), // Red/Aggressive
};

const PlanetMesh = ({ level, theme, size }: { level: number, theme: PlanetTheme, size: number }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const material = useMemo(() => BIOME_MATERIALS[theme] || BIOME_MATERIALS.default, [theme]);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.001 * level; // Rotate faster with level
        }
    });

    return (
        <Sphere ref={meshRef} args={[size, 32, 32]}>
            <primitive object={material} attach="material" />
            {/* Simple surface detail simulation */}
            <Sphere args={[size * 0.98, 32, 32]} scale={[1.01, 1.01, 1.01]}>
                <meshStandardMaterial color={material.color.clone().multiplyScalar(0.8)} transparent opacity={0.1} />
            </Sphere>
        </Sphere>
    );
};

const Satellite = ({ index, orbitRadius }: { index: number, orbitRadius: number }) => {
    const satelliteRef = useRef<THREE.Mesh>(null!);
    const speed = 0.005 + index * 0.001;

    useFrame(({ clock }) => {
        if (satelliteRef.current) {
            const angle = clock.getElapsedTime() * speed;
            satelliteRef.current.position.x = Math.cos(angle) * orbitRadius;
            satelliteRef.current.position.z = Math.sin(angle) * orbitRadius;
            satelliteRef.current.rotation.y += 0.05;
        }
    });

    return (
        <mesh ref={satelliteRef} position={[orbitRadius, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1} />
        </mesh>
    );
};

const Planet3D = ({ level, theme, satelliteCount, progressPercent, size }: Planet3DProps) => {
    const orbitRadius = size * 1.5;
    
    return (
        <Canvas camera={{ position: [0, 0, size * 2.5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            <PlanetMesh level={level} theme={theme} size={size} />
            
            {/* Satellites */}
            {[...Array(satelliteCount)].map((_, i) => (
                <Satellite key={i} index={i} orbitRadius={orbitRadius + i * 0.5} />
            ))}
            
            {/* Progress Ring (Simulated) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[size * 1.1, size * 1.15, 64, 1, 0, (progressPercent / 100) * Math.PI * 2]} />
                <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} transparent opacity={0.5} />
            </mesh>

            <OrbitControls enableZoom={true} enablePan={false} maxDistance={size * 4} minDistance={size * 2} />
        </Canvas>
    );
};

export default Planet3D;