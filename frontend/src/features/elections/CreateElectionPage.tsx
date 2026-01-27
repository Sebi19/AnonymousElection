import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Paper,
    Title,
    TextInput,
    Button,
    Stack,
    Group,
    Text,
    LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { client } from '../../api';
import {type CreateElectionRequestDto, type UserDto} from '../../api/generated';
import {UserSelectionList} from "./UserSelectionList.tsx";

export function CreateElectionPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // 1. Fetch all users on load so we can populate the dropdowns
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await client.api.getUsers();
                setUsers(response.data.filter(u => u.username !== 'admin'));
            } catch (error) {
                console.error(error);
                notifications.show({ title: 'Error', message: 'Benutzer konnten nicht geladen werden', color: 'red' });
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, []);

    // 2. Setup Form
    const form = useForm({
        initialValues: {
            title: '',
            candidateIds: [] as string[],     // Mantine MultiSelect uses strings
            eligibleVoterIds: [] as string[], // We will convert to numbers on submit
        },
        validate: {
            title: (val: string) => (val.length < 3 ? 'Titel ist zu kurz' : null),
            candidateIds: (val: string[]) => (val.length < 2 ? 'Wählen Sie zumindest zwei Kandidaten aus' : null),
            eligibleVoterIds: (val: string[]) => (val.length < 1 ? 'Wählen Sie zumindest eine wahlberechtigten Benutzer aus' : null),
        },
    });
    const handleSubmit = async (values: typeof form.values) => {
        setSubmitting(true);
        try {
            const request: CreateElectionRequestDto = {
                title: values.title,
                candidateIds: values.candidateIds.map(id => parseInt(id)),
                eligibleVoterIds: values.eligibleVoterIds.map(id => parseInt(id)),
            }
            await client.api.createElection(request);

            notifications.show({ title: 'Erfolg', message: 'Wahl erstellt!', color: 'green' });
            navigate('/elections'); // Go back to list
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Fehler', message: 'Wahl konnte nicht erstellt werden', color: 'red' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Paper p="xl" shadow="sm" radius="md" pos="relative" maw={800} mx="auto" mt="xl">
            <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />

            <Group mb="lg" justify="space-between">
                <Title order={2}>Neue Wahl erstellen</Title>
                <Button variant="subtle" onClick={() => navigate('/elections')}>Abbrechen</Button>
            </Group>

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">

                    {/* 1. Election Title */}
                    <TextInput
                        label="Titel der Wahl"
                        placeholder="Kapitänswahl 2026"
                        required
                        size="md"
                        {...form.getInputProps('title')}
                    />

                    {/* 2. Candidates Selection */}
                    <UserSelectionList
                        label="Kandidaten"
                        description="Wähle aus, wer gewählt werden kann"
                        users={users}
                        selectedIds={form.values.candidateIds}
                        onChange={(ids) => form.setFieldValue('candidateIds', ids)}
                    />
                    {form.errors.candidateIds && (
                        <Text c="red" size="sm" mt={-10}>{form.errors.candidateIds}</Text>
                    )}

                    <UserSelectionList
                        label="Wahlberechtigt"
                        description="Wähle aus, wer eine Stimme abgeben darf"
                        users={users}
                        selectedIds={form.values.eligibleVoterIds}
                        onChange={(ids) => form.setFieldValue('eligibleVoterIds', ids)}
                    />
                    {form.errors.eligibleVoterIds && (
                        <Text c="red" size="sm" mt={-10}>{form.errors.eligibleVoterIds}</Text>
                    )}

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => navigate('/elections')}>Abbrechen</Button>
                        <Button type="submit" size="md" loading={submitting}>
                            Wahl erstellen
                        </Button>
                    </Group>

                </Stack>
            </form>
        </Paper>
    );
}