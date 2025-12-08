import React from 'react';
import {Box, Button, Card, Stack, TextField, Typography} from '@mui/material';

type Props = {
    pnr: string;
    isLoading: boolean;
    infoMessage: string;
    onPnrChange: (value: string) => void;
    onSubmit: () => void;
};

export const PnrInfoForm: React.FC<Props> = ({
                                                 pnr,
                                                 isLoading,
                                                 infoMessage,
                                                 onPnrChange,
                                                 onSubmit,
                                             }) => {
    const isPnrValid = /^[А-ЯA-Za-z0-9]{6}$/.test(pnr);

    return (
        <Box mt={2}>
            <Card sx={{p: 2}}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        label="PNR Info"
                        placeholder="Enter PNR: "
                        value={pnr}
                        onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            if (val.length <= 6 && /^[A-ZА-Я0-9]*$/.test(val)) {
                                onPnrChange(val);
                            }
                        }}
                        disabled={isLoading}
                        size="small"
                    />
                    <Button
                        variant="contained"
                        onClick={onSubmit}
                        disabled={!isPnrValid || isLoading}
                    >
                        PNR Info
                    </Button>
                    {infoMessage && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{whiteSpace: 'nowrap'}}
                        >
                            {infoMessage}
                        </Typography>
                    )}
                </Stack>
            </Card>
        </Box>
    );
};