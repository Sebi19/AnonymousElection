import {
    Card,
    Group,
    Box,
    Text,
    Checkbox,
    Divider,
    Stack
} from '@mantine/core';
import { type UserDto } from '../../api/generated';

interface UserSelectionListProps {
    label: string;
    description?: string;
    users: UserDto[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export function UserSelectionList({
                                      label,
                                      description,
                                      users,
                                      selectedIds,
                                      onChange,
                                  }: UserSelectionListProps) {

    // Toggle a single ID
    const handleToggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(current => current !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    // Select All
    const handleSelectAll = () => {
        const allIds = users.map(u => u.id!.toString());
        onChange(allIds);
    };

    // Deselect All
    const handleDeselectAll = () => {
        onChange([]);
    };

    const allSelected = users.length > 0 && selectedIds.length === users.length;
    const indeterminate = selectedIds.length > 0 && selectedIds.length < users.length;

    return (
        <Card withBorder padding="md" radius="md">
            <Group justify="space-between" mb="xs">
                <Box>
                    <Text fw={500}>{label}</Text>
                    {description && <Text size="xs" c="dimmed">{description}</Text>}
                </Box>
                <Group gap="xs">
                    <Checkbox
                        label={allSelected ? "Alle abwählen" : "Alle auswählen"}
                        checked={allSelected}
                        indeterminate={indeterminate}
                        onChange={() => allSelected ? handleDeselectAll() : handleSelectAll()}
                    />
                </Group>
            </Group>

            <Divider mb="sm" />

            <Stack gap="xs">
                {users.map((user) => {
                    const idStr = user.id!.toString();
                    const isSelected = selectedIds.includes(idStr);

                    return (
                        <Checkbox
                            key={user.id}
                            checked={isSelected}
                            onChange={() => handleToggle(idStr)}
                            label={`${user.firstName || ''} ${user.lastName || ''}`}
                            styles={{
                                root: {
                                    padding: '8px',
                                    borderRadius: '4px',
                                    backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : 'transparent',
                                    transition: 'background-color 0.2s ease'
                                },
                                label: { cursor: 'pointer', userSelect: 'none' }
                            }}
                        />
                    );
                })}
            </Stack>

            <Text size="xs" c="dimmed" mt="sm" ta="right">
                {selectedIds.length} von {users.length} ausgewählt
            </Text>
        </Card>
    );
}