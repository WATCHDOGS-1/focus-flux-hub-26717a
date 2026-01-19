import { supabase } from "@/integrations/supabase/client";
import { sendGeminiChat } from "./gemini";

/**
 * SM-2 Algorithm for Spaced Repetition
 */
export const calculateNextReview = (quality: number, prevEasiness: number, prevInterval: number, prevRepetitions: number) => {
    let repetitions = prevRepetitions;
    let easiness = prevEasiness;
    let interval = prevInterval;

    if (quality >= 3) {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * easiness);
        repetitions++;
    } else {
        repetitions = 0;
        interval = 1;
    }

    easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easiness < 1.3) easiness = 1.3;

    return { repetitions, easiness, interval };
};

export const generateActiveRecall = async (text: string, focusTag: string, userId: string) => {
    if (text.length < 50) return null;

    const prompt = `
    Analyze this study note: "${text}"
    Subject: ${focusTag}
    
    1. Identify the CORE technical concept.
    2. Generate one 'Hard' question and one 'Conceptual' question for active recall.
    3. Return ONLY a JSON object: {"concept": "...", "cards": [{"q": "...", "a": "..."}] }
    `;

    try {
        const response = await sendGeminiChat([{ role: 'user', parts: [{ text: prompt }] }]);
        const data = JSON.parse(response);
        
        for (const card of data.cards) {
            await supabase.from('knowledge_cards').insert({
                user_id: userId,
                concept: data.concept,
                question: card.q,
                answer: card.a,
                focus_tag: focusTag
            });
        }
        return data;
    } catch (e) {
        console.error("Knowledge Engine failure", e);
        return null;
    }
};