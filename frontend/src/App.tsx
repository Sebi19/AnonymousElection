import {
    AppShell,
    Group,
    Title,
    Button,
    ActionIcon,
    useMantineColorScheme,
    useComputedColorScheme,
    Menu,
    Avatar,
    Text,
    rem,
    Drawer, Stack, Burger, Divider
} from '@mantine/core';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { IconLogin, IconSun, IconMoon, IconLogout, IconChevronDown, IconUser, IconUsers, IconNotes } from '@tabler/icons-react';
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { UserManagementPage } from './features/users/UserManagementPage';
import { useAuth } from './features/auth/AuthContext';
import {ProtectedRoute} from "./features/auth/ProtectedRoute.tsx";
import {ElectionManagementPage} from "./features/elections/ElectionManagementPage.tsx";
import {CreateElectionPage} from "./features/elections/CreateElectionPage.tsx";
import {ElectionDetailPage} from "./features/elections/ElectionDetailPage.tsx";
import {useDisclosure} from "@mantine/hooks"; // Import the hook
export default function App() {
    const navigate = useNavigate();
    const [opened, { toggle, close }] = useDisclosure();
    const location = useLocation();
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    // Get auth state
    const { isAuthenticated, user, logout } = useAuth()

    const handleNav = (path: string) => {
        navigate(path);
        close();
    };

    const getDisplayName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user?.username || 'User';
    };

    const isActive = (path: string) => location.pathname === path;

    const toggleColorScheme = () => {
        setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppShell header={{ height: 60 }} padding="0">
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">

                    {/* LEFT SIDE: Burger (Mobile) & Title */}
                    <Group>
                        {/* Show Burger only if logged in (or always if you have public pages) */}
                        {isAuthenticated && (
                            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        )}

                        <Group gap="sm" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => navigate('/')}>
                            <Title order={3}>Kapitänswahl</Title>
                        </Group>
                    </Group>

                    {/* RIGHT SIDE: Navigation & Actions */}
                    <Group gap="xs">

                        {/* 1. DESKTOP NAV (Hidden on Mobile) */}
                        {isAuthenticated && (
                            <Group visibleFrom="sm" gap="xs">
                                <Button
                                    variant={isActive('/users') ? 'light' : 'subtle'}
                                    leftSection={<IconUsers size={18} />}
                                    onClick={() => navigate('/users')}
                                >
                                    Benutzer
                                </Button>
                                <Button
                                    variant={isActive('/elections') ? 'light' : 'subtle'}
                                    leftSection={<IconNotes size={18} />}
                                    onClick={() => navigate('/elections')}
                                >
                                    Wahlen
                                </Button>
                            </Group>
                        )}

                        {/* 2. USER MENU / LOGIN */}
                        {!isAuthenticated ? (
                            <Button
                                variant={isActive('/login') ? 'light' : 'subtle'}
                                leftSection={<IconLogin size={18} />}
                                onClick={() => navigate('/login')}
                            >
                                Login
                            </Button>
                        ) : (
                            <Menu shadow="md" width={200} position="bottom-end">
                                <Menu.Target>
                                    {/* On mobile, we reduce padding and hide the text name */}
                                    <Button variant="subtle" px={5} rightSection={<IconChevronDown size={14} />}>
                                        <Group gap={7}>
                                            <Avatar src={null} alt={user?.username} radius="xl" size={24} color="blue" />
                                            {/* Hide Name on Mobile (visibleFrom="sm") */}
                                            <Text fw={500} size="sm" lh={1} mr={3} visibleFrom="sm">
                                                {getDisplayName()}
                                            </Text>
                                        </Group>
                                    </Button>
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Item
                                        hiddenFrom={"sm"}
                                        leftSection={<IconUser size={14} />}
                                        style={{ opacity: 1, cursor: 'default', color: 'var(--mantine-color-text)' }}
                                        // We use 'component="div"' so it doesn't behave like a button
                                        component="div"
                                    >
                                        {getDisplayName()}
                                    </Menu.Item>
                                    <Menu.Label>Account</Menu.Label>
                                    <Menu.Divider />
                                    <Menu.Item
                                        color="red"
                                        leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        )}

                        {/* 3. THEME TOGGLE */}
                        <ActionIcon onClick={toggleColorScheme} variant="default" size="lg" ml={5}>
                            {computedColorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                        </ActionIcon>
                    </Group>
                </Group>
            </AppShell.Header>

            {/* MOBILE DRAWER (Only visible when Burger is clicked) */}
            <Drawer opened={opened} onClose={close} title="Menu" padding="md" size="75%">
                <Stack gap="md">
                    {isAuthenticated && (
                        <>
                            <Button
                                variant={isActive('/users') ? 'light' : 'subtle'}
                                leftSection={<IconUsers size={18} />}
                                fullWidth
                                justify="flex-start"
                                onClick={() => handleNav('/users')}
                            >
                                Benutzer
                            </Button>
                            <Button
                                variant={isActive('/elections') ? 'light' : 'subtle'}
                                leftSection={<IconNotes size={18} />}
                                fullWidth
                                justify="flex-start"
                                onClick={() => handleNav('/elections')}
                            >
                                Wahlen
                            </Button>

                            <Divider my="sm" />

                            <Button
                                color="red"
                                variant="subtle"
                                leftSection={<IconLogout size={18} />}
                                fullWidth
                                justify="flex-start"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </>
                    )}

                    {!isAuthenticated && (
                        <Button
                            variant="subtle"
                            leftSection={<IconLogin size={18} />}
                            fullWidth
                            justify="flex-start"
                            onClick={() => handleNav('/login')}
                        >
                            Login
                        </Button>
                    )}
                </Stack>
            </Drawer>

            <AppShell.Main h="calc(100vh - 60px)">
                <Routes>
                    <Route path="/" element={<Navigate to={isAuthenticated ? "/elections" : "/login"} replace />} />
                    <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/elections" />} />
                    <Route path="/users" element={
                        <ProtectedRoute>
                            <UserManagementPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/elections" element={
                        <ProtectedRoute>
                            <ElectionManagementPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/elections/create" element={
                        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                            <CreateElectionPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/elections/:id" element={
                        <ProtectedRoute>
                            <ElectionDetailPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AppShell.Main>
        </AppShell>
    );
}