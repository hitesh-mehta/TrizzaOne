
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Play, SkipForward } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface WelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onSkip?: () => void;
}

const WelcomeTour: React.FC<WelcomeTourProps> = ({ isOpen, onClose, onComplete, onSkip }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: t('tour.welcome.title'),
      description: t('tour.welcome.description'),
      position: 'center'
    },
    {
      id: 'dashboard',
      title: t('tour.dashboard.title'),
      description: t('tour.dashboard.description'),
      target: '[data-tour="dashboard"]',
      position: 'right'
    },
    {
      id: 'predictions',
      title: t('tour.predictions.title'),
      description: t('tour.predictions.description'),
      target: '[data-tour="predictions"]',
      position: 'right'
    },
    {
      id: 'sustainability',
      title: t('tour.sustainability.title'),
      description: t('tour.sustainability.description'),
      target: '[data-tour="sustainability"]',
      position: 'right'
    },
    {
      id: 'chatbot',
      title: t('tour.chatbot.title'),
      description: t('tour.chatbot.description'),
      target: '[data-tour="chatbot"]',
      position: 'top'
    },
    {
      id: 'complete',
      title: t('tour.complete.title'),
      description: t('tour.complete.description'),
      position: 'center'
    }
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStart = () => {
    setIsStarted(true);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onClose();
      localStorage.setItem('trizzaone_tour_skipped', 'true');
    }
  };

  const handleComplete = () => {
    onComplete();
    localStorage.setItem('trizzaone_tour_completed', 'true');
  };

  const getStepPosition = () => {
    const step = tourSteps[currentStep];
    if (!step.target || step.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      };
    }

    const target = document.querySelector(step.target);
    if (!target) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      };
    }

    const rect = target.getBoundingClientRect();
    const cardWidth = 320;
    const cardHeight = 250;
    
    let top = rect.top;
    let left = rect.left;
    let transform = '';

    switch (step.position) {
      case 'right':
        left = rect.right + 20;
        top = rect.top + (rect.height / 2);
        transform = 'translateY(-50%)';
        // Ensure it doesn't go off screen
        if (left + cardWidth > window.innerWidth - 20) {
          left = rect.left - cardWidth - 20;
          transform = 'translateY(-50%)';
        }
        break;
      case 'left':
        left = rect.left - cardWidth - 20;
        top = rect.top + (rect.height / 2);
        transform = 'translateY(-50%)';
        if (left < 20) {
          left = rect.right + 20;
          transform = 'translateY(-50%)';
        }
        break;
      case 'top':
        left = rect.left + (rect.width / 2);
        top = rect.top - cardHeight - 20;
        transform = 'translateX(-50%)';
        if (top < 20) {
          top = rect.bottom + 20;
          transform = 'translateX(-50%)';
        }
        break;
      case 'bottom':
        left = rect.left + (rect.width / 2);
        top = rect.bottom + 20;
        transform = 'translateX(-50%)';
        if (top + cardHeight > window.innerHeight - 20) {
          top = rect.top - cardHeight - 20;
          transform = 'translateX(-50%)';
        }
        break;
    }

    // Final boundary checks
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 20) left = 20;
    if (left + cardWidth > viewportWidth - 20) left = viewportWidth - cardWidth - 20;
    if (top < 20) top = 20;
    if (top + cardHeight > viewportHeight - 20) top = viewportHeight - cardHeight - 20;

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      transform,
      zIndex: 1000
    };
  };

  // Add highlight effect to target element
  useEffect(() => {
    if (!isStarted) return;
    
    const step = tourSteps[currentStep];
    if (!step.target) return;

    const target = document.querySelector(step.target);
    if (!target) return;

    // Add highlight class
    target.classList.add('tour-highlight');
    
    return () => {
      target.classList.remove('tour-highlight');
    };
  }, [currentStep, isStarted, tourSteps]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Highlight styles */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 60;
          box-shadow: 0 0 0 4px rgba(76, 204, 163, 0.6), 0 0 20px rgba(76, 204, 163, 0.4);
          border-radius: 8px;
          transition: box-shadow 0.3s ease;
        }
      `}</style>
      
      {/* Tour Card */}
      <Card 
        className="w-80 shadow-2xl border-mintGreen/20 bg-background/95 backdrop-blur-md"
        style={getStepPosition()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">
            {!isStarted ? t('tour.welcome.title') : tourSteps[currentStep]?.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isStarted ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t('tour.welcome.description')}
              </p>
              <div className="flex gap-2">
                <Button onClick={handleStart} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  {t('tour.startTour')}
                </Button>
                <Button variant="outline" onClick={handleSkip}>
                  <SkipForward className="h-4 w-4 mr-2" />
                  {t('tour.skip')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {tourSteps[currentStep]?.description}
              </p>
              
              {/* Progress indicator */}
              <div className="flex items-center justify-center space-x-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep ? 'bg-mintGreen' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('tour.previous')}
                </Button>
                
                <span className="text-xs text-muted-foreground self-center">
                  {currentStep + 1} / {tourSteps.length}
                </span>
                
                <Button onClick={handleNext} size="sm">
                  {currentStep === tourSteps.length - 1 ? (
                    t('tour.finish')
                  ) : (
                    <>
                      {t('tour.next')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default WelcomeTour;
