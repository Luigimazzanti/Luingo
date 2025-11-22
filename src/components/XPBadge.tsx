import React from 'react';
import { Sparkles } from 'lucide-react';
import { LUINGO_LEVELS } from '../lib/mockData';

interface XPBadgeProps {
  xp: number;
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

/**
 * COMPONENTE: BADGE DE XP Y NIVEL (Sistema Banana 🍌)
 * 
 * Muestra el nivel actual del estudiante con barra de progreso
 * Gamificación sutil y motivadora estilo LuinGo
 */
export const XPBadge: React.FC<XPBadgeProps> = ({
  xp,
  level,
  size = 'md',
  showDetails = true,
}) => {
  const currentLevel = LUINGO_LEVELS.find((l) => l.level === level) || LUINGO_LEVELS[0];
  const nextLevel = LUINGO_LEVELS.find((l) => l.level === level + 1);

  // Calcular progreso dentro del nivel actual
  const xpInCurrentLevel = xp - currentLevel.min_xp;
  const xpNeededForNextLevel = nextLevel
    ? nextLevel.min_xp - currentLevel.min_xp
    : currentLevel.max_xp - currentLevel.min_xp;
  const progressPercentage = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  const sizes = {
    sm: {
      icon: 'text-base',
      text: 'text-xs',
      badge: 'w-8 h-8',
      bar: 'h-1',
    },
    md: {
      icon: 'text-lg',
      text: 'text-sm',
      badge: 'w-12 h-12',
      bar: 'h-1.5',
    },
    lg: {
      icon: 'text-2xl',
      text: 'text-base',
      badge: 'w-16 h-16',
      bar: 'h-2',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div className="space-y-2">
      {/* Badge de nivel */}
      <div className="flex items-center gap-3">
        <div
          className={`${sizeConfig.badge} rounded-full bg-gradient-to-br ${currentLevel.color} flex items-center justify-center shadow-md border-2 border-white`}
        >
          <span className={sizeConfig.icon}>{currentLevel.icon}</span>
        </div>
        {showDetails && (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className={`${sizeConfig.text} text-gray-900 font-bold`}>{currentLevel.label}</h4>
              <span
                className={`${sizeConfig.text} text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-bold`}
              >
                Nivel {level}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {xp.toLocaleString()} XP
              {nextLevel && (
                <span className="text-gray-400">
                  {' '}
                  · {nextLevel.min_xp - xp} XP para {nextLevel.label}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      {showDetails && nextLevel && (
        <div className="space-y-1">
          <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${sizeConfig.bar}`}>
            <div
              className={`${sizeConfig.bar} bg-gradient-to-r ${currentLevel.color} transition-all duration-500`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          {progressPercentage >= 80 && (
            <div className="flex items-center gap-1 text-xs text-indigo-600 animate-pulse font-bold">
              <Sparkles className="w-3 h-3" />
              <span>¡Casi subes de nivel!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * COMPONENTE: MINI XP BADGE (Para usar en tarjetas)
 */
export const MiniXPBadge: React.FC<{ xp: number; level: number }> = ({ xp, level }) => {
  const currentLevel = LUINGO_LEVELS.find((l) => l.level === level) || LUINGO_LEVELS[0];

  return (
    <div className={`flex items-center gap-1.5 bg-gradient-to-r ${currentLevel.color} rounded-full px-2 py-1 shadow-sm`}>
      <span className="text-sm">{currentLevel.icon}</span>
      <span className="text-xs text-slate-800 font-bold">
        Nv.{level}
      </span>
      <span className="text-xs text-slate-600">·</span>
      <span className="text-xs text-slate-700 font-bold">{xp} XP</span>
    </div>
  );
};