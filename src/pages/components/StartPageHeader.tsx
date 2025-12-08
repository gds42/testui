import React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import {SessionTypeParameter} from '../../api/generated/api.schemas';

type Props = {
    locked: boolean;
    localApiKey: string;
    localTerminalCode: string;
    localSessionType: SessionTypeParameter;
    sessionOptions: SessionTypeParameter[];
    onApiKeyChange: (value: string) => void;
    onTerminalCodeChange: (value: string) => void;
    onSessionTypeChange: (value: SessionTypeParameter) => void;
    onSave: () => void;
    onLogout: () => void;
};

export const StartPageHeader: React.FC<Props> = ({
    locked,
    localApiKey,
    localTerminalCode,
    localSessionType,
    sessionOptions,
    onApiKeyChange,
    onTerminalCodeChange,
    onSessionTypeChange,
    onSave,
    onLogout,
}) => {
    const isSaveDisabled =
        !localApiKey || !localTerminalCode || !localSessionType || locked;

    return (
        <Card
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 999,
                backgroundColor: 'white',
                p: 2,
            }}
        >
            <CardContent sx={{p: 0}}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <TextField
                        label="API Key"
                        value={localApiKey}
                        onChange={(e) => onApiKeyChange(e.target.value)}
                        disabled={locked}
                        size="small"
                    />

                    <TextField
                        label="Terminal code"
                        value={localTerminalCode}
                        onChange={(e) => onTerminalCodeChange(e.target.value)}
                        disabled={locked}
                        size="small"
                    />

                    <FormControl size="small" sx={{minWidth: 160}} disabled={locked}>
                        <InputLabel id="session-type-label">Session</InputLabel>
                        <Select
                            labelId="session-type-label"
                            label="Session"
                            value={localSessionType}
                            onChange={(e) =>
                                onSessionTypeChange(
                                    e.target.value as SessionTypeParameter,
                                )
                            }
                        >
                            {sessionOptions.map((s) => (
                                <MenuItem key={s as string} value={s}>
                                    {s as string}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {locked ? (
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={onLogout}
                            size="medium"
                        >
                            Logout
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onSave}
                            disabled={isSaveDisabled}
                            size="medium"
                        >
                            Save
                        </Button>
                    )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                    {locked
                        ? 'The settings have been saved. Click Logout to change the values.'
                        : 'Fill in all fields and click Save.'}
                </Typography>
            </CardContent>
        </Card>
    );
};