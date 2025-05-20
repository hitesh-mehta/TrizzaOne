
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface FoodModel3DProps {
  type: 'pizza' | 'burger' | 'plate' | 'donut';
  rotate?: boolean;
  size?: number;
}

const FoodModel3D: React.FC<FoodModel3DProps> = ({ type, rotate = false, size = 100 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      50,
      1, // We'll update this ratio on resize
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.setSize(size, size);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Create food model based on type
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    
    switch (type) {
      case 'pizza':
        geometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
        material = new THREE.MeshStandardMaterial({ 
          color: 0xE2B87C, 
          roughness: 0.8,
          metalness: 0.1
        });
        // Add pizza toppings
        const toppingMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xD32F2F, 
          roughness: 0.7 
        });
        for (let i = 0; i < 10; i++) {
          const toppingGeometry = new THREE.SphereGeometry(0.2, 8, 8);
          const topping = new THREE.Mesh(toppingGeometry, toppingMaterial);
          const angle = (i / 10) * Math.PI * 2;
          const radius = Math.random() * 1.2 + 0.3;
          topping.position.set(
            Math.cos(angle) * radius,
            0.2,
            Math.sin(angle) * radius
          );
          topping.scale.y = 0.2;
          scene.add(topping);
        }
        break;
      
      case 'burger':
        // Bottom bun
        const bottomBun = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.3, 0.4, 32),
          new THREE.MeshStandardMaterial({ color: 0xE9B872, roughness: 0.8 })
        );
        scene.add(bottomBun);
        
        // Patty
        const patty = new THREE.Mesh(
          new THREE.CylinderGeometry(1.4, 1.4, 0.3, 32),
          new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.8 })
        );
        patty.position.y = 0.35;
        scene.add(patty);
        
        // Cheese
        const cheese = new THREE.Mesh(
          new THREE.CylinderGeometry(1.45, 1.45, 0.1, 32),
          new THREE.MeshStandardMaterial({ color: 0xFFC107, roughness: 0.6 })
        );
        cheese.position.y = 0.55;
        scene.add(cheese);
        
        // Top bun
        geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.7, 32, 1, false, 0, Math.PI * 2);
        material = new THREE.MeshStandardMaterial({ color: 0xE9B872, roughness: 0.8 });
        // Use a hemispehre for the top bun
        const topBun = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0xE9B872, roughness: 0.8 })
        );
        topBun.position.y = 0.9;
        scene.add(topBun);
        
        // We won't set modelRef as we've added multiple meshes
        break;
      
      case 'donut':
        geometry = new THREE.TorusGeometry(1, 0.5, 16, 32);
        material = new THREE.MeshStandardMaterial({ 
          color: 0xF48FB1, 
          roughness: 0.7,
          metalness: 0.1 
        });
        // Add sprinkles
        const sprinkleColors = [0x4CAF50, 0x2196F3, 0xFFC107, 0x9C27B0, 0xFF5722];
        for (let i = 0; i < 30; i++) {
          const sprinkleGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.2);
          const sprinkleMaterial = new THREE.MeshStandardMaterial({
            color: sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)]
          });
          const sprinkle = new THREE.Mesh(sprinkleGeometry, sprinkleMaterial);
          
          // Position sprinkle on donut surface
          const angle = Math.random() * Math.PI * 2;
          const radius = 1;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          // Small random offset to place on surface
          const radialAngle = Math.random() * Math.PI * 2;
          const offsetX = Math.cos(radialAngle) * 0.5;
          const offsetY = Math.sin(radialAngle) * 0.5;
          
          sprinkle.position.set(x + offsetX * 0.2, offsetY * 0.2, z + offsetX * 0.2);
          sprinkle.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
          scene.add(sprinkle);
        }
        break;
        
      case 'plate':
      default:
        // Create a plate
        const plateGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
        const plateMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xFAFAFA, 
          roughness: 0.2,
          metalness: 0.8 
        });
        const plate = new THREE.Mesh(plateGeometry, plateMaterial);
        scene.add(plate);
        
        // Create a rim for the plate
        const rimGeometry = new THREE.TorusGeometry(2, 0.1, 16, 32);
        const rimMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xE0E0E0,
          roughness: 0.2,
          metalness: 0.8 
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.1;
        scene.add(rim);
        
        // Food items on plate (simplified)
        const food1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.3, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x8D6E63 }) // Brown food item
        );
        food1.position.set(0.5, 0.25, 0);
        scene.add(food1);
        
        const food2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0x4CAF50 }) // Green food item
        );
        food2.position.set(-0.5, 0.3, 0.5);
        scene.add(food2);
        
        const food3 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16),
          new THREE.MeshStandardMaterial({ color: 0xFF9800 }) // Orange food item
        );
        food3.position.set(-0.3, 0.15, -0.7);
        scene.add(food3);
        break;
    }
    
    if (geometry && material && type !== 'burger') {
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      modelRef.current = mesh;
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (rotate) {
        // Rotate entire scene for complex models
        scene.rotation.y += 0.01;
        
        if (modelRef.current && ['donut', 'pizza'].includes(type)) {
          modelRef.current.rotation.x += 0.005;
        }
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      
      rendererRef.current.setSize(size, size);
      cameraRef.current.aspect = 1;
      cameraRef.current.updateProjectionMatrix();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [type, rotate, size]);
  
  return <div ref={containerRef} style={{ width: `${size}px`, height: `${size}px` }} />;
};

export default FoodModel3D;
