
import { useState, useEffect } from 'react';

export const useTour = () => {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if tour has been completed or skipped
    const tourCompleted = localStorage.getItem('trizzaone_tour_completed');
    const tourSkipped = localStorage.getItem('trizzaone_tour_skipped');
    const setupComplete = localStorage.getItem('trizzaone_setup_complete');
    
    // Show tour only if setup is complete and tour hasn't been completed or skipped
    if (setupComplete === 'true' && !tourCompleted && !tourSkipped) {
      // Small delay to ensure the UI is fully loaded
      setTimeout(() => {
        setShowTour(true);
      }, 1000);
    }
  }, []);

  const startTour = () => {
    setShowTour(true);
  };

  const closeTour = () => {
    setShowTour(false);
  };

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem('trizzaone_tour_completed', 'true');
  };

  return {
    showTour,
    startTour,
    closeTour,
    completeTour
  };
};
