import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, MeshDistortMaterial } from '@react-three/drei';
import { useCivilization } from '@/hooks/use-civilization';
import * as THREE from 'three';

const SquadBiosphere = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { data: civData } = useCivilization();
    
    const planetState = useMemo(() => {
        const isDying = civData?.isDying;
        const level = civData?.level || 1;
        
        if (isDying) return { color: '#450a0a', speed: 0.5, distort: 0.8 }; // Barren/Decaying
        if (level >= 7) return { color: '#00f0ff', speed: 4, distort: 0.2 }; // Ascended
        if (level >= 4) return { color: '#3B82F6', speed: 2.5, distort: 0.3 }; // Thriving
        return { color: '#171B21', speed: 1.5, distort: 0.4 }; // Developing
    }, [civData]);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002 * planetState.speed;
            meshRef.current.rotation.x += 0.001 * planetState.speed;
            // Pulsing effect based on health
            const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * (civData?.isDying ? 0.05 : 0.02);
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <Sphere ref={meshRef} args={[1, 64, 64]}>
            <MeshDistortMaterial 
                color={planetState.color} 
                speed={planetState.speed} 
                distort={planetState.distort} 
                metalness={0.9} 
                roughness={0.1}
                emissive={planetState.color}
                emissiveIntensity={civData?.isDying ? 0.1 : 0.4}
            />
        </Sphere>
    );
};

const DigitalPlanet3D = () => {
    return (
        <div className="w-full h-full bg-transparent">
            <Canvas camera={{ position: [0, 0, 3] }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#3B82F6" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#60A5FA" />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
                <SquadBiosphere />
                <OrbitControls enableZoom={false} />
            </Canvas>
        </div>
    );
};

export default DigitalPlanet3D;