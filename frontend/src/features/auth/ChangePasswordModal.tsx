import { useState } from 'react';
import { Modal, PasswordInput, Button, Stack, Group, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { client } from '../../api';

interface ChangePasswordModalProps {
    opened: boolean;
    close: () => void;
}

interface ChangePasswordFormValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function ChangePasswordModal({ opened, close }: ChangePasswordModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<ChangePasswordFormValues>({
        initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
        validate: {
            currentPassword: (val) => (val.length === 0 ? 'Erforderlich' : null),
            newPassword: (val) => (val.length < 4 ? 'Mindestens 4 Zeichen erforderlich' : null),
            confirmPassword: (val, values) =>
                (val !== values.newPassword ? 'Passwörter stimmen nicht überein' : null),
        },
    });

    const handleClose = () => {
        form.reset();
        setError(null);
        close();
    };

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitting(true);
        setError(null);
        try {
            await client.api.changeOwnPassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            notifications.show({ color: 'green', title: 'Erfolg', message: 'Passwort wurde geändert' });
            handleClose();
        } catch (err: any) {
            if (err.response?.status === 400) {
                setError('Aktuelles Passwort ist falsch');
            } else {
                setError('Passwort konnte nicht geändert werden');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal opened={opened} onClose={handleClose} title="Passwort ändern" centered>
            {error && <Alert color="red" mb="md">{error}</Alert>}
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <PasswordInput
                        label="Aktuelles Passwort"
                        placeholder="Aktuelles Passwort eingeben"
                        data-autofocus
                        required
                        {...form.getInputProps('currentPassword')}
                    />
                    <PasswordInput
                        label="Neues Passwort"
                        placeholder="Neues Passwort eingeben"
                        required
                        {...form.getInputProps('newPassword')}
                    />
                    <PasswordInput
                        label="Neues Passwort bestätigen"
                        placeholder="Neues Passwort wiederholen"
                        required
                        {...form.getInputProps('confirmPassword')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={handleClose}>Abbrechen</Button>
                        <Button type="submit" loading={submitting}>Passwort ändern</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
