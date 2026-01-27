import { AppShell, Group, Title, Button, ActionIcon, useMantineColorScheme, useComputedColorScheme, Menu, Avatar, Text, rem } from '@mantine/core';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { IconLogin, IconSun, IconMoon, IconLogout, IconChevronDown,  IconUsers, IconNotes } from '@tabler/icons-react';
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { UserManagementPage } from './features/users/UserManagementPage';
import { useAuth } from './features/auth/AuthContext';
import {ProtectedRoute} from "./features/auth/ProtectedRoute.tsx";
import {ElectionManagementPage} from "./features/elections/ElectionManagementPage.tsx";
import {CreateElectionPage} from "./features/elections/CreateElectionPage.tsx";
import {ElectionDetailPage} from "./features/elections/ElectionDetailPage.tsx"; // Import the hook
export default function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    // Get auth state
    const { isAuthenticated, user, logout } = useAuth()

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

    const isAdmin = user?.role === 'ROLE_ADMIN';

    return (
        <AppShell header={{ height: 60 }} padding="0">
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group gap="sm" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => navigate('/')}>
                        <Title order={3}>Kapitänswahl</Title>
                    </Group>

                    <Group gap="xs">
                        {isAuthenticated && (
                            <>
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
                            </>
                        )}

                        {/* CONDITIONAL RENDERING: Login Button vs User Menu */}
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
                                    <Button variant="subtle" rightSection={<IconChevronDown size={14} />}>
                                        <Group gap={7}>
                                            <Avatar src={null} alt={user?.username || 'User'} radius="xl" size={24} color="blue" />
                                            <Text fw={500} size="sm" lh={1} mr={3}>
                                                {getDisplayName()}
                                            </Text>
                                        </Group>
                                    </Button>
                                </Menu.Target>

                                <Menu.Dropdown>
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

                        {/* Theme Toggle */}
                        <ActionIcon onClick={toggleColorScheme} variant="default" size="lg" ml={10}>
                            {computedColorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                        </ActionIcon>
                    </Group>
                </Group>
            </AppShell.Header>

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