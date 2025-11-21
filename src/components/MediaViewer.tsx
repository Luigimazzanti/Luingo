import React, { useState } from 'react';
import { Material } from '../types';
import { Play, FileText, ExternalLink, Image as ImageIcon, Video, MousePointerClick } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface MediaViewerProps {
  materials: Material[];
  onSelectMaterial: (materialId: string) => void;
}

/**
 * COMPONENTE VISOR DE MATERIALES "PLAYFUL"
 */
export const MediaViewer: React.FC<MediaViewerProps> = ({ materials, onSelectMaterial }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    materials[0] || null
  );

  const videoMaterials = materials.filter((m) => m.type === 'video');
  const pdfMaterials = materials.filter((m) => m.type === 'pdf');
  const geniallyMaterials = materials.filter((m) => m.type === 'genially');
  const otherMaterials = materials.filter(
    (m) => m.type !== 'video' && m.type !== 'pdf' && m.type !== 'genially'
  );

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    onSelectMaterial(material.id);
  };

  const renderMaterialContent = (material: Material) => {
    switch (material.type) {
      case 'video':
        return (
          <div className="aspect-video rounded-3xl overflow-hidden bg-black shadow-xl border-4 border-slate-800 ring-4 ring-slate-200">
            <iframe
              src={material.url}
              title={material.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="bg-white rounded-3xl overflow-hidden border-4 border-emerald-200 shadow-xl">
            <div className="p-4 bg-emerald-50 border-b-2 border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                    <FileText className="w-5 h-5" />
                </div>
                <span className="text-emerald-900 font-bold">
                  {material.title}
                </span>
              </div>
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-all"
              >
                Abrir en nueva pestaña
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="h-[500px] bg-slate-50 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="text-center relative z-10">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-emerald-100">
                    <FileText className="w-10 h-10 text-emerald-400" />
                </div>
                <p className="text-slate-800 font-black text-xl mb-2">
                  Visor de PDF
                </p>
                <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">
                  Aquí verías el documento directamente para leerlo sin salir de LuinGo.
                </p>
              </div>
            </div>
          </div>
        );

      case 'genially':
        return (
          <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100 shadow-xl border-4 border-amber-200 ring-4 ring-amber-50">
            {material.embed_code ? (
              <div
                dangerouslySetInnerHTML={{ __html: material.embed_code }}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10 bg-amber-100" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="text-center relative z-10">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_8px_0_rgba(251,191,36,0.2)] border-2 border-amber-100 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                      <MousePointerClick className="w-12 h-12 text-amber-500" />
                  </div>
                  <p className="text-amber-900 font-black text-2xl mb-4">
                    Actividad Interactiva
                  </p>
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all"
                  >
                    Jugar en Genially 🚀
                  </a>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="aspect-video rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center shadow-xl border-4 border-indigo-100">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border-2 border-indigo-100">
                 <ExternalLink className="w-10 h-10 text-indigo-400" />
              </div>
              <p className="text-indigo-900 font-bold text-xl mb-4">
                {material.title}
              </p>
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-black underline decoration-4 decoration-indigo-200 hover:decoration-indigo-400"
              >
                Abrir enlace externo
              </a>
            </div>
          </div>
        );
    }
  };

  const MaterialThumbnail: React.FC<{ material: Material; isSelected: boolean }> = ({
    material,
    isSelected,
  }) => {
    const getIcon = () => {
      switch (material.type) {
        case 'video':
          return <Video className="w-5 h-5" />;
        case 'pdf':
          return <FileText className="w-5 h-5" />;
        case 'genially':
          return <MousePointerClick className="w-5 h-5" />;
        default:
          return <ImageIcon className="w-5 h-5" />;
      }
    };

    const getTheme = () => {
      switch (material.type) {
        case 'video':
          return { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-500', activeBorder: 'border-rose-400' };
        case 'pdf':
            return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', activeBorder: 'border-emerald-400' };
        case 'genially':
            return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', activeBorder: 'border-amber-400' };
        default:
            return { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-500', activeBorder: 'border-indigo-400' };
      }
    };

    const theme = getTheme();

    return (
      <div
        onClick={() => handleSelectMaterial(material)}
        className={`cursor-pointer p-4 rounded-2xl transition-all duration-200 border-b-4 ${
          isSelected
            ? `bg-white ${theme.activeBorder} shadow-md translate-x-2`
            : `bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50`
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${theme.bg} ${theme.border} ${theme.icon}`}
          >
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`truncate text-sm font-bold ${
                isSelected ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              {material.title}
            </p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{material.type}</p>
          </div>
          {isSelected && (
              <div className={`w-3 h-3 rounded-full ${theme.icon.replace('text-', 'bg-')}`}></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel de materiales (lista lateral) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                    <Play className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Playlist</h3>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 p-1 bg-slate-100 rounded-xl h-10">
                <TabsTrigger value="all" className="text-[10px] font-bold rounded-lg uppercase data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="video" className="text-[10px] font-bold rounded-lg uppercase data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm">
                  Video
                </TabsTrigger>
                <TabsTrigger value="pdf" className="text-[10px] font-bold rounded-lg uppercase data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">
                  PDF
                </TabsTrigger>
                <TabsTrigger value="other" className="text-[10px] font-bold rounded-lg uppercase data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">
                  Apps
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-0 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {materials.map((material) => (
                  <MaterialThumbnail
                    key={material.id}
                    material={material}
                    isSelected={selectedMaterial?.id === material.id}
                  />
                ))}
              </TabsContent>

              <TabsContent value="video" className="space-y-3 mt-0">
                {videoMaterials.map((material) => (
                  <MaterialThumbnail
                    key={material.id}
                    material={material}
                    isSelected={selectedMaterial?.id === material.id}
                  />
                ))}
              </TabsContent>

              <TabsContent value="pdf" className="space-y-3 mt-0">
                {pdfMaterials.map((material) => (
                  <MaterialThumbnail
                    key={material.id}
                    material={material}
                    isSelected={selectedMaterial?.id === material.id}
                  />
                ))}
              </TabsContent>

              <TabsContent value="other" className="space-y-3 mt-0">
                {[...geniallyMaterials, ...otherMaterials].map((material) => (
                  <MaterialThumbnail
                    key={material.id}
                    material={material}
                    isSelected={selectedMaterial?.id === material.id}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Visor principal */}
        <div className="lg:col-span-2">
          {selectedMaterial ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white rounded-3xl p-6 shadow-sm border-b-4 border-slate-200">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedMaterial.title}</h2>
                        <div className="flex items-center gap-2">
                             <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase tracking-wider">
                                 {selectedMaterial.type}
                             </span>
                            {selectedMaterial.duration && (
                            <span className="text-sm font-medium text-slate-400">
                                ⏱ {Math.floor(selectedMaterial.duration / 60)} min
                            </span>
                            )}
                        </div>
                    </div>
                </div>
              </div>
              {renderMaterialContent(selectedMaterial)}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-3xl border-4 border-dashed border-slate-200 p-10">
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-10 h-10 text-slate-300 ml-1" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">¡Listo para aprender!</h3>
                <p className="text-slate-500">Selecciona un material de la lista para empezar.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};