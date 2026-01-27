import {Modal, Button, PasswordInput, Stack, Group} from '@mantine/core';
import { useForm } from '@mantine/form';
import { client } from '../../api';
import { type UserDto } from '../../api/generated';
import {notifications} from "@mantine/notifications";
import {useState} from "react";

interface ResetPasswordModalProps {
    user: UserDto | null;
    opened: boolean;
    close: () => void;
}

export function ResetPasswordModal({ user, opened, close }: ResetPasswordModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: { newPassword: '' },
        validate: { newPassword: (val: string) => (val.length < 4 ? 'Too short' : null) },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true)
        if (!user?.id) return;
        try {
            await client.api.resetPassword(user.id, values);
            close();
            form.reset();
            notifications.show({
                color: 'green',
                title: 'Erfolg',
                message: `Passwort für ${user.username} aktualsiert.`,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={close} title={`Passwort aktualisieren: ${user?.username}`} centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <PasswordInput
                        label="Neues Passwort"
                        placeholder="Passwort eingeben"
                        data-autofocus
                        required
                        {...form.getInputProps('newPassword')}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={close}>Abbrechen</Button>
                        <Button type="submit" color="red" loading={loading}>Passwort aktualisieren</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}