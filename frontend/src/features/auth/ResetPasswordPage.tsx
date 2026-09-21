import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Center,
    Paper,
    Text,
    PasswordInput,
    Button,
    Stack,
    Group,
    Alert,
    Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { client } from '../../api';
import { useDocumentTitle } from '@mantine/hooks';

interface ResetPasswordFormValues {
    newPassword: string;
    confirmPassword: string;
}

export function ResetPasswordPage() {
    useDocumentTitle('Passwort zurücksetzen | Kapitänswahl');
    const { token } = useParams();
    const navigate = useNavigate();

    const [checking, setChecking] = useState(true);
    const [username, setUsername] = useState<string | null>(null);
    const [invalidReason, setInvalidReason] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) return;

        client.api.getResetTokenInfo(token)
            .then(res => setUsername(res.data.username ?? null))
            .catch(err => {
                if (err.response?.status === 410) {
                    setInvalidReason('Dieser Link ist abgelaufen.');
                } else {
                    setInvalidReason('Dieser Link ist ungültig.');
                }
            })
            .finally(() => setChecking(false));
    }, [token]);

    const form = useForm<ResetPasswordFormValues>({
        initialValues: { newPassword: '', confirmPassword: '' },
        validate: {
            newPassword: (val) => (val.length < 4 ? 'Mindestens 4 Zeichen erforderlich' : null),
            confirmPassword: (val, values) =>
                (val !== values.newPassword ? 'Passwörter stimmen nicht überein' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        if (!token) return;
        setSubmitting(true);
        try {
            await client.api.resetPassword(token, { newPassword: values.newPassword });
            notifications.show({ color: 'green', title: 'Erfolg', message: 'Passwort wurde gesetzt. Du kannst dich jetzt einloggen.' });
            navigate('/login');
        } catch {
            notifications.show({ color: 'red', title: 'Fehler', message: 'Passwort konnte nicht gesetzt werden' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Center h="100%">
            <Paper radius="md" p="xl" withBorder style={{ maxWidth: 400, margin: 'auto', width: '100%' }}>
                <Text size="lg" fw={500} mb="md">Neues Passwort setzen</Text>

                {checking ? (
                    <Center py="md"><Loader size="sm" /></Center>
                ) : invalidReason ? (
                    <Alert color="red">{invalidReason}</Alert>
                ) : (
                    <>
                        <Text size="sm" c="dimmed" mb="md">Für {username}</Text>
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="md">
                                <PasswordInput
                                    required
                                    label="Neues Passwort"
                                    placeholder="Neues Passwort..."
                                    data-autofocus
                                    {...form.getInputProps('newPassword')}
                                />
                                <PasswordInput
                                    required
                                    label="Passwort bestätigen"
                                    placeholder="Passwort wiederholen..."
                                    {...form.getInputProps('confirmPassword')}
                                />
                            </Stack>
                            <Group justify="flex-end" mt="xl">
                                <Button type="submit" loading={submitting}>Passwort setzen</Button>
                            </Group>
                        </form>
                    </>
                )}
            </Paper>
        </Center>
    );
}
