// Reusable $ + number input for collection and pair price fields

import React from 'react';
import { Flex, Text } from '@sanity/ui';

/**
 * Renders an inline price field: "Price  $  [input]  per style"
 * @param {Object} props
 * @param {string} props.inputPrice - Current price value
 * @param {Function} props.handleInputChange - onChange handler
 */
const PriceInput = ({ inputPrice, handleInputChange }) => (
	<Flex align="center" gap={2}>
		<Text size={1} muted>Price:</Text>
		<Text size={1} muted>$</Text>
		<input
			value={inputPrice}
			onChange={handleInputChange}
			type="number"
			style={{ textAlign: 'end', padding: '5px', maxWidth: '75px' }}
		/>
		<Text size={1} muted>per style</Text>
	</Flex>
);

export default PriceInput;
