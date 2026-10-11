import React from 'react';
import { CloudOff } from 'lucide-react-native';
import EmptyState from './EmptyState';
export default React.memo(function ErrorState({ onRetry }: { onRetry: () => void }) { return <EmptyState icon={CloudOff} title="No pudimos cargar esto" body="Revisá la conexión y probá de nuevo." actionLabel="Reintentar" onAction={onRetry} />; });
