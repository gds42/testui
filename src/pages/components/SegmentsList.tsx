import React from 'react';
import {Checkbox, Stack, Typography} from '@mui/material';

// Локальный тип сегмента: только нужные поля
type Segment = {
    segmentNumber?: number;
    carrierCode?: string;
    flightNumber?: string;
    departureDate?: string;
    arrivalDate?: string;
    fromAirport?: string;
    toAirport?: string;
};

type Props = {
    segments: Segment[];
    selectedPassengerIds: number[];
    selectedSegmentNumbers: number[];
    onToggle: (segmentNumber: number) => void;
};

export const SegmentsList: React.FC<Props> = ({
                                                  segments,
                                                  selectedPassengerIds,
                                                  selectedSegmentNumbers,
                                                  onToggle,
                                              }) => {
    if (segments.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                No segments information
            </Typography>
        );
    }

    const disableSegments = selectedPassengerIds.length > 0;

    return (
        <Stack spacing={1}>
            {segments.map((s, index) => {
                const segmentNumber = s.segmentNumber ?? index + 1;
                const isChecked = selectedSegmentNumbers.includes(segmentNumber);

                const mainPart =
                    (s.carrierCode || '') + '-' + (s.flightNumber || '');
                const datesPart =
                    (s.departureDate || '') + ' → ' + (s.arrivalDate || '');
                const airportsPart =
                    (s.fromAirport || '') + ' → ' + (s.toAirport || '');

                return (
                    <Stack
                        key={'segment-' + segmentNumber}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >
                        <Checkbox
                            checked={isChecked}
                            disabled={disableSegments}
                            onChange={() => onToggle(segmentNumber)}
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
            })}
        </Stack>
    );
};