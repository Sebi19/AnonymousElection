import { useEffect, useState } from 'react';
import {Paper, Text, Progress, Group, Stack, Loader, Center, Grid} from '@mantine/core';
import { PieChart } from '@mantine/charts';
import { client } from '../../api';
import { type ElectionResultDto } from '../../api/generated';

const CHART_COLORS = [
    'indigo.6', 'teal.6', 'pink.6', 'orange.6', 'violet.6',
    'cyan.6', 'lime.6', 'grape.6', 'yellow.6', 'blue.6',
    'red.6', 'green.6'
];
export function ElectionResults({ electionId }: { electionId: number }) {
    const [results, setResults] = useState<ElectionResultDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.api.getResults(electionId)
            .then(res => setResults(res.data))
            .catch(err => console.error("Failed to load results", err))
            .finally(() => setLoading(false));
    }, [electionId]);

    if (loading) return <Center p="xl"><Loader /></Center>;

    // Abstentions are excluded from the chart and percentage calculations
    const abstentions = results.find(r => r.candidateName === 'Abstain')?.count || 0;
    const validResults = results.filter(r => r.candidateName !== 'Abstain');

    // Calculate totals for percentage bars (valid votes only)
    const totalValidVotes = validResults.reduce((sum, r) => sum + (r.count || 0), 0);
    const totalVotes = totalValidVotes + abstentions;

    const isAbsoluteMajority = validResults.some(r => (r.count || 0) > totalValidVotes / 2);

    // Sort by count (winner on top)
    const sortedResults = [...validResults].sort((a, b) => (b.count || 0) - (a.count || 0));

    const chartData = sortedResults.map((r, index) => {
        // Assign colors dynamically based on rank
        return {
            name: r.candidateName || 'Unknown',
            value: r.count || 0,
            color: CHART_COLORS[index % CHART_COLORS.length]
        };
    });

    return (
        <Paper p="lg" radius="md" withBorder>
            <Text size="lg" fw={700} mb="xl">Finales Ergebnis</Text>

            <Grid gutter="xl">
                {/* LEFT COLUMN: PIE CHART */}
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Center>
                        <PieChart
                            data={chartData}
                            withTooltip
                            tooltipDataSource="segment"
                            size={220}
                            strokeWidth={1}
                            withLabels
                            withLabelsLine
                            labelsPosition="outside"
                            labelsType="percent"
                        />
                    </Center>
                </Grid.Col>

                {/* RIGHT COLUMN: LIST & BARS */}
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="lg">
                        {sortedResults.map((result, index) => {
                            const count = result.count || 0;
                            const percentage = totalValidVotes > 0 ? (count / totalValidVotes) * 100 : 0;
                            const isWinner = count > 0 && count == sortedResults[0].count;
                            const isTopTwo = count > 0 && count >= sortedResults[1]?.count;

                            // Match color logic from chart
                            const color = CHART_COLORS[index % CHART_COLORS.length];

                            return (
                                <div key={result.candidateName}>
                                    <Group justify="space-between" mb={5}>
                                        <Text fw={isWinner ? 700 : 500}>
                                            {result.candidateName} {isWinner && isAbsoluteMajority && '👑'}{!isAbsoluteMajority && isTopTwo && '⚔️'}
                                        </Text>
                                        <Text fw={700}>{count} Stimme{count > 1 ? 'n' : ''} ({percentage.toFixed(1)}%)</Text>
                                    </Group>
                                    <Progress
                                        value={percentage}
                                        size="xl"
                                        radius="xl"
                                        color={color}
                                    />
                                </div>
                            );
                        })}
                    </Stack>
                </Grid.Col>
            </Grid>


            <Group justify="center" gap="xs" mt="xl">
                <Text c="dimmed" size="sm">
                    Abgegebene Stimmen: {totalVotes}
                </Text>
                <Text c="dimmed" size="sm">·</Text>
                <Text c="dimmed" size="sm">
                    Gültige Stimmen: {totalValidVotes}
                </Text>
                <Text c="dimmed" size="sm">·</Text>
                <Text c="dimmed" size="sm">
                    Enthaltungen: {abstentions}
                </Text>
            </Group>
        </Paper>
    );
}