// FrontEnd/src/hooks/useNotificaciones.js
import { useState, useEffect, useRef } from 'react';
import api from '../services/api.js'; // Ajustado a tu estructura de carpetas

export function useNotificaciones(idUsuario) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidasCount, setNoLeidasCount] = useState(0);
  
  // Referencia al audio para que no se recargue en cada render
  const audioRef = useRef(new Audio('/notificacion.mp3'));

  const fetchNotificaciones = async () => {
    if (!idUsuario) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get(`/notificaciones/usuario/${idUsuario}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data;
      // Asumimos que enviada: false significa que el usuario aún no la ha leído
      const noLeidas = data.filter(n => !n.enviada);

      // Si el número de no leídas aumenta, reproducimos el sonido
      if (noLeidas.length > noLeidasCount && noLeidasCount >= 0) {
        audioRef.current.play().catch(err => {
          console.log("El navegador bloqueó el audio hasta que el usuario interactúe con la página");
        });
      }

      setNotificaciones(data);
      setNoLeidasCount(noLeidas.length);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
    }
  };

  useEffect(() => {
    if (!idUsuario) return;
    
    // Primera carga inmediata
    fetchNotificaciones();
    
    // Polling: consultar al backend cada 10 segundos (10000 ms)
    const intervalId = setInterval(fetchNotificaciones, 10000);
    
    return () => clearInterval(intervalId); // Limpiar al desmontar
  }, [idUsuario]);

  const marcarComoLeida = async (idNotificacion) => {
    try {
      const token = localStorage.getItem('access_token');
      await api.put(`/notificaciones/marcar-leida/${idNotificacion}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Actualizar estado local inmediatamente para una UX fluida
      setNotificaciones(prev => 
        prev.map(n => n.id_notificacion === idNotificacion ? { ...n, enviada: true } : n)
      );
      setNoLeidasCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  };

  return { notificaciones, noLeidasCount, marcarComoLeida };
}