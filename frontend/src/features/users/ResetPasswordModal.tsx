import { useEffect, useState } from 'react';
import {Modal, Button, TextInput, Stack, Group, Text, Center, Loader, CopyButton, ActionIcon, Tooltip} from '@mantine/core';
import { IconCheck, IconCopy, IconBrandWhatsapp } from '@tabler/icons-react';
import { client } from '../../api';
import { type UserDto } from '../../api/generated';
import {notifications} from "@mantine/notifications";

interface ResetPasswordModalProps {
    user: UserDto | null;
    opened: boolean;
    close: () => void;
}

export function ResetPasswordModal({ user, opened, close }: ResetPasswordModalProps) {
    const [loading, setLoading] = useState(false);
    const [resetLink, setResetLink] = useState<string | null>(null);

    useEffect(() => {
        if (!opened || !user?.id) return;

        setResetLink(null);
        setLoading(true);

        client.api.generatePasswordResetLink(user.id)
            .then(res => {
                setResetLink(`${window.location.origin}/reset-password/${res.data.token}`);
            })
            .catch(error => {
                console.error(error);
                notifications.show({ color: 'red', title: 'Fehler', message: 'Link konnte nicht erstellt werden' });
            })
            .finally(() => setLoading(false));
    }, [opened, user?.id]);

    const message = resetLink
        ? `Username: ${user?.username}\nPasswort zurücksetzen:\n${resetLink}`
        : '';

    return (
        <Modal opened={opened} onClose={close} title={`Passwort-Reset-Link: ${user?.username}`} centered>
            <Stack>
                <Text size="sm" c="dimmed">
                    Teile diesen Link mit {user?.username}. Er ist 24 Stunden gültig und kann nur einmal verwendet werden,
                    um ein neues Passwort zu setzen.
                </Text>

                {loading ? (
                    <Center py="md"><Loader size="sm" /></Center>
                ) : resetLink && (
                    <TextInput
                        readOnly
                        value={resetLink}
                        onClick={(e) => e.currentTarget.select()}
                        rightSection={
                            <CopyButton value={resetLink} timeout={2000}>
                                {({ copied, copy }) => (
                                    <Tooltip label={copied ? 'Kopiert!' : 'Kopieren'}>
                                        <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </CopyButton>
                        }
                    />
                )}

                {resetLink && (
                    <CopyButton value={message} timeout={2000}>
                        {({ copied, copy }) => (
                            <Button
                                fullWidth
                                color="teal"
                                variant={copied ? 'filled' : 'light'}
                                leftSection={copied ? <IconCheck size={16} /> : <IconBrandWhatsapp size={16} />}
                                onClick={copy}
                            >
                                {copied ? 'Nachricht kopiert!' : 'Nachricht kopieren'}
                            </Button>
                        )}
                    </CopyButton>
                )}

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={close}>Fertig</Button>
                </Group>
            </Stack>
        </Modal>
    );
}
