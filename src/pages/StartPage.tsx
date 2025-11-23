import {useState, useEffect} from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {useApiConfig} from '../context/ApiConfigContext';
import {usePostAsyncCommonPnrInfoRequests} from '../api/generated/api';
import type {AxiosError} from 'axios';

const StartPage = () => {
    const {apiKey, terminalCode, locked, save, logout} = useApiConfig();

    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [localTerminalCode, setLocalTerminalCode] = useState(terminalCode);
    const [pnr, setPnr] = useState('');
    const [pnrInfoMessage, setPnrInfoMessage] = useState<string>('');

    const {
        mutate: postPnrInfo,
        isPending: isPnrLoading,
    } = usePostAsyncCommonPnrInfoRequests();

    useEffect(() => {
        setLocalApiKey(apiKey);
        setLocalTerminalCode(terminalCode);
    }, [apiKey, terminalCode]);

    const handleSave = () => save(localApiKey, localTerminalCode);

    const handleLogout = () => {
        logout();
        setPnr('');
        setPnrInfoMessage('');
    };

    const handlePnrInfo = () => {
        // очищаем предыдущее сообщение
        setPnrInfoMessage('');

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
                    setPnrInfoMessage(
                        operationId
                            ? `operationId: ${operationId}`
                            : 'operationId не найден в ответе',
                    );
                },
                onError: (error) => {
                    const axiosError = error as AxiosError<any>;
                    const status = axiosError.response?.status;
                    const body = axiosError.response?.data;

                    const bodyString =
                        body === undefined
                            ? ''
                            : typeof body === 'string'
                            ? body
                            : JSON.stringify(body);

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
    const isPnrValid = /^[A-Za-z0-9]{6}$/.test(pnr);

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

                    {/* Дополнительный контент */}
                    <Box mt={4}>
                        <Typography>
                            Длинный контент страницы. При скролле он уходит под панель.
                        </Typography>
                    </Box>
                </>
            )}
        </Container>
    );
};

export default StartPage;