import { useState, useEffect } from 'react';
import Planet3D from './three/Planet3D';
import { Loader2 } from 'lucide-react';
import { PlanetTheme } from '@/hooks/use-civilization';

interface ClientOnlyPlanet3DProps {
    level: number;
    theme: PlanetTheme;
    satelliteCount: number;
    progressPercent: number;
    size: number;
}

const ClientOnlyPlanet3D = (props: ClientOnlyPlanet3DProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center w-full h-full min-h-[250px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return <Planet3D {...props} />;
};

export default ClientOnlyPlanet3D;