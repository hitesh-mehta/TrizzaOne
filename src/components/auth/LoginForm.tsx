
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginFormProps {
  onLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the auth page
    navigate('/auth');
  }, [navigate]);
  
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="neumorphic-card border-mintGreen/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t('auth.login')}</CardTitle>
          <CardDescription className="text-center">
            Redirecting to authentication page...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-8 w-8 border-2 border-t-transparent border-mintGreen rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
