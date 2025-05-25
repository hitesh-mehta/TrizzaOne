
import { useState, useEffect } from 'react';

export const useTour = () => {
  const [showTour, setShowTour] = useState(false);

  // Remove automatic tour triggering on setup complete
  useEffect(() => {
    console.log('Tour hook initialized - no automatic tour');
  }, []);

  const startTour = () => {
    console.log('Manual tour start');
    setShowTour(true);
    // Reset tour completion status when manually starting
    localStorage.removeItem('trizzaone_tour_completed');
    localStorage.removeItem('trizzaone_tour_skipped');
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
