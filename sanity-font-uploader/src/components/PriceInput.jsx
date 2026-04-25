// Inline price input: label + $ + number input on one row

import React from 'react';
import { Flex, Text, TextInput } from '@sanity/ui';

/**
 * Renders an inline per-style price field: "per Style price  $  [input]"
 * @param {Object} props
 * @param {string} props.inputPrice - Current price value
 * @param {Function} props.handleInputChange - onChange handler
 */
const PriceInput = ({ inputPrice, handleInputChange }) => (
	<Flex align="center" gap={2}>
		<Text size={1} muted style={{ whiteSpace: 'nowrap' }}>per Style price</Text>
		<Text size={1} muted>$</Text>
		<TextInput
			value={inputPrice}
			onChange={handleInputChange}
			type="number"
			style={{ maxWidth: '80px', textAlign: 'right' }}
		/>
	</Flex>
);

export default PriceInput;
