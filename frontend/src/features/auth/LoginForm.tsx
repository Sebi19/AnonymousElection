import { useForm } from '@mantine/form';
import {
    TextInput,
    PasswordInput,
    Text,
    Paper,
    Group,
    Button,
    Stack,
    Alert,
} from '@mantine/core';
import {client} from '../../api.ts'
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import {useAuth} from "./AuthContext.tsx"

export function LoginForm() {
    const {login} = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const form = useForm({
        initialValues: { username: '', password: '' },
        validate: {
            username: (val: string) => (val.length <= 2 ? 'Username is too short' : null),
            password: (val: string) => (val.length <= 2 ? 'Password is too short' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setError(null);

        try {
            // 1. Create FormData (Spring Security expects form-urlencoded by default)
            const formData = new FormData();
            formData.append('username', values.username);
            formData.append('password', values.password);

            // 2. Perform the Login Request
            // We use standard fetch here because our generated client might enforce JSON
            const loginResponse = await fetch('/api/login', {
                method: 'POST',
                body: formData, // No headers needed, fetch handles form-data
            });

            if (!loginResponse.ok) {
                // FIX: Create an error that looks like an Axios error
                const error: any = new Error('Unbekannter Fehler');
                error.response = {
                    status: loginResponse.status,
                    statusText: loginResponse.statusText
                };
                throw error;
            }

            // 3. If successful, the Cookie is now set in the browser!
            // Now fetch the user profile to confirm who we are
            const userProfile = await client.api.getCurrentUser();

            // 4. Update Context
            login(userProfile.data);
            navigate('/elections');

        } catch (err: any) {
            // Axios error handling
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Benutzername oder Passwort ungültig');
            } else {
                setError('Login fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'));
            }
        }
    };

    return (
        <Paper radius="md" p="xl" withBorder style={{ maxWidth: 400, margin: 'auto' }}>
            <Text size="lg" fw={500} mb="md">Willkommen zur Kapitänswahl!</Text>

            {error && <Alert color="red" mb="md">{error}</Alert>}

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        required
                        label="Benutzername"
                        placeholder="admin"
                        {...form.getInputProps('username')}
                    />
                    <PasswordInput
                        required
                        label="Passwort"
                        placeholder="secret"
                        {...form.getInputProps('password')}
                    />
                </Stack>

                <Group justify="space-between" mt="xl">
                    <Button type="submit" radius="xl">
                        Login
                    </Button>
                </Group>
            </form>
        </Paper>
    );
}