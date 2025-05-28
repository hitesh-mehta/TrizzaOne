
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const Footer: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <footer className="bg-background border-t border-border py-3 sm:py-4 px-3 sm:px-4 text-center">
      <p className="text-xs sm:text-sm text-muted-foreground">
        © 2025 {isMobile ? 'TrizzaOne' : 'TrizzaOne. All rights reserved.'}
      </p>
    </footer>
  );
};

export default Footer;
