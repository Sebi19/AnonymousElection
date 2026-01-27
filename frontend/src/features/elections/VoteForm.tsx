import { useState } from 'react';
import { Paper, Radio, Button, Stack, Text, Alert, Group } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { client } from '../../api';
import {type CastVoteRequestDto, type ElectionDto} from '../../api/generated';

interface VoteFormProps {
    election: ElectionDto;
    onVoteSuccess: () => void;
}

export function VoteForm({ election, onVoteSuccess }: VoteFormProps) {
    const [value, setValue] = useState<string | null>(null); // Candidate ID or "abstain"
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!value) return;

        setSubmitting(true);
        try {
            // If "abstain", we send undefined as candidateId
            const candidateId: number | undefined = value === 'abstain' ? undefined : parseInt(value);
            const request: CastVoteRequestDto = { candidateId };
            await client.api.castVote(election.id!, request);

            notifications.show({ title: 'Stimme abgegeben', message: 'Danke für die Teilnahme!', color: 'green' });
            onVoteSuccess();
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Fehler', message: 'Stimme konnte nicht abgegeben werden.', color: 'red' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Paper p="lg" radius="md" withBorder>
            <Text size="lg" fw={700} mb="md">Gib deine Stimme ab</Text>

            <Alert variant="light" color="blue" title="Anonym" icon={<IconInfoCircle />}>
                Deine Stimme ist anonym. Sobald du gewählt hast, kann deine Stimme nicht mehr geändert werden.
            </Alert>

            <Radio.Group
                value={value}
                onChange={setValue}
                name="candidates"
                label="Wähle einen Kandidaten aus"
                description="Wähle einen der untenstehenden Kandidaten oder stimme mit Enthaltung."
                mt="xl"
            >
                <Stack mt="xs">
                    {election.candidates?.map(candidate => (
                        <Radio
                            key={candidate.id}
                            value={candidate.id!.toString()}
                            label={`${candidate.firstName} ${candidate.lastName}`}
                        />
                    ))}

                    <Radio
                        value="abstain"
                        label="Enthaltung"
                        color="gray"
                        style={{ marginTop: '10px' }}
                    />
                </Stack>
            </Radio.Group>

            <Group justify="flex-end" mt="xl">
                <Button
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={!value}
                    size="md"
                >
                    Stimme abgeben
                </Button>
            </Group>
        </Paper>
    );
}