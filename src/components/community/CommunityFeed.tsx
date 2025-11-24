import React, { useState } from 'react';
import { Material, Student } from '../../types';
import { SocialCard } from './SocialCard';
import { ArticleReader } from './ArticleReader';
import { Filter, Globe, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CommunityFeedProps {
  materials: Material[];
  student: Student;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({ materials, student }) => {
  const [filterMode, setFilterMode] = useState<'my_level' | 'all'>('my_level');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // ✅ SAFE GUARDS: Si student es undefined, usamos un fallback para no romper la app
  const safeLevel = student?.current_level_code || 'A1';

  // --- SMART FILTERING LOGIC ---
  const filteredMaterials = materials.filter(mat => {
      if (filterMode === 'all') return true;
      // Logic: Show if targeted to student's level code OR 'ALL'
      return mat.target_levels.includes(safeLevel) || mat.target_levels.includes('ALL');
  });

  const handleMaterialClick = (mat: Material) => {
      if (mat.type === 'article') {
          setSelectedMaterial(mat);
      } else {
          // Open external link/video logic
          window.open(mat.url, '_blank');
      }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      
      {/* --- HEADER & CONTROLS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                  Comunidad
              </h1>
              <p className="text-slate-500 font-medium">
                  Descubre lo que está pasando en tu clase de español.
              </p>
          </div>

          {/* Level Filter Switch */}
          <div className="bg-slate-100 p-1 rounded-xl inline-flex self-start">
              <button
                onClick={() => setFilterMode('my_level')}
                className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                    filterMode === 'my_level' 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                )}
              >
                  <Lock className="w-4 h-4" />
                  Mi Nivel ({safeLevel})
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                    filterMode === 'all' 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                )}
              >
                  <Globe className="w-4 h-4" />
                  Explorar Todo
              </button>
          </div>
      </div>

      {/* --- FEED GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map(material => (
              <SocialCard 
                key={material.id} 
                material={material} 
                studentLevel={safeLevel}
                onClick={() => handleMaterialClick(material)}
              />
          ))}
      </div>

      {/* Empty State */}
      {filteredMaterials.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">No hay posts para tu nivel aún.</p>
              <button 
                onClick={() => setFilterMode('all')}
                className="text-indigo-600 text-sm font-bold mt-2 hover:underline"
              >
                  Ver posts de otros niveles
              </button>
          </div>
      )}

      {/* --- READERS --- */}
      {selectedMaterial && selectedMaterial.type === 'article' && (
          <ArticleReader 
            material={selectedMaterial} 
            onClose={() => setSelectedMaterial(null)} 
          />
      )}

    </div>
  );
};