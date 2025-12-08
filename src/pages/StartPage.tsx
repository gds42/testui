import {useEffect, useState} from 'react';
import {Container} from '@mui/material';
import {useApiConfig} from '../context/ApiConfigContext';
import {
    useGetOperationsPnrInfoRequestsOperationIdentifier,
    useGetOperationsRefundFareRequestsOperationIdentifier,
    useGetOperationsRefundRefundRequestsOperationIdentifier,
    usePostAsyncCommonPnrInfoRequests,
    usePostAsyncRefundFareRequests,
    usePostAsyncRefundRefundRequests,
} from '../api/generated/api';
import type {AxiosError, AxiosResponse} from 'axios';
import type {
    PnrInfoResponse, PostAsyncRefundRefundRequestsBody,
    RefundFareCalculationResponse,
    RefundResultResponse,
} from '../api/generated/api.schemas';
import {SessionTypeParameter} from '../api/generated/api.schemas';
import {StartPageHeader} from './components/StartPageHeader';
import {PnrInfoForm} from './components/PnrInfoForm';
import {PnrResultAndFareBlock} from './components/PnrResultAndFareBlock';
import {RefundBlock} from './components/RefundBlock';

const StartPage = () => {
    const {apiKey, terminalCode, sessionType, locked, save, logout} =
        useApiConfig();

    const [localApiKey, setLocalApiKey] = useState(apiKey);
    const [localTerminalCode, setLocalTerminalCode] =
        useState(terminalCode);
    const [localSessionType, setLocalSessionType] =
        useState(sessionType);

    const [pnr, setPnr] = useState('');
    const [pnrInfoMessage, setPnrInfoMessage] = useState<string>('');
    const [pnrOperationId, setPnrOperationId] = useState<string | null>(
        null,
    );

    const [selectedPassengerIds, setSelectedPassengerIds] = useState<
        number[]
    >([]);
    const [selectedSegmentNumbers, setSelectedSegmentNumbers] = useState<
        number[]
    >([]);

    const [fareOperationId, setFareOperationId] = useState<string | null>(
        null,
    );
    const [fareInfoMessage, setFareInfoMessage] = useState<string>('');

    // Новые состояния для Refund
    const [refundOperationId, setRefundOperationId] = useState<string | null>(null);
    const [refundInfoMessage, setRefundInfoMessage] = useState<string>('');
    const [showRefundBlock, setShowRefundBlock] = useState<boolean>(false);

    const {
        mutate: postPnrInfo,
        isPending: isPnrLoading,
    } = usePostAsyncCommonPnrInfoRequests();

    const {
        mutate: postFareInfo,
        isPending: isFareLoading,
    } = usePostAsyncRefundFareRequests();

    // Новый мутейт для Refund
    const {
        mutate: postRefund,
        isPending: isRefundLoading,
    } = usePostAsyncRefundRefundRequests();

    const {
        data: pnrInfoResult,
        isLoading: isPnrInfoResultLoading,
        isError: isPnrInfoResultError,
        error: pnrInfoResultError,
    } = useGetOperationsPnrInfoRequestsOperationIdentifier<
        AxiosResponse<PnrInfoResponse>,
        AxiosError
    >(pnrOperationId ?? '', {
        query: {
            enabled: !!pnrOperationId,
            refetchInterval: (query) => {
                const response = query.state.data;
                const statusCode =
                    response?.data?.status?.processingStatusCode;

                const isWaiting = (statusCode as any) === 'waiting';
                const isProcessing = statusCode === 'processing';

                if (isWaiting || isProcessing) {
                    return 2000;
                }

                return false;
            },
        },
    });

    const {
        data: fareResult,
        isLoading: isFareResultLoading,
        isError: isFareResultError,
        error: fareResultError,
    } = useGetOperationsRefundFareRequestsOperationIdentifier<
        AxiosResponse<RefundFareCalculationResponse>,
        AxiosError
    >(fareOperationId ?? '', {
        query: {
            enabled: !!fareOperationId,
            refetchInterval: (query) => {
                const response = query.state.data;
                const statusCode =
                    response?.data?.status?.processingStatusCode;

                const isWaiting = (statusCode as any) === 'waiting';
                const isProcessing = statusCode === 'processing';

                if (isWaiting || isProcessing) {
                    return 2000;
                }

                return false;
            },
        },
    });

    // Новый запрос результата Refund операции
    const {
        data: refundResult,
        isLoading: isRefundResultLoading,
        isError: isRefundResultError,
        error: refundResultError,
    } = useGetOperationsRefundRefundRequestsOperationIdentifier<
        AxiosResponse<RefundResultResponse>,
        AxiosError
    >(refundOperationId ?? '', {
        query: {
            enabled: !!refundOperationId,
            refetchInterval: (query) => {
                const response = query.state.data;
                const statusCode =
                    response?.data?.status?.processingStatusCode;

                const isWaiting = (statusCode as any) === 'waiting';
                const isProcessing = statusCode === 'processing';

                if (isWaiting || isProcessing) {
                    return 2000;
                }

                return false;
            },
        },
    });

    // Эффект для показа RefundBlock после успешного получения Fare результата
    useEffect(() => {
        if (fareResult) {
            const statusCode = fareResult.data?.status?.processingStatusCode;
            const isWaiting = (statusCode as any) === 'waiting';
            const isProcessing = statusCode === 'processing';
            
            // Показываем RefundBlock, когда операция завершена (не waiting и не processing)
            if (statusCode && !isWaiting && !isProcessing) {
                setShowRefundBlock(true);
            }
        }
    }, [fareResult]);

    useEffect(() => {
        setLocalApiKey(apiKey);
        setLocalTerminalCode(terminalCode);
        setLocalSessionType(sessionType);
    }, [apiKey, terminalCode, sessionType]);

    const handleSave = () =>
        save(localApiKey, localTerminalCode, localSessionType);

    const handleLogout = () => {
        logout();
        setPnr('');
        setPnrInfoMessage('');
        setPnrOperationId(null);
        setSelectedPassengerIds([]);
        setSelectedSegmentNumbers([]);
        setFareInfoMessage('');
        setFareOperationId(null);
        // Очистка Refund данных
        setRefundOperationId(null);
        setRefundInfoMessage('');
        setShowRefundBlock(false);
    };

    const handlePnrChange = (value: string) => {
        setPnr(value);

        // очищаем все данные, завязанные на предыдущий PNR
        setPnrInfoMessage('');
        setPnrOperationId(null);
        setSelectedPassengerIds([]);
        setSelectedSegmentNumbers([]);
        setFareInfoMessage('');
        setFareOperationId(null);
        // Очистка Refund данных
        setRefundOperationId(null);
        setRefundInfoMessage('');
        setShowRefundBlock(false);
    };

    const handlePnrInfo = () => {
        setPnrInfoMessage('');
        setPnrOperationId(null);
        setSelectedPassengerIds([]);
        setSelectedSegmentNumbers([]);
        setFareInfoMessage('');
        setFareOperationId(null);
        // Очистка Refund данных при повторном нажатии PNR Info
        setRefundOperationId(null);
        setRefundInfoMessage('');
        setShowRefundBlock(false);

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
                    const operationId = (response.data as any)
                        ?.operationIdentifier;

                    if (operationId) {
                        setPnrOperationId(operationId);
                        setPnrInfoMessage(`operationId: ${operationId}`);
                    } else {
                        setPnrInfoMessage(
                            'operationId not found in the response',
                        );
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
                        `Error${status ? ` ${status}` : ''}${
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
        // Очистка Refund данных при повторном нажатии Fare Info
        setRefundOperationId(null);
        setRefundInfoMessage('');
        setShowRefundBlock(false);

        const body: any = {
            reservationReference: pnr,
            ticketNumbers: [],
            emdNumbers: [],
            passengerIndexes:
                selectedPassengerIds.length > 0 ? selectedPassengerIds : [],
            segmentNumbers:
                selectedSegmentNumbers.length > 0
                    ? selectedSegmentNumbers
                    : [],
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
                    const operationId = (response.data as any)
                        ?.operationIdentifier;
                    if (operationId) {
                        setFareOperationId(operationId);
                        setFareInfoMessage(
                            'Fare operationId: ' + operationId,
                        );
                    } else {
                        setFareInfoMessage(
                            'operationId not found in the response on Fare Request',
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
                        'Error Fare Request' +
                        (status ? ' ' + status : '') +
                        (bodyString ? ', body: ' + bodyString : ''),
                    );
                },
            },
        );
    };

    // Новый обработчик для Execute Refund
    const handleExecuteRefund = () => {
        if (!pnr) {
            return;
        }

        setRefundInfoMessage('');
        setRefundOperationId(null);

        const body: PostAsyncRefundRefundRequestsBody = {
            fareCalculationOrderReference: fareOperationId!
        };

        postRefund(
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
                        setRefundOperationId(operationId);
                        setRefundInfoMessage('Refund operationId: ' + operationId);
                    } else {
                        setRefundInfoMessage(
                            'operationId not found in the response on Refund Request',
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

                    setRefundInfoMessage(
                        'Error Refund Request' +
                        (status ? ' ' + status : '') +
                        (bodyString ? ', body: ' + bodyString : ''),
                    );
                },
            },
        );
    };

    const sessionOptions = Object.values(SessionTypeParameter);

    return (
        <Container maxWidth="md" sx={{mt: 2}}>
            <StartPageHeader
                locked={locked}
                localApiKey={localApiKey}
                localTerminalCode={localTerminalCode}
                localSessionType={localSessionType}
                sessionOptions={sessionOptions}
                onApiKeyChange={setLocalApiKey}
                onTerminalCodeChange={setLocalTerminalCode}
                onSessionTypeChange={setLocalSessionType}
                onSave={handleSave}
                onLogout={handleLogout}
            />

            {locked && (
                <>
                    <PnrInfoForm
                        pnr={pnr}
                        isLoading={isPnrLoading}
                        infoMessage={pnrInfoMessage}
                        onPnrChange={handlePnrChange}
                        onSubmit={handlePnrInfo}
                    />

                    {pnrOperationId && (
                        <PnrResultAndFareBlock
                            pnrOperationId={pnrOperationId}
                            pnrInfoResult={pnrInfoResult}
                            isPnrInfoResultLoading={isPnrInfoResultLoading}
                            isPnrInfoResultError={isPnrInfoResultError}
                            pnrInfoResultError={
                                pnrInfoResultError ?? undefined
                            }
                            selectedPassengerIds={selectedPassengerIds}
                            selectedSegmentNumbers={selectedSegmentNumbers}
                            setSelectedPassengerIds={
                                setSelectedPassengerIds
                            }
                            setSelectedSegmentNumbers={
                                setSelectedSegmentNumbers
                            }
                            fareOperationId={fareOperationId}
                            fareResult={fareResult}
                            isFareResultLoading={isFareResultLoading}
                            isFareResultError={isFareResultError}
                            fareResultError={fareResultError ?? undefined}
                            fareInfoMessage={fareInfoMessage}
                            onFareInfoClick={handleFareInfo}
                        />
                    )}

                    {/* Новый блок Refund */}
                    <RefundBlock
                        isVisible={showRefundBlock}
                        isRefundLoading={isRefundLoading}
                        refundOperationId={refundOperationId}
                        refundResult={refundResult}
                        isRefundResultLoading={isRefundResultLoading}
                        isRefundResultError={isRefundResultError}
                        refundResultError={refundResultError ?? undefined}
                        refundInfoMessage={refundInfoMessage}
                        onExecuteRefund={handleExecuteRefund}
                    />
                </>
            )}
        </Container>
    );
};

export default StartPage;