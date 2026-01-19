import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, MeshDistortMaterial } from '@react-three/drei';
import { useUserStats } from '@/hooks/use-user-stats';
import * as THREE from 'three';

const RotatingPlanet = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { levels } = useUserStats();
    
    const planetColor = useMemo(() => {
        const level = levels?.level || 1;
        if (level >= 7) return '#00f0ff';
        if (level >= 4) return '#b026ff';
        return '#444444';
    }, [levels]);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002;
            meshRef.current.rotation.x += 0.001;
        }
    });

    return (
        <Sphere ref={meshRef} args={[1, 64, 64]}>
            <MeshDistortMaterial 
                color={planetColor} 
                speed={2} 
                distort={0.2} 
                metalness={0.9} 
                roughness={0.1}
                emissive={planetColor}
                emissiveIntensity={0.2}
            />
        </Sphere>
    );
};

const DigitalPlanet3D = () => {
    return (
        <div className="w-full h-full bg-transparent">
            <Canvas camera={{ position: [0, 0, 3] }}>
                <ambientLight intensity={0.4} />
                <pointLight position={[5, 5, 5]} intensity={1.5} color="#b026ff" />
                <pointLight position={[-5, -5, -5]} intensity={1} color="#00f0ff" />
                <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade />
                <RotatingPlanet />
                <OrbitControls enableZoom={false} autoRotate />
            </Canvas>
        </div>
    );
};

export default DigitalPlanet3D;