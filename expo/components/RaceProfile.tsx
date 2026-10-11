import React from 'react';
import { View, Text } from 'react-native';
import { Map } from 'lucide-react-native';
import type { Race, SessionView } from '@/data/types';
import Colors from '@/constants/colors';
import { fmtDate } from '@/utils/format';
import s from './screenStyles';
import GlassCard from './GlassCard';
import DisciplineDot from './DisciplineDot';
import FieldValue from './FieldValue';
import ElevationChart from './ElevationChart';
import ClimateBand from './ClimateBand';
import EmptyState from './EmptyState';
import SessionCard from './SessionCard';

const unit = (suffix: string) => (n: unknown) => `${Number(n).toLocaleString('es-AR')} ${suffix}`;
const waters: Record<string, string> = { mar: 'Mar', lago: 'Lago', rio: 'Río', pileta: 'Pileta' };
export default React.memo(function RaceProfile({ race, isNext, sessions, preparationState, onSession }: {
  race: Race; isNext: boolean; sessions: SessionView[]; preparationState?: React.ReactNode; onSession: (id: string) => void;
}) {
  const { swim, bike, run } = race.profile;
  const hasFields = (segment: object | undefined) => segment && Object.values(segment).some(Boolean);
  return <>
    {!hasFields(swim) && !hasFields(bike) && !hasFields(run) && <EmptyState icon={Map} title="Todavía no hay datos del recorrido" />}
    {hasFields(swim) && <><SegmentTitle discipline="swim" title="NADO" /><GlassCard accentColor={Colors.swim}>
      <FieldValue label="Distancia" field={swim?.distance_m} format={unit('m')} />
      <FieldValue label="Agua" field={swim?.water_type} format={value => waters[String(value)] ?? String(value)} />
      <FieldValue label="Agua salada" field={swim?.salt} format={value => value ? 'Sí' : 'No'} />
      <FieldValue label="Temperatura del agua" field={swim?.temp_c} format={unit('°C')} />
      <FieldValue label="Neopreno" field={swim?.wetsuit} /><FieldValue label="Largada" field={swim?.start_type} /><FieldValue label="Recorrido" field={swim?.course_shape} />
    </GlassCard></>}
    {hasFields(bike) && <><SegmentTitle discipline="bike" title="BICI" /><GlassCard accentColor={Colors.bike}>
      <ElevationChart field={bike?.profile_points} color={Colors.bike} />
      <FieldValue label="Distancia" field={bike?.distance_km} format={unit('km')} /><FieldValue label="Desnivel" field={bike?.elev_gain_m} format={unit('m')} />
      <FieldValue label="Subidas clave" field={bike?.key_climbs} stacked format={value => (value as string[]).map(v => `• ${v}`).join('\n')} />
      <FieldValue label="Puestos de hidratación" field={bike?.aid_stations} /><FieldValue label="Calles" field={bike?.roads} />
    </GlassCard></>}
    {hasFields(run) && <><SegmentTitle discipline="run" title="TROTE" /><GlassCard accentColor={Colors.run}>
      <ElevationChart field={run?.profile_points} color={Colors.run} />
      <FieldValue label="Distancia" field={run?.distance_km} format={unit('km')} /><FieldValue label="Desnivel" field={run?.elev_gain_m} format={unit('m')} />
      <FieldValue label="Vueltas" field={run?.loops} format={n => `${n} ${n === 1 ? 'vuelta' : 'vueltas'}`} /><FieldValue label="Superficie" field={run?.surface} />
    </GlassCard></>}
    <Text style={s.section}>CLIMA A LA HORA DE CADA TRAMO</Text><GlassCard>
      {race.climate ? <>{race.climate.by_segment.map((row, i) => <ClimateBand key={`${row.segment}-${i}`} row={row} />)}
        {race.climate.forecast && <><Text style={s.title}>Pronóstico</Text><Text style={s.secondary}>{race.climate.forecast.temp_c} °C · sensación {race.climate.forecast.feels_c} · viento {race.climate.forecast.wind_kmh} km/h · lluvia {race.climate.forecast.rain_pct} %</Text></>}
        <Text style={[s.secondary, { fontSize: 11, color: Colors.textTertiary, marginTop: 12 }]}>{race.climate.by_segment.length ? `Histórico de ${race.climate.by_segment[0].years} años · ` : ''}actualizado {fmtDate(race.climate.updated_at.slice(0, 10))}</Text>
      </> : <Text style={s.secondary}>Todavía no hay datos de clima.</Text>}
    </GlassCard>
    {isNext && <><Text style={s.section}>CÓMO TE ESTAMOS PREPARANDO</Text>
      {preparationState ?? (sessions.length ? sessions.map(session => <View key={session.id}><SessionCard session={session} compact onPress={() => onSession(session.id)} />
        {!!session.prescription.why && <Text style={[s.secondary, s.inset, { marginBottom: 16 }]}>{session.prescription.why}</Text>}</View>) : <Text style={[s.secondary, s.inset]}>Esta semana no hay sesiones específicas para esta carrera.</Text>)}
    </>}
  </>;
});

const SegmentTitle = React.memo(function SegmentTitle({ discipline, title }: { discipline: 'swim' | 'bike' | 'run'; title: string }) {
  return <View style={[s.row, s.inset, { marginBottom: 12, marginTop: 8 }]}><DisciplineDot discipline={discipline} /><Text style={[s.label, { letterSpacing: 1.5 }]}>{title}</Text></View>;
});
