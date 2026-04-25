// Numeric price input field for setting a font style price

import React from 'react';
import { Flex, Label, Stack, Text, TextInput } from '@sanity/ui';

/**
 * Renders a labelled numeric price field (dollar amount).
 * @param {Object} props
 * @param {string} props.inputPrice - Current price value
 * @param {Function} props.handleInputChange - onChange handler
 */
const PriceInput = ({ inputPrice, handleInputChange }) => (
	<Stack space={1}>
		<Label>Style price</Label>
		<Flex align="center" gap={2}>
			<Text size={1} muted>$</Text>
			<TextInput
				value={inputPrice}
				onChange={handleInputChange}
				type="number"
				style={{ maxWidth: '80px', textAlign: 'right' }}
			/>
		</Flex>
	</Stack>
);

export default PriceInput;
