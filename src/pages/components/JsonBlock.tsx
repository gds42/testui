import React from 'react';
import {Box, Typography} from '@mui/material';

type Props = {
    title: string;
    data: unknown;
    maxHeight?: number;
};

export const JsonBlock: React.FC<Props> = ({title, data, maxHeight = 400}) => (
    <>
        <Typography variant="subtitle2" gutterBottom>
            {title}
        </Typography>
        <Box
            component="pre"
            sx={{
                backgroundColor: '#f5f5f5',
                p: 1.5,
                borderRadius: 1,
                maxHeight,
                overflow: 'auto',
                fontSize: 12,
            }}
        >
            {JSON.stringify(data, null, 2)}
        </Box>
    </>
);