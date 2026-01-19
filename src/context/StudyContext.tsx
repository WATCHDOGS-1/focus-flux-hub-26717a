import React, { createContext, useContext, useState, ReactNode } from "react";

interface StudyContextType {
    focusTag: string;
    setFocusTag: (tag: string) => void;
    sessionIntent: string;
    setSessionIntent: (intent: string) => void;
    livePeers: number;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider = ({ children }: { children: ReactNode }) => {
    const [focusTag, setFocusTag] = useState("General Focus");
    const [sessionIntent, setSessionIntent] = useState("");
    const [livePeers, setLivePeers] = useState(Math.floor(Math.random() * 50) + 12); // Simulated for now

    return (
        <StudyContext.Provider value={{ focusTag, setFocusTag, sessionIntent, setSessionIntent, livePeers }}>
            {children}
        </StudyContext.Provider>
    );
};

export const useStudy = () => {
    const context = useContext(StudyContext);
    if (!context) throw new Error("useStudy must be used within StudyProvider");
    return context;
};