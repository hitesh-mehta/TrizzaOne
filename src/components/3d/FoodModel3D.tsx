
import React from 'react';

interface FoodModel3DProps {
  type: 'pizza' | 'burger' | 'plate' | 'donut';
  rotate?: boolean;
  size?: number;
}

const FoodModel3D: React.FC<FoodModel3DProps> = ({ type, rotate = false, size = 100 }) => {
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    perspective: '1000px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const modelStyle = {
    transformStyle: 'preserve-3d' as const,
    animation: rotate ? 'rotate360 4s linear infinite' : 'none',
    width: '80%',
    height: '80%',
    position: 'relative' as const,
  };

  const renderPizza = () => (
    <div className="relative w-full h-full">
      {/* Pizza base */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 shadow-2xl transform rotate-x-12">
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-200 to-red-300 opacity-80"></div>
      </div>
      {/* Pizza toppings */}
      <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-red-500 shadow-lg transform translate-z-4"></div>
      <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-green-600 shadow-lg transform translate-z-4"></div>
      <div className="absolute bottom-1/3 left-1/2 w-4 h-4 rounded-full bg-yellow-400 shadow-lg transform translate-z-4"></div>
      <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-red-600 shadow-lg transform translate-z-4"></div>
    </div>
  );

  const renderBurger = () => (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Top bun */}
      <div className="w-16 h-8 rounded-t-full bg-gradient-to-b from-orange-300 to-yellow-400 shadow-xl transform rotate-x-15 mb-1"></div>
      {/* Lettuce */}
      <div className="w-14 h-2 bg-green-400 rounded shadow-md transform rotate-x-10"></div>
      {/* Cheese */}
      <div className="w-15 h-1 bg-yellow-300 rounded shadow-md transform rotate-x-8"></div>
      {/* Patty */}
      <div className="w-14 h-3 bg-gradient-to-b from-amber-800 to-amber-900 rounded shadow-xl transform rotate-x-5"></div>
      {/* Bottom bun */}
      <div className="w-16 h-6 rounded-b-full bg-gradient-to-t from-orange-400 to-yellow-300 shadow-xl transform rotate-x-3 mt-1"></div>
    </div>
  );

  const renderDonut = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Donut base */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-300 to-pink-400 shadow-2xl relative transform rotate-x-15">
        {/* Donut hole */}
        <div className="absolute inset-1/3 rounded-full bg-transparent border-8 border-white shadow-inner"></div>
        {/* Sprinkles */}
        <div className="absolute top-2 left-4 w-1 h-3 bg-red-500 rounded transform rotate-45"></div>
        <div className="absolute top-4 right-3 w-1 h-3 bg-blue-500 rounded transform -rotate-30"></div>
        <div className="absolute bottom-3 left-6 w-1 h-3 bg-green-500 rounded transform rotate-60"></div>
        <div className="absolute bottom-4 right-5 w-1 h-3 bg-yellow-500 rounded transform -rotate-45"></div>
        <div className="absolute top-6 left-8 w-1 h-3 bg-purple-500 rounded transform rotate-15"></div>
      </div>
    </div>
  );

  const renderPlate = () => (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Plate */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl relative transform rotate-x-20">
        <div className="absolute inset-1 rounded-full border-2 border-gray-300 bg-gradient-to-br from-white to-gray-100"></div>
        {/* Food items on plate */}
        <div className="absolute top-6 left-8 w-4 h-3 bg-gradient-to-br from-amber-600 to-amber-800 rounded shadow-lg transform rotate-x-10"></div>
        <div className="absolute top-8 right-6 w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg transform translate-z-2"></div>
        <div className="absolute bottom-6 left-6 w-3 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded shadow-lg transform rotate-x-5"></div>
      </div>
    </div>
  );

  const renderFood = () => {
    switch (type) {
      case 'pizza':
        return renderPizza();
      case 'burger':
        return renderBurger();
      case 'donut':
        return renderDonut();
      case 'plate':
      default:
        return renderPlate();
    }
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes rotate360 {
          from { transform: rotateY(0deg) rotateX(15deg); }
          to { transform: rotateY(360deg) rotateX(15deg); }
        }
        .rotate-x-3 { transform: rotateX(3deg); }
        .rotate-x-5 { transform: rotateX(5deg); }
        .rotate-x-8 { transform: rotateX(8deg); }
        .rotate-x-10 { transform: rotateX(10deg); }
        .rotate-x-12 { transform: rotateX(12deg); }
        .rotate-x-15 { transform: rotateX(15deg); }
        .rotate-x-20 { transform: rotateX(20deg); }
        .translate-z-2 { transform: translateZ(2px); }
        .translate-z-4 { transform: translateZ(4px); }
      `}</style>
      <div style={modelStyle}>
        {renderFood()}
      </div>
    </div>
  );
};

export default FoodModel3D;
