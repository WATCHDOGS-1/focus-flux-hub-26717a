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

        // Check if user created less than 1 hour ago (using profile data)
        const profileCreatedAt = new Date(profile.created_at || 0).getTime();
        const oneHourAgo = Date.now() - 3600000;

        if (profileCreatedAt > oneHourAgo) {
            // Initialize driver.js
            driverRef.current = driver({
                showProgress: true,
                allowClose: true,
                steps: [
                    { 
                        element: '#focus-timer-card', 
                        popover: { 
                            title: '1. The Focus Timer', 
                            description: 'This is your Pomodoro timer. Start a session here to track your deep work and earn XP.',
                            side: 'right'
                        } 
                    },
                    { 
                        element: '#kanban-board', 
                        popover: { 
                            title: '2. Task Management', 
                            description: 'Organize your tasks here. Drag them between To Do, In Progress, and Done.',
                            side: 'left'
                        } 
                    },
                    { 
                        element: '#digital-planet-3d', 
                        popover: { 
                            title: '3. Your Digital Planet', 
                            description: 'Your focus sessions fuel the growth of your digital civilization. Watch it evolve!',
                            side: 'bottom'
                        } 
                    },
                    { 
                        element: '#ai-coach-widget', 
                        popover: { 
                            title: '4. AI Focus Coach', 
                            description: 'Your personalized AI mentor. Ask for advice, analyze your stats, and get motivation.',
                            side: 'top'
                        } 
                    },
                ],
                onDestroyStarted: () => {
                    if (!driverRef.current.isLastStep()) {
                        if (!window.confirm("Are you sure you want to skip the tour?")) {
                            return;
                        }
                    }
                    driverRef.current.destroy();
                    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
                },
            });

            // Start the tour after a slight delay to ensure elements are rendered
            const timeout = setTimeout(() => {
                driverRef.current.drive();
            }, 1000);

            return () => clearTimeout(timeout);
        }
    }, [isAuthenticated, profile]);

    return null;
};

export default OnboardingTour;