// Numeric price input field for setting a per-style font price

import React from 'react';
import { Flex, Stack, Label, Text, TextInput } from '@sanity/ui';

/**
 * Renders a labelled numeric price field (dollar amount, per style).
 * @param {Object} props
 * @param {string} props.inputPrice - Current price value
 * @param {Function} props.handleInputChange - onChange handler
 */
const PriceInput = ({ inputPrice, handleInputChange }) => (
	<Stack space={1}>
		<Label style={{ lineHeight: 1.6 }}>per Style price</Label>
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
