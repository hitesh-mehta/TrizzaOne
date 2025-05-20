
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ThemeProvider } from '@/hooks/useTheme';
import FoodModel3D from '@/components/3d/FoodModel3D';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });

        if (error) throw error;
        
        toast({
          title: t('auth.signupSuccessTitle'),
          description: t('auth.signupSuccessDesc'),
        });
        
        // Auto login after signup
        navigate('/');
      } else {
        // Sign in flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        
        toast({
          title: t('auth.loginSuccessTitle'),
          description: t('auth.loginSuccessDesc'),
        });
        
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? t('auth.signupErrorTitle') : t('auth.loginErrorTitle'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-navy/10 p-4">
        <div className="absolute -z-10 top-0 left-0 w-full h-full">
          <div className="absolute top-20 right-20 opacity-50">
            <FoodModel3D type="plate" rotate={true} />
          </div>
          <div className="absolute bottom-20 left-20 opacity-50">
            <FoodModel3D type="pizza" rotate={true} />
          </div>
        </div>
        
        <Card className="w-full max-w-md neumorphic-card border-mintGreen/20 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-mintGreen flex items-center justify-center mb-2">
              <span className="font-bold text-2xl text-navy">T1</span>
            </div>
            <CardTitle className="text-2xl text-center">
              {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignUp ? t('auth.signupDesc') : t('auth.loginDesc')}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  {!isSignUp && (
                    <a href="#" className="text-sm text-mintGreen hover:underline">
                      {t('auth.forgotPassword')}
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-mintGreen hover:bg-mintGreen/90 text-navy"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-t-transparent border-navy rounded-full animate-spin mr-2"></div>
                    <span>{t('auth.processing')}</span>
                  </div>
                ) : isSignUp ? (
                  t('auth.signup')
                ) : (
                  t('auth.login')
                )}
              </Button>
              
              <div className="text-center text-sm">
                {isSignUp ? (
                  <span>
                    {t('auth.alreadyHaveAccount')}{' '}
                    <button
                      type="button"
                      className="text-mintGreen hover:underline font-medium"
                      onClick={() => setIsSignUp(false)}
                    >
                      {t('auth.login')}
                    </button>
                  </span>
                ) : (
                  <span>
                    {t('auth.noAccount')}{' '}
                    <button
                      type="button"
                      className="text-mintGreen hover:underline font-medium"
                      onClick={() => setIsSignUp(true)}
                    >
                      {t('auth.createOne')}
                    </button>
                  </span>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default Auth;
