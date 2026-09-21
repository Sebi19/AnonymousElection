import { useEffect, useRef, useState } from 'react';
import { Group, Text, ThemeIcon } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

function formatRemaining(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (days > 0) return `${days}t ${pad(hours)}h ${pad(minutes)}m`;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface ElectionCountdownProps {
    endDate: string;
    // Called once, as soon as the countdown reaches zero
    onExpire?: () => void;
}

export function ElectionCountdown({ endDate, onExpire }: ElectionCountdownProps) {
    const targetMs = new Date(endDate).getTime();
    const [remainingMs, setRemainingMs] = useState(() => targetMs - Date.now());
    const hasExpiredRef = useRef(false);

    useEffect(() => {
        hasExpiredRef.current = false;
        const tick = () => setRemainingMs(targetMs - Date.now());
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [targetMs]);

    useEffect(() => {
        if (remainingMs <= 0 && !hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpire?.();
        }
    }, [remainingMs, onExpire]);

    const isExpired = remainingMs <= 0;

    return (
        <Group gap="xs">
            <ThemeIcon variant="light" color={isExpired ? 'gray' : 'blue'} size="sm" radius="xl">
                <IconClock size={14} />
            </ThemeIcon>
            <Text size="sm" c={isExpired ? 'dimmed' : undefined} fw={500}>
                {isExpired ? 'Wahl wird abgeschlossen…' : `Endet in ${formatRemaining(remainingMs)}`}
            </Text>
        </Group>
    );
}
