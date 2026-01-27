import { Modal, Button, TextInput, Select, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import {useEffect, useState} from 'react';
import { client } from '../../api';
import { type UserDto, type UpdateUserRequestDto } from '../../api/generated';

interface EditUserModalProps {
    user: UserDto | null; // The user we are editing
    opened: boolean;
    close: () => void;
    onUserUpdated: (updatedUser: UserDto) => void;
}

export function EditUserModal({ user, opened, close, onUserUpdated }: EditUserModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: { username: '', firstname: '', lastname: '', role: '' },
    });

    // Pre-fill form when "user" prop changes
    useEffect(() => {
        if (user) {
            form.setValues({
                username: user.username || '',
                firstname: user.firstName || '',
                lastname: user.lastName || '',
                role: user.role || 'ROLE_USER',
            });
        }
    }, [user]);

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true)
        if (!user?.id) return;
        try {
            const request: UpdateUserRequestDto = {
                username: values.username,
                firstName: values.firstname || undefined,
                lastName: values.lastname || undefined,
                role: values.role,
            }
            const res = await client.api.updateUser(user.id, request);
            onUserUpdated(res.data);
            close();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={close} title={`${user?.username} bearbeiten`} centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        label="Benutzername"
                        required
                        data-autofocus
                        {...form.getInputProps('username')}
                    />

                    <Group grow>
                        <TextInput label="Vorname" {...form.getInputProps('firstname')} />
                        <TextInput label="Nachname" {...form.getInputProps('lastname')} />
                    </Group>

                    <Select
                        label="Rolle"
                        data={[{ value: 'ROLE_USER', label: 'Benutzer' }, { value: 'ROLE_ADMIN', label: 'Administrator' }]}
                        {...form.getInputProps('role')}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={close}>Abbrechen</Button>
                        <Button type="submit" loading={loading}>Änderungen speichern</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}