// La lista de la semana, día por día, con arrastrar y soltar: mantené apretada
// una sesión pendiente y soltala en otro día. Mientras arrastrás aparecen
// también los días sin sesiones, para poder soltar ahí.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import type { SessionView } from '@/data/types';
import { weekDays } from '@/data/calc/dates';
import { fmtDateLong } from '@/utils/format';
import Colors from '@/constants/colors';
import SessionCard from './SessionCard';
import common from './screenStyles';

export interface WeekScroll {
  ref: React.RefObject<ScrollView | null>;
  /** Lo que envuelve al ScrollView: su lugar en la pantalla. */
  frame: React.RefObject<View | null>;
  /** Desplazamiento actual del ScrollView. */
  y: React.MutableRefObject<number>;
  /** Alto de todo el contenido del ScrollView. */
  content: React.MutableRefObject<number>;
}

interface Props {
  monday: string;
  today: string;
  sessions: SessionView[];
  scroll: WeekScroll;
  /** Posición de cada día dentro de la lista (para saltar desde la tira). */
  positions: React.MutableRefObject<Record<string, number>>;
  onOpen: (id: string) => void;
  onMove: (id: string, date: string) => Promise<void>;
  onDragging: (active: boolean) => void;
}

// top: dónde estaba la tarjeta en la lista; grab: dónde la agarró el dedo; *Abs: el
// dedo en la pantalla; view: el ScrollView en la pantalla.
interface Drag { session: SessionView; top: number; startAbs: number; startScroll: number; grab: number; lastAbs: number; view: { top: number; h: number } }

const EDGE = 90, SPEED = 14;

export default function WeekDays({ monday, today, sessions, scroll, positions, onOpen, onMove, onDragging }: Props) {
  const [dragging, setDragging] = useState<{ session: SessionView; top: number } | null>(null), [hover, setHover] = useState<string | null>(null), [error, setError] = useState(false);
  const drag = useRef<Drag | null>(null), hoverRef = useRef<string | null>(null), justDropped = useRef(false), frame = useRef<number | null>(null), pending = useRef<string | null>(null);
  const root = useRef<View>(null), dayViews = useRef<Record<string, View>>({}), cardViews = useRef<Record<string, View>>({});
  const days = useRef<Record<string, { y: number; h: number }>>({});
  const ty = useRef(new Animated.Value(0)).current;
  const dates = useMemo(() => weekDays(monday), [monday]);

  // Posición de cada día dentro de la lista. Se mide en el momento (y no con
  // onLayout) porque en web onLayout no avisa si un día solo se corrió de lugar.
  const measureDays = useCallback(() => {
    if (!root.current) return;
    for (const [date, view] of Object.entries(dayViews.current)) view.measureLayout(root.current, (_x, y, _w, h) => {
      if (dayViews.current[date] !== view) return;
      days.current[date] = { y, h };
      positions.current[date] = y;
    }, () => {});
  }, [positions]);
  useEffect(measureDays);

  // Dónde está el dedo, en coordenadas de esta lista.
  const fingerY = (d: Drag) => d.top + d.grab + (d.lastAbs - d.startAbs) + (scroll.y.current - d.startScroll);

  const update = useCallback(() => {
    const d = drag.current;
    if (!d) return;
    measureDays();
    ty.setValue(fingerY(d) - d.grab - d.top);
    const y = fingerY(d), laid = dates.filter(x => days.current[x]);
    let target: string | null = null;
    if (laid.length && y >= days.current[laid[0]].y - 40) {
      const last = laid[laid.length - 1];
      if (y <= days.current[last].y + days.current[last].h + 40) target = [...laid].reverse().find(x => days.current[x].y <= y) ?? laid[0];
    }
    if (target !== hoverRef.current) {
      hoverRef.current = target;
      setHover(target);
      if (target) void Haptics.selectionAsync();
    }
  }, [dates, measureDays, ty]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si el dedo llega a un borde de la pantalla, la lista se desplaza sola.
  const tick = useCallback(() => {
    const d = drag.current;
    if (!d) return;
    const vy = d.lastAbs - d.view.top, h = d.view.h;
    const v = !h || !scroll.content.current ? 0 : vy < EDGE ? -SPEED * (EDGE - vy) / EDGE : vy > h - EDGE ? SPEED * (vy - h + EDGE) / EDGE : 0;
    const next = Math.max(0, Math.min(scroll.content.current - h, scroll.y.current + v));
    if (v && Math.abs(next - scroll.y.current) > 0.5) {
      scroll.ref.current?.scrollTo({ y: next, animated: false });
      scroll.y.current = next;
      update();
    }
    frame.current = requestAnimationFrame(tick);
  }, [scroll, update]);

  const start = useCallback((s: SessionView, grab: number, abs: number) => {
    const card = cardViews.current[s.id];
    if (!card || !root.current) return;
    const view = { top: 0, h: 0 };
    pending.current = s.id;
    scroll.frame.current?.measureInWindow((_x, y, _w, h) => { view.top = y; view.h = h; });
    card.measureLayout(root.current, (_x, top) => {
      if (pending.current !== s.id) return; // se soltó antes de terminar de medir
      pending.current = null;
      drag.current = { session: s, top, startAbs: abs, startScroll: scroll.y.current, grab, lastAbs: abs, view };
      hoverRef.current = s.date;
      ty.setValue(0);
      setHover(s.date);
      setDragging({ session: s, top });
      setError(false);
      onDragging(true);
      justDropped.current = true;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      frame.current = requestAnimationFrame(tick);
    }, () => {});
  }, [onDragging, scroll, tick, ty]);

  const move = useCallback((abs: number) => {
    if (!drag.current) return;
    drag.current.lastAbs = abs;
    update();
  }, [update]);

  const end = useCallback((drop: boolean) => {
    pending.current = null;
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (frame.current != null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const target = hoverRef.current;
    hoverRef.current = null;
    setHover(null);
    setDragging(null);
    onDragging(false);
    // El soltar no tiene que abrir la sesión.
    setTimeout(() => { justDropped.current = false; }, 250);
    if (!drop || !target || target === d.session.date) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMove(d.session.id, target).catch(() => setError(true));
  }, [onDragging, onMove]);

  useEffect(() => () => { if (frame.current != null) cancelAnimationFrame(frame.current); }, []);

  const handlers = useRef({ start, move, end });
  handlers.current = { start, move, end };
  const open = useCallback((id: string) => { if (!justDropped.current) onOpen(id); }, [onOpen]);

  const register = useCallback((id: string, view: View | null) => { if (view) cardViews.current[id] = view; else delete cardViews.current[id]; }, []);

  return <View ref={root}>
    {error && <Text style={[common.error, common.inset, styles.error]}>No se pudo mover el entrenamiento. Probá de nuevo.</Text>}
    {dates.map(date => {
      const list = sessions.filter(s => s.date === date), target = !!dragging && hover === date;
      if (!list.length && !dragging) return null;
      return <View key={date} ref={v => { if (v) dayViews.current[date] = v; else { delete dayViews.current[date]; delete days.current[date]; delete positions.current[date]; } }} onLayout={measureDays}>
        {target && <View pointerEvents="none" style={styles.target} />}
        <Text style={[common.section, (date === today || target) && { color: Colors.accent }]}>{fmtDateLong(date).split(' de ')[0].toUpperCase()}{date === today ? ' · HOY' : ''}</Text>
        {list.length ? list.map(s => <DraggableSession key={s.id} session={s} handlers={handlers} lifted={dragging?.session.id === s.id} register={register} onOpen={open} />)
          : <View style={styles.drop}><Text style={styles.dropText}>Soltalo acá</Text></View>}
      </View>;
    })}
    {dragging && <Animated.View pointerEvents="none" style={[styles.floating, { top: dragging.top, transform: [{ translateY: ty }, { scale: 1.03 }] }]}>
      <View style={styles.floatingCard}><View style={styles.floatingInner}><SessionCard session={dragging.session} compact onPress={() => {}} /></View></View>
    </Animated.View>}
  </View>;
}

type Handlers = React.MutableRefObject<{ start: (s: SessionView, grab: number, abs: number) => void; move: (abs: number) => void; end: (drop: boolean) => void }>;

// Solo se mueven las pendientes: una hecha ya está atada a su actividad de Strava.
const DraggableSession = React.memo(function DraggableSession({ session, handlers, lifted, register, onOpen }: { session: SessionView; handlers: Handlers; lifted: boolean; register: (id: string, view: View | null) => void; onOpen: (id: string) => void }) {
  const gesture = useMemo(() => Gesture.Pan()
    .enabled(session.status === 'planned')
    .activateAfterLongPress(350)
    .runOnJS(true)
    .onStart(e => handlers.current.start(session, e.y, e.absoluteY))
    .onUpdate(e => handlers.current.move(e.absoluteY))
    .onFinalize((_, success) => handlers.current.end(success)), [session, handlers]);
  return <GestureDetector gesture={gesture}>
    <View ref={v => register(session.id, v)} collapsable={false} style={lifted && styles.lifted}>
      <SessionCard session={session} compact onPress={() => onOpen(session.id)} />
    </View>
  </GestureDetector>;
});

const styles = StyleSheet.create({
  error: { marginTop: 0, marginBottom: 12 },
  target: { ...StyleSheet.absoluteFillObject, left: 8, right: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.accent + '60', backgroundColor: Colors.accent + '12' },
  drop: { marginHorizontal: 20, marginBottom: 12, height: 56, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.cardBorder, justifyContent: 'center', alignItems: 'center' },
  dropText: { color: Colors.textTertiary, fontSize: 13, fontWeight: '600' },
  lifted: { opacity: 0.3 },
  floating: { position: 'absolute', left: 20, right: 20, zIndex: 10, elevation: 10, shadowColor: Colors.background, shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  floatingCard: { backgroundColor: Colors.background, borderRadius: 16, overflow: 'hidden' },
  floatingInner: { marginHorizontal: -20, marginBottom: -12 },
});
