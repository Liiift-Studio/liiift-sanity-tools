// Displays the current status and error state of an upload or utility operation

import React from 'react';
import { Flex, Text } from '@sanity/ui';

/**
 * Shows an upload/operation status string coloured green on success and red on error.
 * @param {Object} props
 * @param {string} props.status - Status message to display
 * @param {boolean} props.error - Whether the current status represents an error
 */
const StatusDisplay = ({ status, error }) => {
	return (
		<Flex paddingTop={1} paddingBottom={3}>
			<Text weight="" style={{ paddingRight: '8px' }}>Status:</Text>
			<Text style={{ color: error ? 'red' : 'green' }}>
				{status}
			</Text>
		</Flex>
	);
};

export default StatusDisplay;
