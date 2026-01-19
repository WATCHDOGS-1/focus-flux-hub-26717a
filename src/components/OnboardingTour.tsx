import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_COMPLETED_KEY = 'onlyfocus_onboarding_v1';

const OnboardingTour = () => {
    const { profile, isAuthenticated } = useAuth();
    const driverRef = useRef<any>(null);

    useEffect(() => {
        if (!isAuthenticated || !profile) return;

        const isTourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
        if (isTourCompleted) return;

        // Initialize driver.js
        driverRef.current = driver({
            showProgress: true,
            allowClose: true,
            steps: [
                { 
                    element: '#focus-timer-card', 
                    popover: { 
                        title: 'The Temporal Engine', 
                        description: 'Your command center for deep work.',
                        side: 'right'
                    } 
                },
                { 
                    element: '#kanban-board', 
                    popover: { 
                        title: 'Strategic Planning', 
                        description: 'Organize your leverage here.',
                        side: 'left'
                    } 
                }
            ].filter(step => document.querySelector(step.element as string)), // CRITICAL: Only include steps if element exists
            onDestroyStarted: () => {
                driverRef.current.destroy();
                localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
            },
        });

        // Only start if there are valid steps for the current page
        if (driverRef.current.getConfig().steps?.length > 0) {
            const timeout = setTimeout(() => {
                driverRef.current.drive();
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [isAuthenticated, profile]);

    return null;
};

export default OnboardingTour;