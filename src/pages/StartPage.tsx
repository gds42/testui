import {useEffect, useState} from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Container,
    Stack,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {useApiConfig} from '../context/ApiConfigContext';
import {
    useGetOperationsPnrInfoRequestsOperationIdentifier,
    useGetOperationsRefundFareRequestsOperationIdentifier,
    usePostAsyncCommonPnrInfoRequests,
    usePostAsyncRefundFareRequests,
} from '../api/generated/api';
import type {AxiosError, AxiosResponse} from 'axios';
import type {PnrInfoResponse, RefundFareCalculationResponse} from '../api/generated/api.schemas';
import {SessionTypeParameter} from '../api/generated/api.schemas';

const StartPage = () => {
    const {apiKey, terminalCode, sessionType, locked, save, logout} = useApiConfig();

    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [localTerminalCode, setLocalTerminalCode] = useState(terminalCode);
    const [localSessionType, setLocalSessionType] =
        useState(sessionType);
    const [pnr, setPnr] = useState('');
    const [pnrInfoMessage, setPnrInfoMessage] = useState<string>('');
    const [pnrOperationId, setPnrOperationId] = useState<string | null>(null);

    const [selectedPassengerIds, setSelectedPassengerIds] = useState<number[]>([]);
    const [selectedSegmentNumbers, setSelectedSegmentNumbers] = useState<number[]>([]);

    // состояние для Fare Info
    const [fareOperationId, setFareOperationId] = useState<string | null>(null);
    const [fareInfoMessage, setFareInfoMessage] = useState<string>('');

    const {
        mutate: postPnrInfo,
        isPending: isPnrLoading,
    } = usePostAsyncCommonPnrInfoRequests();

    const {
        mutate: postFareInfo,
        isPending: isFareLoading,
    } = usePostAsyncRefundFareRequests();

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

    // опрос результата Fare Request по operationId
    const {
        data: fareResult,
        isLoading: isFareResultLoading,
        isError: isFareResultError,
        error: fareResultError,
    } = useGetOperationsRefundFareRequestsOperationIdentifier<
        AxiosResponse<RefundFareCalculationResponse>,
        AxiosError
    >(
        fareOperationId ?? '',
        {
            query: {
                enabled: !!fareOperationId,
                refetchInterval: (query) => {
                    const response = query.state.data;
                    const statusCode = response?.data?.status?.processingStatusCode;

                    const isWaiting = (statusCode as any) === 'waiting';
                    const isProcessing = statusCode === 'processing';

                    if (isWaiting || isProcessing) {
                        return 2000;
                    }

                    return false;
                },
            },
        },
    );

    useEffect(() => {
        setLocalApiKey(apiKey);
        setLocalTerminalCode(terminalCode);
        setLocalSessionType(sessionType);
    }, [apiKey, terminalCode, sessionType]);

    const handleSave = () => save(localApiKey, localTerminalCode, localSessionType);

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
                    sessionType: sessionType,
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

    const handleFareInfo = () => {
        if (!pnr) {
            return;
        }

        setFareInfoMessage('');
        setFareOperationId(null);

        const body: any = {
            reservationReference: pnr,
            // всегда отправляем массивы, даже если они пустые
            ticketNumbers: [],
            emdNumbers: [],
            passengerIndexes:
                selectedPassengerIds.length > 0 ? selectedPassengerIds : [],
            segmentNumbers:
                selectedSegmentNumbers.length > 0 ? selectedSegmentNumbers : [],
        };

        postFareInfo(
            {
                data: body,
                params: {
                    terminalCode: terminalCode,
                    sessionType: sessionType,
                },
            } as any,
            {
                onSuccess: (response) => {
                    const operationId = (response.data as any)?.operationIdentifier;
                    if (operationId) {
                        setFareOperationId(operationId);
                        setFareInfoMessage('Fare operationId: ' + operationId);
                    } else {
                        setFareInfoMessage(
                            'operationId не найден в ответе Fare Request',
                        );
                    }
                },
                onError: (error) => {
                    const axiosError = error as AxiosError<any>;
                    const status = axiosError.response?.status;
                    const bodyData = axiosError.response?.data;

                    let bodyString = '';
                    if (bodyData !== undefined) {
                        bodyString =
                            typeof bodyData === 'string'
                                ? bodyData
                                : JSON.stringify(bodyData);
                    }

                    setFareInfoMessage(
                        'Ошибка Fare Request' +
                            (status ? ' ' + status : '') +
                            (bodyString ? ', body: ' + bodyString : ''),
                    );
                },
            },
        );
    };

    const isSaveDisabled =
        !localApiKey || !localTerminalCode || !localSessionType || locked;
    const isPnrValid = /^[А-ЯA-Za-z0-9]{6}$/.test(pnr);
    const sessionOptions = Object.values(SessionTypeParameter);

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

                        <FormControl size="small" sx={{minWidth: 160}} disabled={locked}>
                            <InputLabel id="session-type-label">Сессия</InputLabel>
                            <Select
                                labelId="session-type-label"
                                label="Сессия"
                                value={localSessionType}
                                onChange={(e) =>
                                    setLocalSessionType(e.target.value as SessionTypeParameter)
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
                            : 'Заполните все поля и нажмите Save.'}
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

                                                                {/* Кнопка Fare Info и сообщение */}
                                                                <Box
                                                                    mt={2}
                                                                    display="flex"
                                                                    alignItems="center"
                                                                    gap={2}
                                                                >
                                                                    <Button
                                                                        variant="contained"
                                                                        onClick={handleFareInfo}
                                                                        // кнопка активна всегда (в рамках этого блока),
                                                                        // только блокируем на время отправки
                                                                        disabled={isFareLoading}
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

                                                                {/* Результат Fare Request */}
                                                                {fareOperationId && (
                                                                    <Box mt={2}>
                                                                        {isFareResultError && (
                                                                            <Typography
                                                                                color="error"
                                                                                variant="body2"
                                                                            >
                                                                                Ошибка при
                                                                                получении
                                                                                результата Fare
                                                                                Request:{' '}
                                                                                {
                                                                                    fareResultError?.message
                                                                                }
                                                                            </Typography>
                                                                        )}

                                                                        {!isFareResultError && (
                                                                            <>
                                                                                {(() => {
                                                                                    const statusCodeFare =
                                                                                        fareResult
                                                                                            ?.data
                                                                                            .status
                                                                                            .processingStatusCode;

                                                                                    const isWaitingFare =
                                                                                        (statusCodeFare as any) ===
                                                                                        'waiting';
                                                                                    const isProcessingFare =
                                                                                        statusCodeFare ===
                                                                                        'processing';

                                                                                    if (
                                                                                        isWaitingFare ||
                                                                                        isProcessingFare ||
                                                                                        (!fareResult &&
                                                                                            isFareResultLoading)
                                                                                    ) {
                                                                                        return (
                                                                                            <Typography variant="body2">
                                                                                                {'подождите, ждем результат Fare операции' +
                                                                                                    (statusCodeFare
                                                                                                        ? ' (status: ' +
                                                                                                          statusCodeFare +
                                                                                                          ')'
                                                                                                        : '')}
                                                                                            </Typography>
                                                                                        );
                                                                                    }

                                                                                    if (fareResult) {
                                                                                        return (
                                                                                            <>
                                                                                                <Typography
                                                                                                    variant="subtitle2"
                                                                                                    gutterBottom
                                                                                                >
                                                                                                    Результат
                                                                                                    Fare
                                                                                                    Request
                                                                                                    (JSON):
                                                                                                </Typography>
                                                                                                <Box
                                                                                                    component="pre"
                                                                                                    sx={{
                                                                                                        backgroundColor:
                                                                                                            '#f5f5f5',
                                                                                                        p: 1.5,
                                                                                                        borderRadius: 1,
                                                                                                        maxHeight: 400,
                                                                                                        overflow:
                                                                                                            'auto',
                                                                                                        fontSize: 12,
                                                                                                    }}
                                                                                                >
                                                                                                    {JSON.stringify(
                                                                                                        fareResult.data,
                                                                                                        null,
                                                                                                        2,
                                                                                                    )}
                                                                                                </Box>
                                                                                            </>
                                                                                        );
                                                                                    }

                                                                                    return null;
                                                                                })()}
                                                                            </>
                                                                        )}
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </>
                                                );
                                            }

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