import { useEffect, useState } from 'react';
import {Title, Table, Group, Button, ActionIcon, Text, Badge, Paper, LoadingOverlay, Tooltip} from '@mantine/core';
import {IconKey, IconPencil, IconPlus, IconTrash, IconUser} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { client } from '../../api';
import { type UserDto } from '../../api/generated';
import { AddUserModal } from './AddUserModal';
import {openConfirmModal} from "@mantine/modals";
import {ResetPasswordModal} from "./ResetPasswordModal.tsx";
import {EditUserModal} from "./EditUserModal.tsx";
import {useAuth} from "../auth/AuthContext.tsx";

export function UserManagementPage() {
    const {user} = useAuth();
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);

    // Modal state management
    const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
    const [editOpened, {open: openEdit, close: closeEdit}] = useDisclosure(false);
    const [resetOpened, {open: openReset, close: closeReset}] = useDisclosure(false);

    const isAdmin = user?.role === 'ROLE_ADMIN';

    const handleEditClick = (user: UserDto) => {
        setSelectedUser(user);
        openEdit();
    };

    const handleResetClick = (user: UserDto) => {
        setSelectedUser(user);
        openReset();
    };

    const translateRole = (role: string) => {
        switch (role) {
            case 'ROLE_ADMIN':
                return 'Administrator';
            case 'ROLE_USER':
                return 'Benutzer';
            default:
                return role;
        }
    }

    // 1. Fetch Users on Load
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await client.api.getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserUpdated = (updated: UserDto) => {
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    };

    const openDeleteModal = (user: UserDto) => {
        openConfirmModal({
            title: 'Benutzer löschen',
            centered: true,
            children: (
                <Text size="sm">
                    Bist du sicher, dass du den Benutzer <strong>{user.username}</strong> löschen möchtest?
                    Diese Aktion cann nicht rückgängig gemacht werden.
                </Text>
            ),
            labels: { confirm: 'Benutzer löschen', cancel: 'Abbrechen' },
            confirmProps: { color: 'red' },

            // THE MAGIC PART:
            // If onConfirm returns a Promise, the modal stays open
            // and shows a loading spinner on the button until it resolves.
            onConfirm: async () => {
                try {
                    await client.api.deleteUser(user.id!);

                    // Only remove from UI after server success
                    setUsers((prev) => prev.filter((u) => u.id !== user.id));
                } catch (error) {
                    console.error(error);
                    // Optional: Show an error notification here
                }
            },
        });
    };

    // 3. Render the Rows
    const rows = users.map((user) => (
        <Table.Tr key={user.id}>
            <Table.Td>
                <Group gap="sm">
                    <IconUser size={16} />
                    <Text size="sm" fw={500}>{user.username}</Text>
                </Group>
            </Table.Td>
            <Table.Td>
                {user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`
                    : <Text c="dimmed" size="xs">N/A</Text>
                }
            </Table.Td>
            <Table.Td>
                <Badge
                    color={user.role === 'ROLE_ADMIN' ? 'red' : 'blue'}
                    variant="light"
                >
                    {translateRole(user.role!)}
                </Badge>
            </Table.Td>
            {isAdmin && (
                <Table.Td align="right">
                    <Group gap={4} justify="flex-end">
                        {/* EDIT BUTTON */}
                        <Tooltip label="Benutzer bearbeiten">
                            <ActionIcon variant="subtle" color="blue" onClick={() => handleEditClick(user)} disabled={user.username === 'admin'}>
                                <IconPencil size={16} />
                            </ActionIcon>
                        </Tooltip>

                        {/* RESET PASSWORD BUTTON */}
                        <Tooltip label="Passwort zurücksetzen">
                            <ActionIcon variant="subtle" color="orange" onClick={() => handleResetClick(user)} disabled={user.username === 'admin'}>
                                <IconKey size={16} />
                            </ActionIcon>
                        </Tooltip>

                        {/* DELETE BUTTON */}
                        <Tooltip label="Benutzer löschen">
                            <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => openDeleteModal(user)}
                                disabled={user.username === 'admin'}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Table.Td>
            )}
        </Table.Tr>
    ));

    return (
        <Paper p="md" shadow="sm" radius="md" pos="relative">
            <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />

            <Group justify="space-between" mb="lg">
                <Title order={3}>Benutzer</Title>
                {isAdmin && (
                    <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
                        Benutzer hinzufügen
                    </Button>
                )}
            </Group>

            <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Benutzername</Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Rolle</Table.Th>
                        {isAdmin && (
                            <Table.Th style={{ textAlign: 'right' }}>Aktionen</Table.Th>
                        )}
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>

            {/* The Modal Component */}
            <AddUserModal
                opened={addOpened}
                close={closeAdd}
                onUserCreated={(newUser) => setUsers([...users, newUser])}
            />

            <ResetPasswordModal
                opened={resetOpened}
                close={closeReset}
                user={selectedUser}
            />

            <EditUserModal
                opened={editOpened}
                close={closeEdit}
                user={selectedUser}
                onUserUpdated={handleUserUpdated}
            />
        </Paper>
    );
}