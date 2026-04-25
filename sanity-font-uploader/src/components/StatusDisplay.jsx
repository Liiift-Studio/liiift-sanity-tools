// Status and error feedback card — hidden when idle, coloured by outcome
import React from 'react';
import { Card, Text } from '@sanity/ui';

/**
 * Shows an upload/operation status string as a toned card.
 * Returns null when status is 'ready' or empty so nothing renders during idle state.
 * @param {Object} props
 * @param {string} props.status - Status message to display
 * @param {boolean} props.error - Whether the current status represents an error
 */
const StatusDisplay = ({ status, error }) => {
	if (!status || status === 'ready') return null;

	return (
		<Card border radius={2} padding={3} marginBottom={2} tone={error ? 'critical' : 'positive'}>
			<Text size={1}>{status}</Text>
		</Card>
	);
};

export default StatusDisplay;
