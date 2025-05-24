import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// We'll create a simulated 2D map for the first version and plan to evolve to 3D later
const FacilityMap: React.FC = () => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mock facility data with added Hallway
  const facilityData = [
    {
      id: 'kitchen',
      name: t('facility.kitchen'),
      color: '#FF6B6B', // Coral for kitchen (higher temperature)
      temp: '28°C',
      occupants: 5,
      lastCleaned: '45 min ago',
      x: 0.15, // Position as percentage of canvas width
      y: 0.45, // Position as percentage of canvas height
      width: 0.25,
      height: 0.35,
    },
    {
      id: 'dining',
      name: t('facility.dining'),
      color: '#4ECCA3', // Mint green for dining (comfortable temperature)
      temp: '24°C',
      occupants: 12,
      lastCleaned: '2 hrs ago',
      x: 0.55,
      y: 0.45,
      width: 0.3,
      height: 0.35,
    },
    {
      id: 'pantry',
      name: t('facility.pantry'),
      color: '#1A535C', // Cool blue for pantry (cooler temperature)
      temp: '22°C',
      occupants: 2,
      lastCleaned: '1 hr ago',
      x: 0.4,
      y: 0.15,
      width: 0.2,
      height: 0.2,
    },
    {
      id: 'hallway',
      name: 'Hallway',
      color: '#6366F1', // Purple for hallway
      temp: '25°C',
      occupants: 3,
      lastCleaned: '30 min ago',
      x: 0.2,
      y: 0.82,
      width: 0.6,
      height: 0.12,
    }
  ];

  // Function to draw the facility map
  const drawMap = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = '#2A2A2A';
    ctx.lineWidth = 0.5;
    
    const gridSize = 20;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw facility zones
    facilityData.forEach(zone => {
      const x = zone.x * width;
      const y = zone.y * height;
      const zoneWidth = zone.width * width;
      const zoneHeight = zone.height * height;

      // Draw zone background
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = zone.color;
      ctx.fillRect(x, y, zoneWidth, zoneHeight);
      ctx.globalAlpha = 1.0;

      // Draw zone border
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, zoneWidth, zoneHeight);

      // Draw zone name
      ctx.fillStyle = '#FFF';
      ctx.font = '14px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, x + zoneWidth / 2, y + zoneHeight / 2);
      
      // Draw occupant indicators
      const dotSize = 4;
      const maxDotsPerRow = 5;
      const spacing = 8;
      const occupants = Math.min(zone.occupants, 15); // Limit to 15 for display
      
      for (let i = 0; i < occupants; i++) {
        const row = Math.floor(i / maxDotsPerRow);
        const col = i % maxDotsPerRow;
        const dotX = x + 10 + col * spacing;
        const dotY = y + zoneHeight - 10 - row * spacing;
        
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF';
        ctx.fill();
      }
    });
  };

  // Set up canvas and draw the map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      const dimensions = parent.getBoundingClientRect();
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      drawMap(ctx, canvas.width, canvas.height);
    }
    
    // Redraw on window resize
    const handleResize = () => {
      if (parent) {
        const dimensions = parent.getBoundingClientRect();
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        drawMap(ctx, canvas.width, canvas.height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Pulse animation effect
    let alpha = 0.7;
    let increasing = true;
    
    const animate = () => {
      if (increasing) {
        alpha += 0.01;
        if (alpha >= 0.9) increasing = false;
      } else {
        alpha -= 0.01;
        if (alpha <= 0.7) increasing = true;
      }
      
      if (parent) {
        ctx.globalAlpha = alpha;
        drawMap(ctx, canvas.width, canvas.height);
      }
      
      requestAnimationFrame(animate);
    };
    
    const animationFrame = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <Card className="neumorphic-card h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center">
          {t('dashboard.overview')}
          <div className="ml-2 flex items-center">
            <span className="pulse-dot mr-2"></span>
            <span className="text-xs text-muted-foreground">{t('dashboard.lastUpdated')}: 1m</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative h-[320px]">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
        ></canvas>
        
        <TooltipProvider>
          {facilityData.map((zone) => (
            <Tooltip key={zone.id}>
              <TooltipTrigger asChild>
                <div 
                  style={{
                    position: 'absolute',
                    left: `${zone.x * 100}%`,
                    top: `${zone.y * 100}%`,
                    width: `${zone.width * 100}%`,
                    height: `${zone.height * 100}%`,
                  }}
                  className="cursor-pointer"
                >
                  {/* Invisible overlay for tooltip trigger */}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="p-4 w-64">
                <div className="space-y-2">
                  <h4 className="font-semibold">{zone.name}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('facility.temp')}</p>
                      <p>{zone.temp}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('facility.occupancy')}</p>
                      <p>{zone.occupants}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">{t('facility.cleaning')}</p>
                      <p>{zone.lastCleaned}</p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default FacilityMap;
