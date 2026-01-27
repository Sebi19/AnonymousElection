import { Modal, Button, TextInput, PasswordInput, Select, Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { client } from '../../api.ts';
import { type UserDto, type CreateUserRequestDto } from '../../api/generated';

interface AddUserModalProps {
    opened: boolean;
    close: () => void;
    onUserCreated: (newUser: UserDto) => void; // Callback to update parent list
}

export function AddUserModal({ opened, close, onUserCreated }: AddUserModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
            firstname: '',
            lastname: '',
            role: 'ROLE_USER',
        },
        validate: {
            username: (val: string) => (val.length < 3 ? 'Username too short' : null),
            password: (val: string) => (val.length < 4 ? 'Password must be at least 4 chars' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            const request: CreateUserRequestDto = {
                username: values.username,
                password: values.password,
                role: values.role,
                firstName: values.firstname || undefined,
                lastName: values.lastname || undefined,
            }
            const response = await client.api.createUser(request);
            onUserCreated(response.data); // Add new user to the list immediately
            form.reset();
            close();
        } catch (error) {
            console.error(error);
            form.setFieldError('username', 'Benutzername bereits vergeben oder Server Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={close} title="Neuen Benutzer erstellen" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        label="Benutzername"
                        placeholder="v.nachname"
                        required
                        data-autofocus
                        {...form.getInputProps('username')}
                    />

                    <PasswordInput
                        label="Passwort"
                        placeholder="Passwort eingeben"
                        required
                        {...form.getInputProps('password')}
                    />

                    <Group grow>
                        <TextInput
                            label="Vorname"
                            placeholder="Vorname..."
                            {...form.getInputProps('firstname')}
                        />
                        <TextInput
                            label="Nachname"
                            placeholder="Nachname..."
                            {...form.getInputProps('lastname')}
                        />
                    </Group>

                    <Select
                        label="Role"
                        data={[
                            { value: 'ROLE_USER', label: 'Benutzer' },
                            { value: 'ROLE_ADMIN', label: 'Administrator' },
                        ]}
                        {...form.getInputProps('role')}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={close}>Abbrechen</Button>
                        <Button type="submit" loading={loading}>Benutzer erstellen</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}