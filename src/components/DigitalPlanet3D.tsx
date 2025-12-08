import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars } from '@react-three/drei';
import { useUserStats } from '@/hooks/use-user-stats';
import * as THREE from 'three';

// Component for the rotating planet mesh
const RotatingPlanet = () => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const { levels } = useUserStats();
    
    // Determine color based on level
    const planetColor = useMemo(() => {
        const level = levels?.level || 1;
        if (level >= 7) return '#00f0ff'; // Electric Cyan (Legend/Ascended)
        if (level >= 4) return '#b026ff'; // Neon Purple (Expert/Master)
        if (level >= 2) return '#ff8c00'; // Orange (Adept)
        return '#4a4e69'; // Muted Grey (Novice)
    }, [levels]);

    // Rotate the mesh every frame
    useFrame(() => {
        meshRef.current.rotation.y += 0.001;
        meshRef.current.rotation.x += 0.0005;
    });

    return (
        <Sphere ref={meshRef} args={[1, 32, 32]}>
            <meshStandardMaterial 
                color={planetColor} 
                metalness={0.5} 
                roughness={0.7} 
            />
        </Sphere>
    );
};

const DigitalPlanet3D = () => {
    return (
        <div className="w-full h-full bg-transparent rounded-xl">
            <Canvas camera={{ position: [0, 0, 3], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#b026ff" />
                <pointLight position={[-10, -10, -10]} intensity={0.8} color="#00f0ff" />
                
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                
                <RotatingPlanet />
                
                <OrbitControls 
                    enableZoom={false} 
                    enablePan={false} 
                    autoRotate={true} 
                    autoRotateSpeed={0.1}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 3}
                />
            </Canvas>
        </div>
    );
};

export default DigitalPlanet3D;