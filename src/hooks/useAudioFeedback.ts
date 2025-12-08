import useSound from 'use-sound';
import { useCallback, createContext, useContext, ReactNode } from 'react';

// Define sound paths (assuming they are in the public folder)
const SOUND_PATHS = {
    click: '/sounds/click.mp3',
    success: '/sounds/success.mp3',
    timerEnd: '/sounds/timer-end.mp3',
    pop: '/sounds/pop.mp3', // For Kanban 'Done'
};

interface AudioContextType {
    play: (sound: 'click' | 'success' | 'timer-end' | 'pop') => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
    // Pre-load sounds
    const [playClick] = useSound(SOUND_PATHS.click, { volume: 0.5 });
    const [playSuccess] = useSound(SOUND_PATHS.success, { volume: 0.7 });
    const [playTimerEnd] = useSound(SOUND_PATHS.timerEnd, { volume: 0.8 });
    const [playPop] = useSound(SOUND_PATHS.pop, { volume: 0.6 });

    const play = useCallback((sound: 'click' | 'success' | 'timer-end' | 'pop') => {
        switch (sound) {
            case 'click':
                playClick();
                break;
            case 'success':
                playSuccess();
                break;
            case 'timer-end':
                playTimerEnd();
                break;
            case 'pop':
                playPop();
                break;
            default:
                break;
        }
    }, [playClick, playSuccess, playTimerEnd, playPop]);

    return (
        <AudioContext.Provider value={{ play }}>
            {children}
        </AudioContext.Provider>
    );
}

export const useAudioFeedback = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        // This should only happen if used outside AudioProvider, which is fine for optional use
        return { play: (sound: string) => {} }; 
    }
    return context;
};