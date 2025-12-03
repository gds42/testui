// src/pages/components/RefundBlock.tsx
import React from 'react';
import { Box, Button, Card, Typography, CircularProgress } from '@mui/material';
import type { AxiosError, AxiosResponse } from 'axios';
import type { RefundResultResponse } from '../../api/generated/api.schemas';
import { JsonBlock } from './JsonBlock';

type Props = {
    isVisible: boolean;
    isRefundLoading: boolean;
    refundOperationId: string | null;
    refundResult?: AxiosResponse<RefundResultResponse>;
    isRefundResultLoading: boolean;
    isRefundResultError: boolean;
    refundResultError?: AxiosError;
    refundInfoMessage: string;
    onExecuteRefund: () => void;
};

export const RefundBlock: React.FC<Props> = ({
                                                 isVisible,
                                                 isRefundLoading,
                                                 refundOperationId,
                                                 refundResult,
                                                 isRefundResultLoading,
                                                 isRefundResultError,
                                                 refundResultError,
                                                 refundInfoMessage,
                                                 onExecuteRefund,
                                             }) => {
    if (!isVisible) return null;

    const renderRefundResult = () => {
        if (!refundOperationId) return null;

        if (isRefundResultError) {
            return (
                <Typography color="error" variant="body2">
                    Ошибка при получении результата Refund:{' '}
                    {refundResultError?.message}
                </Typography>
            );
        }

        const statusCode = refundResult?.data?.status?.processingStatusCode;
        const isWaiting = (statusCode as any) === 'waiting';
        const isProcessing = statusCode === 'processing';

        if (isWaiting || isProcessing || (!refundResult && isRefundResultLoading)) {
            return (
                <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">
                        {'Подождите, ждем результат операции возврата' +
                            (statusCode ? ' (status: ' + statusCode + ')' : '')}
                    </Typography>
                </Box>
            );
        }

        if (!refundResult) return null;

        return (
            <JsonBlock
                title="Результат Refund (JSON):"
                data={refundResult.data}
            />
        );
    };

    const isButtonDisabled = isRefundLoading || isRefundResultLoading || !!refundOperationId;

    return (
        <Box mt={2}>
            <Card sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Execute Refund
                </Typography>

                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onExecuteRefund}
                        disabled={isButtonDisabled}
                    >
                        Execute Refund
                    </Button>
                    {refundInfoMessage && (
                        <Typography variant="body2" color="text.secondary">
                            {refundInfoMessage}
                        </Typography>
                    )}
                </Box>

                <Box mt={2}>{renderRefundResult()}</Box>
            </Card>
        </Box>
    );
};