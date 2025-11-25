import {useEffect, useState} from 'react';
import {Container} from '@mui/material';
import {useApiConfig} from '../context/ApiConfigContext';
import {
    useGetOperationsPnrInfoRequestsOperationIdentifier,
    useGetOperationsRefundFareRequestsOperationIdentifier,
    usePostAsyncCommonPnrInfoRequests,
    usePostAsyncRefundFareRequests,
} from '../api/generated/api';
import type {AxiosError, AxiosResponse} from 'axios';
import type {
    PnrInfoResponse,
    RefundFareCalculationResponse,
} from '../api/generated/api.schemas';
import {SessionTypeParameter} from '../api/generated/api.schemas';
import {StartPageHeader} from './components/StartPageHeader';
import {PnrInfoForm} from './components/PnrInfoForm';
import {PnrResultAndFareBlock} from './components/PnrResultAndFareBlock';

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

    const {
        mutate: postPnrInfo,
        isPending: isPnrLoading,
    } = usePostAsyncCommonPnrInfoRequests();

    const {
        mutate: postFareInfo,
        isPending: isFareLoading,
    } = usePostAsyncRefundFareRequests();

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
    };

    const handlePnrInfo = () => {
        setPnrInfoMessage('');
        setPnrOperationId(null);
        setSelectedPassengerIds([]);
        setSelectedSegmentNumbers([]);
        setFareInfoMessage('');
        setFareOperationId(null);

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
                            'operationId не найден в ответе',
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
                </>
            )}
        </Container>
    );
};

export default StartPage;