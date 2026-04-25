// Displays the current status and error state of an upload or utility operation

import React from 'react';
import { Card, Flex, Text } from '@sanity/ui';

/**
 * Shows an upload/operation status string coloured green on success and red on error.
 * Renders in its own full-width bordered Card.
 * Accepts an optional `action` element rendered on the far right.
 * @param {Object} props
 * @param {string} props.status - Status message to display
 * @param {boolean} props.error - Whether the current status represents an error
 * @param {React.ReactNode} [props.action] - Optional element to render on the far right
 */
const StatusDisplay = ({ status, error, action }) => {
	return (
		<Card border radius={2} padding={2}>
			<Flex align="center" justify="space-between">
				<Flex align="center" gap={2}>
					<Text size={1}>Status:</Text>
					<Text size={1} style={{ color: error ? 'red' : 'green' }}>{status}</Text>
				</Flex>
				{action && action}
			</Flex>
		</Card>
	);
};

export default StatusDisplay;
