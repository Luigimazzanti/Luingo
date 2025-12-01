import React from 'react';
import { Target, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface LevelTestCardProps {
  onClick: () => void;
  hasProgress?: boolean; // Nueva prop para saber si es "Continuar"
}

export const LevelTestCard: React.FC<LevelTestCardProps> = ({ onClick, hasProgress }) => {
  return (
    <div 
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[2rem] p-6 border-2 border-purple-100 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl -mr-10 -mt-10"></div>
      
      <div className="relative z-10">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
          <Target className="w-6 h-6 text-purple-600" />
        </div>
        
        <h3 className="text-xl font-black text-slate-800 mb-1">Test de Nivel</h3>
        <p className="text-sm text-slate-600 font-medium mb-6 leading-snug">
          {hasProgress 
            ? "Tienes un test en curso. ¡Vamos a terminarlo!"
            : "Completa tu evaluación para desbloquear tu nivel real."
          }
        </p>
        
        <Button className={`w-full font-bold rounded-xl shadow-lg transition-transform group-hover:scale-105 ${
          hasProgress 
            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200" 
            : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100"
        }`}>
          {hasProgress ? (
            <>Continuar Test <RotateCcw className="w-4 h-4 ml-2" /></>
          ) : (
            <>Comenzar Ahora <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
};
