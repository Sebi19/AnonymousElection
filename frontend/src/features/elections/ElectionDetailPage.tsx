import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Title,
    Badge,
    Group,
    Button,
    Paper,
    Text,
    Center,
    Loader,
    Avatar,
    Tooltip,
    ThemeIcon, Stack
} from '@mantine/core';
import {IconArrowLeft, IconCheck, IconLock, IconX} from '@tabler/icons-react';
import { client } from '../../api';
import { type ElectionDto } from '../../api/generated';
import { VoteForm } from './VoteForm';
import { ElectionResults } from "./ElectionResults.tsx";
import {useAuth} from "../auth/AuthContext.tsx";
import {openConfirmModal} from "@mantine/modals";
import {notifications} from "@mantine/notifications";
import {useDocumentTitle} from "@mantine/hooks";

export function ElectionDetailPage() {
    useDocumentTitle('Wahl | Kapitänswahl')
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [election, setElection] = useState<ElectionDto | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to re-fetch data (e.g., after voting)
    const loadElection = async () => {
        try {
            const res = await client.api.getElection(parseInt(id!));
            setElection(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadElection();
    }, [id]);

    const handleCloseElection = () => {
        openConfirmModal({
            title: 'Wahl abschließen',
            children: (
                <Text size="sm">
                    Bist du dir sicher, dass du die Wahl abschließen möchtest?
                    Ergebnisse werden sofort veröffentlicht, und keine weiteren Stimmen können abgegeben werden.
                </Text>
            ),
            labels: { confirm: 'Wahl abschließen', cancel: 'Abbrechen' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await client.api.closeElection(election!.id!);
                    notifications.show({ title: 'Erfolg', message: 'Wahl geschlossen', color: 'green' });
                    loadElection(); // Reload to show results
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'Offen';
            case 'COMPLETED':
                return 'Abgeschlossen';
            default:
                return status;
        }
    }

    if (loading) return <Center h="50vh"><Loader /></Center>;
    if (!election) return <Center h="50vh"><Text>Wahl nicht gefunden</Text></Center>;

    const isAdmin = user?.role === 'ROLE_ADMIN';
    const isOpen = election.status === 'OPEN';

    const totalEligible = election.eligibleVoters?.length || 0;
    const totalVoted = election.userIdsWhoVoted?.length || 0;
    const hasVoted = election.userIdsWhoVoted?.includes(user?.id!) || false;
    const isEligible = election.eligibleVoters?.some(voter => voter.id === user?.id);

    return (
        <Container size="md" py="xl">
            <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate('/elections')}
                mb="md"
            >
                Zurück zu Übersicht
            </Button>
            <Stack gap="md">
                <Group justify="space-between" align="center" mb="lg">
                    <Group>
                        <Title order={2}>{election.title}</Title>
                        <Badge
                            size="lg"
                            color={election.status === 'OPEN' ? 'green' : 'gray'}
                        >
                            {translateStatus(election.status!)}
                        </Badge>
                    </Group>
                    {isAdmin && isOpen && (
                        <Button
                            color="red"
                            leftSection={<IconLock size={16} />}
                            onClick={handleCloseElection}
                        >
                            Wahl abschließen
                        </Button>
                    )}
                </Group>

                {/* CASE 1: ELECTION IS COMPLETED -> SHOW RESULTS */}
                {election.status === 'COMPLETED' && (
                    <ElectionResults electionId={election.id!} />
                )}

                {/* CASE 2: ELECTION IS OPEN AND USER HAS NOT VOTED -> SHOW FORM */}
                {election.status === 'OPEN' && isEligible && !hasVoted && (
                    <VoteForm election={election} onVoteSuccess={loadElection} />
                )}

                {/* CASE 3: ELECTION IS OPEN BUT USER ALREADY VOTED -> SHOW WAITING SCREEN */}
                {election.status === 'OPEN' && hasVoted && (
                    <Paper p="xl" withBorder radius="md" ta="center" bg="light-dark(var(--mantine-color-gray-0),var(--mantine-color-dark-6))">
                        <Center mb="md">
                            <IconCheck size={48} color="green" />
                        </Center>
                        <Title order={3} mb="sm">Du hast gewählt!</Title>
                        <Text c="dimmed">
                            Deine Stimme wurde gezählt.
                            Ergebnisse werden hier angezeigt, sobald die Wahl abgeschlossen ist.
                        </Text>
                    </Paper>
                )}

                {/* CASE 4: ELECTION IS OPEN BUT USER IS NOT ELIGIBLE*/}
                {election.status === 'OPEN' && !isEligible && (
                    <Paper p="xl" withBorder radius="md" ta="center" bg="light-dark(var(--mantine-color-gray-0),var(--mantine-color-dark-6))">
                        <Title order={3} mb="sm">Du bist nicht stimmberechtigt.</Title>
                        <Text c="dimmed">
                            Leider bist du für diese Wahl nicht stimmberechtigt.
                        </Text>
                    </Paper>
                )}

                <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                        <Text fw={700}>Teilnahmen</Text>
                        <Badge variant="light" color="blue">
                            {totalVoted} / {totalEligible}
                        </Badge>
                    </Group>
                    {election.eligibleVoters?.map(voter => {
                        const hasVoted = election.userIdsWhoVoted?.includes(voter.id!);
                        return (
                            <Group key={voter.id} justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                                <Group gap="sm">
                                    <Avatar size="sm" radius="xl" color="initials">
                                        {voter.firstName?.substring(0, 1).toUpperCase()}
                                    </Avatar>
                                    <Text size="sm">
                                        {voter.firstName} {voter.lastName}
                                    </Text>
                                </Group>

                                <Tooltip label={hasVoted ? "Hat gewählt" : "Hat noch nicht gewählt"}>
                                    <ThemeIcon
                                        variant="light"
                                        color={hasVoted ? 'green' : 'red'}
                                        size="sm"
                                        radius="xl"
                                    >
                                        {hasVoted ? <IconCheck size={12} /> : <IconX size={12} />}
                                    </ThemeIcon>
                                </Tooltip>
                            </Group>
                        );
                    })}
                </Paper>
            </Stack>
        </Container>
    );
}