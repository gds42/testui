import {useEffect, useState} from 'react';
import {Box, Button, Card, CardContent, Checkbox, Container, Stack, TextField, Typography,} from '@mui/material';
import {useApiConfig} from '../context/ApiConfigContext';
import {
    useGetOperationsPnrInfoRequestsOperationIdentifier,
    usePostAsyncCommonPnrInfoRequests,
} from '../api/generated/api';
import type {AxiosError, AxiosResponse} from 'axios';
import type {PnrInfoResponse} from '../api/generated/api.schemas';

const StartPage = () => {
    const {apiKey, terminalCode, locked, save, logout} = useApiConfig();

    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [localTerminalCode, setLocalTerminalCode] = useState(terminalCode);
    const [pnr, setPnr] = useState('');
    const [pnrInfoMessage, setPnrInfoMessage] = useState<string>('');
    const [pnrOperationId, setPnrOperationId] = useState<string | null>(null);

    const [selectedPassengerIds, setSelectedPassengerIds] = useState<number[]>([]);
    const [selectedSegmentNumbers, setSelectedSegmentNumbers] = useState<number[]>([]);

    const {
        mutate: postPnrInfo,
        isPending: isPnrLoading,
    } = usePostAsyncCommonPnrInfoRequests();

    // запрос результата PNR Info по operationId с опросом раз в 2 секунды
    const {
        data: pnrInfoResult,
        isLoading: isPnrInfoResultLoading,
        isError: isPnrInfoResultError,
        error: pnrInfoResultError,
    } = useGetOperationsPnrInfoRequestsOperationIdentifier<
        AxiosResponse<PnrInfoResponse>,
        AxiosError
    >(
        pnrOperationId ?? '',
        {
            query: {
                enabled: !!pnrOperationId,
                // опрашиваем раз в 2 секунды, пока статус = waiting | processing
                refetchInterval: (query) => {
                    const response = query.state.data;
                    const statusCode =
                        response?.data?.status?.processingStatusCode;

                    // TS не знает про 'waiting', поэтому приводим к any
                    const isWaiting =
                        (statusCode as string) === 'waiting';
                    const isProcessing = statusCode === 'processing';

                    if (isWaiting || isProcessing) {
                        return 2000;
                    }

                    // другие статусы или ошибка — прекращаем опрос
                    return false;
                },
            },
        },
    );

    useEffect(() => {
        setLocalApiKey(apiKey);
        setLocalTerminalCode(terminalCode);
    }, [apiKey, terminalCode]);

    const handleSave = () => save(localApiKey, localTerminalCode);

    const handleLogout = () => {
        logout();
        setPnr('');
        setPnrInfoMessage('');
        setPnrOperationId(null);
    };

    const handlePnrInfo = () => {
        // очищаем предыдущее сообщение и результат
        setPnrInfoMessage('');
        setPnrOperationId(null);

        postPnrInfo(
            {
                data: {
                    reservationReference: pnr,
                } as any,
                params: {
                    terminalCode: terminalCode,
                },
            },
            {
                onSuccess: (response) => {
                    // response: AxiosResponse<OperationResponse>
                    const operationId = (response.data as any)?.operationIdentifier;

                    if (operationId) {
                        setPnrOperationId(operationId);
                        setPnrInfoMessage(`operationId: ${operationId}`);
                    } else {
                        setPnrInfoMessage('operationId не найден в ответе');
                    }
                },
                onError: (error) => {
                    const axiosError = error as AxiosError<any>;
                    const status = axiosError.response?.status;
                    const body = axiosError.response?.data;

                    let bodyString = '';
                    if (body !== undefined) {
                        bodyString =
                            typeof body === 'string'
                                ? body
                                : JSON.stringify(body);
                    }

                    setPnrInfoMessage(
                        `Ошибка${status ? ` ${status}` : ''}${
                            bodyString ? `, body: ${bodyString}` : ''
                        }`,
                    );
                },
            },
        );
    };

    const isSaveDisabled = !localApiKey || !localTerminalCode || locked;
    const isPnrValid = /^[А-ЯA-Za-z0-9]{6}$/.test(pnr);

    return (
        <Container maxWidth="md" sx={{mt: 2}}>
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
                    {/* ГОРИЗОНТАЛЬНАЯ ЛИНИЯ */}
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
                            onChange={(e) => setLocalApiKey(e.target.value)}
                            disabled={locked}
                            size="small"
                        />

                        <TextField
                            label="Terminal code"
                            value={localTerminalCode}
                            onChange={(e) => setLocalTerminalCode(e.target.value)}
                            disabled={locked}
                            size="small"
                        />

                        {locked ? (
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={handleLogout}
                                size="medium"
                            >
                                Logout
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSave}
                                disabled={isSaveDisabled}
                                size="medium"
                            >
                                Save
                            </Button>
                        )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                        {locked
                            ? 'Параметры сохранены. Нажмите Logout, чтобы изменить значения.'
                            : 'Заполните оба поля и нажмите Save.'}
                    </Typography>
                </CardContent>
            </Card>

            {/* Весь остальной контент доступен только после Save (locked === true) */}
            {locked && (
                <>
                    {/* Блок запроса PNR Info */}
                    <Box mt={2}>
                        <Card sx={{p: 2}}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    label="PNR Info"
                                    placeholder="Введите PNR номер"
                                    value={pnr}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        if (val.length <= 6 && /^[A-ZА-Я0-9]*$/.test(val)) {
                                            setPnr(val);
                                        }
                                    }}
                                    disabled={isPnrLoading}
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handlePnrInfo}
                                    disabled={!isPnrValid || isPnrLoading}
                                >
                                    PNR Info
                                </Button>
                                {pnrInfoMessage && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{whiteSpace: 'nowrap'}}
                                    >
                                        {pnrInfoMessage}
                                    </Typography>
                                )}
                            </Stack>
                        </Card>
                    </Box>

                    {/* Новый блок под PNR Info: ожидание и результат */}
                    {pnrOperationId && (
                        <Box mt={2}>
                            <Card sx={{p: 2}}>
                                {isPnrInfoResultError && (
                                    <Typography color="error" variant="body2">
                                        Ошибка при получении результата PNR Info:{' '}
                                        {pnrInfoResultError?.message}
                                    </Typography>
                                )}

                                {!isPnrInfoResultError && (
                                    <>
                                        {(() => {
                                            const statusCode =
                                                pnrInfoResult?.data.status
                                                    .processingStatusCode;

                                            const isWaiting =
                                                (statusCode as any) === 'waiting';
                                            const isProcessing =
                                                statusCode === 'processing';

                                            // пока статус waiting | processing
                                            if (
                                                isWaiting ||
                                                isProcessing ||
                                                (!pnrInfoResult && isPnrInfoResultLoading)
                                            ) {
                                                return (
                                                    <Typography variant="body2">
                                                        {'подождите, ждем результат операции' +
                                                            (statusCode
                                                                ? ' (status: ' + statusCode + ')'
                                                                : '')}
                                                    </Typography>
                                                );
                                            }

                                            // другие статусы — показываем результат
                                            if (pnrInfoResult) {
                                                const pnrData =
                                                    (pnrInfoResult.data)
                                                        .reservationData;

                                                const travellers =
                                                    pnrData?.travellers ?? [];
                                                const segments =
                                                    pnrData?.reservationSegments ?? [];

                                                const anyPassengerSelected =
                                                    selectedPassengerIds.length > 0;
                                                const disablePassengers =
                                                    selectedSegmentNumbers.length > 0;
                                                const disableSegments =
                                                    anyPassengerSelected;

                                                const handlePassengerToggle = (
                                                    travellerId?: number,
                                                ) => {
                                                    if (travellerId == null) {
                                                        return;
                                                    }
                                                    setSelectedPassengerIds((prev) =>
                                                        prev.includes(travellerId)
                                                            ? prev.filter(
                                                                  (id) =>
                                                                      id !== travellerId,
                                                              )
                                                            : prev.concat(travellerId),
                                                    );
                                                };

                                                const handleSegmentToggle = (
                                                    segmentNumber?: number,
                                                ) => {
                                                    if (segmentNumber == null) {
                                                        return;
                                                    }
                                                    setSelectedSegmentNumbers((prev) =>
                                                        prev.includes(segmentNumber)
                                                            ? prev.filter(
                                                                  (n) =>
                                                                      n !==
                                                                      segmentNumber,
                                                              )
                                                            : prev.concat(
                                                                  segmentNumber,
                                                              ),
                                                    );
                                                };

                                                return (
                                                    <>
                                                        <Typography
                                                            variant="subtitle2"
                                                            gutterBottom
                                                        >
                                                            Результат PNR Info (JSON):
                                                        </Typography>
                                                        <Box
                                                            component="pre"
                                                            sx={{
                                                                backgroundColor:
                                                                    '#f5f5f5',
                                                                p: 1.5,
                                                                borderRadius: 1,
                                                                maxHeight: 400,
                                                                overflow: 'auto',
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            {JSON.stringify(
                                                                pnrInfoResult.data,
                                                                null,
                                                                2,
                                                            )}
                                                        </Box>

                                                        {/* Блок Request Fare Info */}
                                                        {pnrData && (
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
                                                                    {/* Пассажиры */}
                                                                    <Box flex={1}>
                                                                        <Typography
                                                                            variant="subtitle1"
                                                                            gutterBottom
                                                                        >
                                                                            Пассажиры
                                                                        </Typography>

                                                                        {travellers.length ===
                                                                        0 ? (
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.secondary"
                                                                            >
                                                                                Нет данных о
                                                                                пассажирах
                                                                            </Typography>
                                                                        ) : (
                                                                            <Stack
                                                                                spacing={1}
                                                                            >
                                                                                {travellers.map(
                                                                                    (
                                                                                        t,
                                                                                        index,
                                                                                    ) => {
                                                                                        const id =
                                                                                            t.travellerIdentifier ??
                                                                                            index +
                                                                                                1;
                                                                                        const isChecked =
                                                                                            selectedPassengerIds.includes(
                                                                                                id,
                                                                                            );

                                                                                        const labelParts: string[] =
                                                                                            [];

                                                                                        labelParts.push(
                                                                                            '№ ' +
                                                                                                id,
                                                                                        );
                                                                                        if (
                                                                                            t.lastName
                                                                                        ) {
                                                                                            labelParts.push(
                                                                                                t.lastName,
                                                                                            );
                                                                                        }
                                                                                        if (
                                                                                            t.firstName
                                                                                        ) {
                                                                                            labelParts.push(
                                                                                                t.firstName,
                                                                                            );
                                                                                        }
                                                                                        if (
                                                                                            t.birthDate
                                                                                        ) {
                                                                                            labelParts.push(
                                                                                                'д.р. ' +
                                                                                                    t.birthDate,
                                                                                            );
                                                                                        }

                                                                                        return (
                                                                                            <Stack
                                                                                                key={
                                                                                                    'traveller-' +
                                                                                                    id
                                                                                                }
                                                                                                direction="row"
                                                                                                spacing={
                                                                                                    1
                                                                                                }
                                                                                                alignItems="center"
                                                                                            >
                                                                                                <Checkbox
                                                                                                    checked={
                                                                                                        isChecked
                                                                                                    }
                                                                                                    disabled={
                                                                                                        disablePassengers
                                                                                                    }
                                                                                                    onChange={() =>
                                                                                                        handlePassengerToggle(
                                                                                                            id,
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                                <Typography variant="body2">
                                                                                                    {labelParts.join(
                                                                                                        ', ',
                                                                                                    )}
                                                                                                </Typography>
                                                                                            </Stack>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </Stack>
                                                                        )}
                                                                    </Box>

                                                                    {/* Сегменты */}
                                                                    <Box flex={1}>
                                                                        <Typography
                                                                            variant="subtitle1"
                                                                            gutterBottom
                                                                        >
                                                                            Сегменты
                                                                        </Typography>

                                                                        {segments.length ===
                                                                        0 ? (
                                                                            <Typography
                                                                                variant="body2"
                                                                                color="text.secondary"
                                                                            >
                                                                                Нет данных о
                                                                                сегментах
                                                                            </Typography>
                                                                        ) : (
                                                                            <Stack
                                                                                spacing={1}
                                                                            >
                                                                                {segments.map(
                                                                                    (
                                                                                        s,
                                                                                        index,
                                                                                    ) => {
                                                                                        const segmentNumber =
                                                                                            s.segmentNumber ??
                                                                                            index +
                                                                                                1;
                                                                                        const isChecked =
                                                                                            selectedSegmentNumbers.includes(
                                                                                                segmentNumber,
                                                                                            );

                                                                                        const mainPart =
                                                                                            (s.carrierCode ||
                                                                                                '') +
                                                                                            '-' +
                                                                                            (s.flightNumber ||
                                                                                                '');
                                                                                        const datesPart =
                                                                                            (s.departureDate ||
                                                                                                '') +
                                                                                            ' → ' +
                                                                                            (s.arrivalDate ||
                                                                                                '');
                                                                                        const airportsPart =
                                                                                            (s.fromAirport ||
                                                                                                '') +
                                                                                            ' → ' +
                                                                                            (s.toAirport ||
                                                                                                '');

                                                                                        return (
                                                                                            <Stack
                                                                                                key={
                                                                                                    'segment-' +
                                                                                                    segmentNumber
                                                                                                }
                                                                                                direction="row"
                                                                                                spacing={
                                                                                                    1
                                                                                                }
                                                                                                alignItems="center"
                                                                                            >
                                                                                                <Checkbox
                                                                                                    checked={
                                                                                                        isChecked
                                                                                                    }
                                                                                                    disabled={
                                                                                                        disableSegments
                                                                                                    }
                                                                                                    onChange={() =>
                                                                                                        handleSegmentToggle(
                                                                                                            segmentNumber,
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                                <Typography variant="body2">
                                                                                                    {'№ ' +
                                                                                                        segmentNumber +
                                                                                                        ' ' +
                                                                                                        mainPart +
                                                                                                        '  ' +
                                                                                                        datesPart +
                                                                                                        '  ' +
                                                                                                        airportsPart}
                                                                                                </Typography>
                                                                                            </Stack>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </Stack>
                                                                        )}
                                                                    </Box>
                                                                </Stack>
                                                            </Box>
                                                        )}
                                                    </>
                                                );
                                            }

                                            // дефолтное сообщение ожидания
                                            return (
                                                <Typography variant="body2">
                                                    подождите, ждем результат операции
                                                </Typography>
                                            );
                                        })()}
                                    </>
                                )}
                            </Card>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
};

export default StartPage;