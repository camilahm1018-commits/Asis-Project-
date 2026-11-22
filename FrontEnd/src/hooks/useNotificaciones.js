import { useEffect, useRef, useState } from 'react';
import api from '../services/api.js';

export function useNotificaciones(idUsuario) {
  const [notificaciones, setNotificaciones] = useState([]);
  const lecturaLocal = useRef(new Set());
  const audio = useRef(null);

  useEffect(() => {
    if (!idUsuario) return;

    let idsConocidos;
    let activa = true;
    let pendiente = false;
    const controlador = new AbortController();
    lecturaLocal.current = new Set();

    async function consultar() {
      if (pendiente) return;
      pendiente = true;
      try {
        const { data } = await api.get(`/notificaciones/usuario/${idUsuario}`, {
          signal: controlador.signal,
        });
        if (!activa) return;
        const leidas = lecturaLocal.current;
        const nuevas = idsConocidos && data.some((n) =>
          !n.enviada && !leidas.has(n.id_notificacion) && !idsConocidos.has(n.id_notificacion)
        );
        idsConocidos = new Set(data.map((n) => n.id_notificacion));
        if (nuevas) {
          audio.current ??= new Audio('/notificacion.mp3');
          audio.current.play().catch(() => {});
        }
        setNotificaciones(data.map((n) =>
          leidas.has(n.id_notificacion) ? { ...n, enviada: true } : n
        ));
      } catch (error) {
        if (activa) console.error('Error al obtener notificaciones:', error);
      } finally {
        pendiente = false;
      }
    }

    consultar();
    const intervalo = setInterval(consultar, 10000);
    return () => {
      activa = false;
      controlador.abort();
      clearInterval(intervalo);
    };
  }, [idUsuario]);

  async function marcarComoLeida(idNotificacion) {
    const leidas = lecturaLocal.current;
    if (leidas.has(idNotificacion)) return;
    try {
      await api.put(`/notificaciones/marcar-leida/${idNotificacion}`);
      leidas.add(idNotificacion);
      if (leidas !== lecturaLocal.current) return;
      setNotificaciones((prev) => prev.map((n) =>
        n.id_notificacion === idNotificacion ? { ...n, enviada: true } : n
      ));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  }

  const noLeidasCount = notificaciones.filter((n) => !n.enviada).length;
  return { notificaciones, noLeidasCount, marcarComoLeida };
}
