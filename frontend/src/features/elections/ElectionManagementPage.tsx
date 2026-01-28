import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Title,
    Table,
    Group,
    Button,
    ActionIcon,
    Badge,
    Paper,
    LoadingOverlay,
    Card,
    Stack,
    Box,
    Text,
    Divider
} from '@mantine/core';
import { IconPlus, IconTrash, IconCheck, IconUser } from '@tabler/icons-react';
import { openConfirmModal } from '@mantine/modals';
import { useAuth } from '../auth/AuthContext';
import { client } from '../../api';
import { type ElectionDto } from '../../api/generated';
import { useDocumentTitle } from "@mantine/hooks";

export function ElectionManagementPage() {
    useDocumentTitle('Wahlen | Kapitänswahl');
    const navigate = useNavigate();
    const { user } = useAuth();
    const [elections, setElections] = useState<ElectionDto[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.role === 'ROLE_ADMIN';

    useEffect(() => {
        loadElections();
    }, []);

    const loadElections = async () => {
        try {
            setLoading(true);
            const response = await client.api.getElections();
            setElections(response.data);
        } catch (error) {
            console.error("Failed to fetch elections", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Helpers ---
    const translateStatus = (status: string) => {
        switch (status) {
            case 'OPEN': return 'Offen';
            case 'COMPLETED': return 'Abgeschlossen';
            default: return status;
        }
    };

    const totalEligible = (election: ElectionDto) => election.eligibleVoters?.length || 0;
    const totalVoted = (election: ElectionDto) => election.userIdsWhoVoted?.length || 0;
    const hasVoted = (election: ElectionDto) => election.userIdsWhoVoted?.includes(user?.id!) || false;

    const openDeleteModal = (election: ElectionDto) => {
        openConfirmModal({
            title: 'Wahl löschen',
            centered: true,
            children: (
                <p>Möchtest du die Wahl <strong>{election.title}</strong> wirklich löschen? Alle bereits abgegebenen Stimmen werden vernichtet.</p>
            ),
            labels: { confirm: 'Wahl löschen', cancel: 'Abbrechen' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await client.api.deleteElection(election.id!);
                    setElections(prev => prev.filter(e => e.id !== election.id));
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    // --- 1. DESKTOP VIEW (Table Rows) ---
    const desktopRows = elections.map((election) => (
        <Table.Tr
            key={election.id}
            onClick={() => navigate(`/elections/${election.id}`)}
            style={{ cursor: 'pointer' }}
        >
            <Table.Td fw={500}>{election.title}</Table.Td>

            <Table.Td>
                <Badge color={election.status === 'OPEN' ? 'green' : 'gray'} variant="light">
                    {translateStatus(election.status!)}
                </Badge>
            </Table.Td>

            <Table.Td>
                {hasVoted(election) ? (
                    <Badge color="blue" leftSection={<IconCheck size={12} />}>Teilgenommen</Badge>
                ) : (
                    <Badge color="gray" variant="outline">Nicht teilgenommen</Badge>
                )}
            </Table.Td>

            <Table.Td>
                <Badge variant="light" color="blue">
                    {totalVoted(election)} / {totalEligible(election)}
                </Badge>
            </Table.Td>

            <Table.Td align="right">
                <Group gap="xs" justify="flex-end">
                    {isAdmin && (
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(election);
                            }}
                        >
                            <IconTrash size={16} />
                        </ActionIcon>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    // --- 2. MOBILE VIEW (Card Stack) ---
    const mobileCards = elections.map((election) => (
        <Card
            key={election.id}
            withBorder
            shadow="sm"
            radius="md"
            padding="md"
            onClick={() => navigate(`/elections/${election.id}`)}
            style={{ cursor: 'pointer' }}
        >
            <Group justify="space-between" mb="xs" align="flex-start">
                <Text fw={700} size="lg" style={{ flex: 1, lineHeight: 1.2 }}>
                    {election.title}
                </Text>

                {isAdmin && (
                    <ActionIcon
                        variant="light"
                        color="red"
                        size="md"
                        onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(election);
                        }}
                    >
                        <IconTrash size={18} />
                    </ActionIcon>
                )}
            </Group>

            <Divider mb="sm" />

            {/* Status & Counts */}
            <Group justify="space-between" mb="sm">
                <Badge color={election.status === 'OPEN' ? 'green' : 'gray'} size="md">
                    {translateStatus(election.status!)}
                </Badge>

                <Group gap={4}>
                    <IconUser size={16} style={{ opacity: 0.5 }} />
                    <Text size="sm" fw={500}>
                        {totalVoted(election)} / {totalEligible(election)}
                    </Text>
                </Group>
            </Group>

            {/* User Participation Status */}
            {hasVoted(election) ? (
                <Badge fullWidth color="blue" leftSection={<IconCheck size={14} />} variant="light">
                    Bereits teilgenommen
                </Badge>
            ) : (
                <Badge fullWidth color="gray" variant="outline">
                    Noch nicht teilgenommen
                </Badge>
            )}
        </Card>
    ));

    return (
        <Paper p="md" shadow="sm" radius="md" pos="relative">
            <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />

            <Group justify="space-between" mb="lg">
                <Title order={3}>Wahlen</Title>

                {isAdmin && (
                    <>
                        {/* Desktop Button */}
                        <Button
                            visibleFrom="xs"
                            leftSection={<IconPlus size={16} />}
                            onClick={() => navigate('/elections/create')}
                        >
                            Wahl erstellen
                        </Button>

                        {/* Mobile Icon Button */}
                        <ActionIcon
                            hiddenFrom="xs"
                            variant="filled"
                            color="blue"
                            size="lg"
                            radius="md"
                            onClick={() => navigate('/elections/create')}
                        >
                            <IconPlus size={22} />
                        </ActionIcon>
                    </>
                )}
            </Group>

            {elections.length === 0 && !loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Keine Wahlen gefunden.
                </div>
            ) : (
                <>
                    {/* --- DESKTOP TABLE --- */}
                    <Box visibleFrom="sm">
                        <Table highlightOnHover verticalSpacing="sm">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Titel</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>Dein Status</Table.Th>
                                    <Table.Th>Teilnahmen</Table.Th>
                                    <Table.Th style={{ textAlign: 'right' }}>Aktionen</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{desktopRows}</Table.Tbody>
                        </Table>
                    </Box>

                    {/* --- MOBILE STACK --- */}
                    <Stack hiddenFrom="sm" gap="md">
                        {mobileCards}
                    </Stack>
                </>
            )}
        </Paper>
    );
}