import React, { useState } from 'react';
import { supabase } from '../lib/db';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';

interface AuthPageProps {
  onSuccess: () => void;
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('¡Bienvenido de vuelta!');
        onSuccess();
      }
    } catch (err) {
      toast.error('Error al iniciar sesión');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ebbb5c67/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role
        }),
      });

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || response.statusText };
      }

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${text}`);
      }

      // Auto login after signup
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        toast.success('Cuenta creada. Por favor inicia sesión.');
      } else {
        toast.success('¡Cuenta creada con éxito!');
        onSuccess();
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error(err.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#FFF4B7] via-[#FFE082] to-[#FFD4C2] flex items-center justify-center shadow-lg border-4 border-white mb-4">
            <span className="text-4xl">🐵</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">LuinGo</h1>
          <p className="text-gray-500">Plataforma LMS ultra-ligera</p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">Acceso a la Plataforma</CardTitle>
            <CardDescription className="text-center">
              Ingresa con tu cuenta o regístrate si tienes una invitación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#A8D8FF] hover:bg-[#95CBF5] text-gray-900 font-medium border-none" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cargando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <Input
                      id="signup-name"
                      placeholder="Ej. Ana Martínez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="student"
                          checked={role === 'student'}
                          onChange={() => setRole('student')}
                          className="w-4 h-4 text-[#A8D8FF]"
                        />
                        <span className="text-sm">Estudiante</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="teacher"
                          checked={role === 'teacher'}
                          onChange={() => setRole('teacher')}
                          className="w-4 h-4 text-[#A8D8FF]"
                        />
                        <span className="text-sm">Profesor</span>
                      </label>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#B5F8D4] hover:bg-[#9AEFBC] text-gray-900 font-medium border-none"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="text-center text-xs text-gray-400 flex justify-center">
            LuinGo LMS v1.0
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
