
import { useState, useEffect } from 'react';

export const useTour = () => {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if tour has been completed or skipped
    const tourCompleted = localStorage.getItem('trizzaone_tour_completed');
    const tourSkipped = localStorage.getItem('trizzaone_tour_skipped');
    const setupComplete = localStorage.getItem('trizzaone_setup_complete');
    
    console.log('Tour check:', { tourCompleted, tourSkipped, setupComplete });
    
    // Show tour only if setup is complete and tour hasn't been completed or skipped
    if (setupComplete === 'true' && !tourCompleted && !tourSkipped) {
      // Small delay to ensure the UI is fully loaded
      setTimeout(() => {
        console.log('Starting tour...');
        setShowTour(true);
      }, 2000); // Increased delay to 2 seconds
    }
  }, []);

  const startTour = () => {
    console.log('Manual tour start');
    setShowTour(true);
  };

  const closeTour = () => {
    console.log('Tour closed');
    setShowTour(false);
  };

  const completeTour = () => {
    console.log('Tour completed');
    setShowTour(false);
    localStorage.setItem('trizzaone_tour_completed', 'true');
  };

  const skipTour = () => {
    console.log('Tour skipped');
    setShowTour(false);
    localStorage.setItem('trizzaone_tour_skipped', 'true');
  };

  return {
    showTour,
    startTour,
    closeTour,
    completeTour,
    skipTour
  };
};
