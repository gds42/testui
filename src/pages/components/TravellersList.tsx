import React from 'react';
import {Checkbox, Stack, Typography} from '@mui/material';
import type {PnrInfoResponse} from '../../api/generated/api.schemas';

type TravellersArray =
  NonNullable<PnrInfoResponse['reservationData']>['travellers']; // Traveller[] | undefined

type Traveller = NonNullable<TravellersArray>[number]; // Traveller

type Props = {
    travellers: Traveller[];
    selectedPassengerIds: number[];
    selectedSegmentNumbers: number[];
    onToggle: (travellerId: number) => void;
};

export const TravellersList: React.FC<Props> = ({
                                                    travellers,
                                                    selectedPassengerIds,
                                                    selectedSegmentNumbers,
                                                    onToggle,
                                                }) => {
    if (travellers.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                Нет данных о пассажирах
            </Typography>
        );
    }

    const disablePassengers = selectedSegmentNumbers.length > 0;

    return (
        <Stack spacing={1}>
            {travellers.map((t, index) => {
                const id = t.travellerIdentifier ?? index + 1;
                const isChecked = selectedPassengerIds.includes(id);

                const labelParts: string[] = [];
                labelParts.push('№ ' + id);
                if (t.lastName) labelParts.push(t.lastName);
                if (t.firstName) labelParts.push(t.firstName);
                if (t.birthDate) labelParts.push('д.р. ' + t.birthDate);

                return (
                    <Stack
                        key={'traveller-' + id}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >
                        <Checkbox
                            checked={isChecked}
                            disabled={disablePassengers}
                            onChange={() => onToggle(id)}
                        />
                        <Typography variant="body2">
                            {labelParts.join(', ')}
                        </Typography>
                    </Stack>
                );
            })}
        </Stack>
    );
};