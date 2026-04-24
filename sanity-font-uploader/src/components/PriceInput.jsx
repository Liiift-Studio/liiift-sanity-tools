// Numeric price input field for setting a font style price

import React from 'react';
import { Flex, Text, Box, TextInput } from '@sanity/ui';

/**
 * Renders a labelled numeric price field (dollar amount).
 * @param {Object} props
 * @param {string} props.inputPrice - Current price value
 * @param {Function} props.handleInputChange - onChange handler
 */
const PriceInput = ({ inputPrice, handleInputChange }) => {
	return (
		<Box paddingBottom={3}>
			<Flex align="center">
				<Box flex={1}>
					<Text weight="">Style Price:</Text>
				</Box>
				<Flex align="center">
					<Text style={{ paddingRight: '8px' }}>$</Text>
					<TextInput
						value={inputPrice}
						onChange={handleInputChange}
						type="number"
						style={{ maxWidth: '75px', textAlign: 'right' }}
					/>
				</Flex>
			</Flex>
		</Box>
	);
};

export default PriceInput;
