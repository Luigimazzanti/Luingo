import React, { useState } from 'react';
import { Bell, Check, X, Sparkles, MessageSquare, Award, FileText } from 'lucide-react';
import { Notification } from '../types';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onClearAll: () => void;
}

/**
 * COMPONENTE: CAMPANA DE NOTIFICACIONES
 * 
 * Sistema de alertas no intrusivas en tiempo real
 * - Notificaciones tipo toast en el header
 * - Badge con contador de no leídas
 * - Colores según tipo de notificación
 * - Compatible con Supabase Real-time
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'comment_corrected':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'grade_received':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'level_up':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    // Use subtler backgrounds instead of gradients
    switch (type) {
      case 'task_assigned':
        return 'bg-blue-50 border-blue-100';
      case 'comment_corrected':
        return 'bg-green-50 border-green-100';
      case 'grade_received':
        return 'bg-amber-50 border-amber-100';
      case 'level_up':
        return 'bg-purple-50 border-purple-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-gray-100"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl border-gray-200" align="end">
        <div className="bg-white rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="text-xs text-gray-500 hover:text-gray-900 h-auto py-1 px-2"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Bell className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-900">Sin novedades</p>
              <p className="text-xs text-gray-500 mt-1">
                Te avisaremos aquí
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`mb-2 rounded-lg p-3 transition-colors border ${getNotificationColor(notification.type)} ${
                        !notification.is_read ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                        <div className="flex items-start gap-3">
                          {/* Icono */}
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 mb-0.5">
                                  {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
                                  {notification.message}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                  {new Date(notification.created_at).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                              </p>
                          </div>
                              
                          {/* Botón marcar como leída */}
                          {!notification.is_read && (
                                <button
                                  onClick={() => onMarkAsRead(notification.id)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Marcar como leída"
                                >
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                </button>
                          )}
                        </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
