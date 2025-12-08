import React from 'react';
import {Box, Button, Card, Stack, Typography} from '@mui/material';
import type {AxiosError, AxiosResponse} from 'axios';
import type {
    PnrInfoResponse,
    RefundFareCalculationResponse,
} from '../../api/generated/api.schemas';
import {JsonBlock} from './JsonBlock';
import {TravellersList} from './TravellersList';
import {SegmentsList} from './SegmentsList';

type Props = {
    pnrOperationId: string | null;
    pnrInfoResult?: AxiosResponse<PnrInfoResponse>;
    isPnrInfoResultLoading: boolean;
    isPnrInfoResultError: boolean;
    pnrInfoResultError?: AxiosError;
    selectedPassengerIds: number[];
    selectedSegmentNumbers: number[];
    setSelectedPassengerIds: React.Dispatch<React.SetStateAction<number[]>>;
    setSelectedSegmentNumbers: React.Dispatch<React.SetStateAction<number[]>>;
    fareOperationId: string | null;
    fareResult?: AxiosResponse<RefundFareCalculationResponse>;
    isFareResultLoading: boolean;
    isFareResultError: boolean;
    fareResultError?: AxiosError;
    fareInfoMessage: string;
    onFareInfoClick: () => void;
};

export const PnrResultAndFareBlock: React.FC<Props> = ({
                                                           pnrOperationId,
                                                           pnrInfoResult,
                                                           isPnrInfoResultLoading,
                                                           isPnrInfoResultError,
                                                           pnrInfoResultError,
                                                           selectedPassengerIds,
                                                           selectedSegmentNumbers,
                                                           setSelectedPassengerIds,
                                                           setSelectedSegmentNumbers,
                                                           fareOperationId,
                                                           fareResult,
                                                           isFareResultLoading,
                                                           isFareResultError,
                                                           fareResultError,
                                                           fareInfoMessage,
                                                           onFareInfoClick,
                                                       }) => {
    if (!pnrOperationId) return null;

    const renderPnrStatus = () => {
        const statusCode = pnrInfoResult?.data.status.processingStatusCode;
        const isWaiting = (statusCode as any) === 'waiting';
        const isProcessing = statusCode === 'processing';

        if (
            isWaiting ||
            isProcessing ||
            (!pnrInfoResult && isPnrInfoResultLoading)
        ) {
            return (
                <Typography variant="body2">
                    {'Please wait, we are waiting for the results of the operation.' +
                        (statusCode ? ' (status: ' + statusCode + ')' : '')}
                </Typography>
            );
        }
        return null;
    };

    const renderFareResult = () => {
        if (!fareOperationId) return null;

        if (isFareResultError) {
            return (
                <Typography color="error" variant="body2">
                    Error while getting result on Fare Request:{' '}
                    {fareResultError?.message}
                </Typography>
            );
        }

        const statusCodeFare =
            fareResult?.data.status.processingStatusCode;
        const isWaitingFare = (statusCodeFare as any) === 'waiting';
        const isProcessingFare = statusCodeFare === 'processing';

        if (
            isWaitingFare ||
            isProcessingFare ||
            (!fareResult && isFareResultLoading)
        ) {
            return (
                <Typography variant="body2">
                    {'Please wait, we are waiting for the return for Fare operation result.' +
                        (statusCodeFare
                            ? ' (status: ' + statusCodeFare + ')'
                            : '')}
                </Typography>
            );
        }

        if (!fareResult) return null;

        return (
            <JsonBlock
                title="Result of Fare Request (JSON):"
                data={fareResult.data}
            />
        );
    };

    return (
        <Box mt={2}>
            <Card sx={{p: 2}}>
                {isPnrInfoResultError && (
                    <Typography color="error" variant="body2">
                        Error while getting result on PNR Info:{' '}
                        {pnrInfoResultError?.message}
                    </Typography>
                )}

                {!isPnrInfoResultError && (
                    <>
                        {renderPnrStatus()}

                        {pnrInfoResult && (
                            <>
                                <JsonBlock
                                    title="PNR Info results (JSON):"
                                    data={pnrInfoResult.data}
                                />

                                {pnrInfoResult.data.reservationData && (
                                    <Box mt={3}>
                                        <Typography
                                            variant="h6"
                                            gutterBottom
                                        >
                                            Request Fare Info
                                        </Typography>

                                        <Stack
                                            direction={{
                                                xs: 'column',
                                                md: 'row',
                                            }}
                                            spacing={3}
                                        >
                                            <Box flex={1}>
                                                <Typography
                                                    variant="subtitle1"
                                                    gutterBottom
                                                >
                                                    Passengers
                                                </Typography>
                                                <TravellersList
                                                    travellers={
                                                        pnrInfoResult.data
                                                            .reservationData
                                                            ?.travellers ?? []
                                                    }
                                                    selectedPassengerIds={
                                                        selectedPassengerIds
                                                    }
                                                    selectedSegmentNumbers={
                                                        selectedSegmentNumbers
                                                    }
                                                    onToggle={(id) =>
                                                        setSelectedPassengerIds(
                                                            (prev) =>
                                                                prev.includes(
                                                                    id,
                                                                )
                                                                    ? prev.filter(
                                                                        (
                                                                            x,
                                                                        ) =>
                                                                            x !==
                                                                            id,
                                                                    )
                                                                    : prev.concat(
                                                                        id,
                                                                    ),
                                                        )
                                                    }
                                                />
                                            </Box>

                                            <Box flex={1}>
                                                <Typography
                                                    variant="subtitle1"
                                                    gutterBottom
                                                >
                                                    Segments
                                                </Typography>
                                                <SegmentsList
                                                    segments={
                                                        pnrInfoResult.data
                                                            .reservationData
                                                            ?.reservationSegments ??
                                                        []
                                                    }
                                                    selectedPassengerIds={
                                                        selectedPassengerIds
                                                    }
                                                    selectedSegmentNumbers={
                                                        selectedSegmentNumbers
                                                    }
                                                    onToggle={(num) =>
                                                        setSelectedSegmentNumbers(
                                                            (prev) =>
                                                                prev.includes(
                                                                    num,
                                                                )
                                                                    ? prev.filter(
                                                                        (
                                                                            x,
                                                                        ) =>
                                                                            x !==
                                                                            num,
                                                                    )
                                                                    : prev.concat(
                                                                        num,
                                                                    ),
                                                        )
                                                    }
                                                />
                                            </Box>
                                        </Stack>

                                        <Box
                                            mt={2}
                                            display="flex"
                                            alignItems="center"
                                            gap={2}
                                        >
                                            <Button
                                                variant="contained"
                                                onClick={onFareInfoClick}
                                                disabled={isFareResultLoading}
                                            >
                                                Fare Info
                                            </Button>
                                            {fareInfoMessage && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {fareInfoMessage}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Box mt={2}>{renderFareResult()}</Box>
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                )}
            </Card>
        </Box>
    );
};