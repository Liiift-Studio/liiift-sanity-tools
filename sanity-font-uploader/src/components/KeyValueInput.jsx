// Ordered key-value string pair editor for Sanity Studio — add, remove, and reorder rows

import React, { useState, useCallback } from 'react';
import { Button, Grid, Stack, TextInput } from '@sanity/ui';
import { AddIcon, ArrowDownIcon, ArrowUpIcon, TrashIcon } from '@sanity/icons';
import { set } from 'sanity';

/**
 * Ordered key-value string pair editor with add, remove, and reorder controls.
 * Writes an array of { _key, key, value } objects to Sanity.
 * @param {Array} value - Current array of { _key, key, value } pairs
 * @param {Function} onChange - Sanity onChange callback
 */
export function KeyValueInput({ value = [], onChange }) {
	const [pairs, setPairs] = useState(value);

	/** Updates a specific field for a pair at the given index */
	const handlePairChange = useCallback((index, field, fieldValue) => {
		const updatedPairs = pairs.map((pair, idx) => idx === index ? { ...pair, [field]: fieldValue } : pair);
		setPairs(updatedPairs);
		onChange(set(updatedPairs));
	}, [pairs, onChange]);

	/** Appends a new empty pair */
	const handleAddPair = useCallback(() => {
		const newPair = { key: '', value: '', _key: Math.random().toString(36).substr(2, 9) };
		const updatedPairs = [...pairs, newPair];
		setPairs(updatedPairs);
		onChange(set(updatedPairs));
	}, [pairs, onChange]);

	/** Removes the pair at the given index */
	const handleRemovePair = useCallback((index) => {
		const updatedPairs = pairs.filter((_, idx) => idx !== index);
		setPairs(updatedPairs);
		onChange(set(updatedPairs));
	}, [pairs, onChange]);

	/** Swaps a pair with the one above it */
	const handleMoveUp = useCallback((index) => {
		if (index === 0) return;
		const updatedPairs = [...pairs];
		[updatedPairs[index], updatedPairs[index - 1]] = [updatedPairs[index - 1], updatedPairs[index]];
		setPairs(updatedPairs);
		onChange(set(updatedPairs));
	}, [pairs, onChange]);

	/** Swaps a pair with the one below it */
	const handleMoveDown = useCallback((index) => {
		if (index === pairs.length - 1) return;
		const updatedPairs = [...pairs];
		[updatedPairs[index], updatedPairs[index + 1]] = [updatedPairs[index + 1], updatedPairs[index]];
		setPairs(updatedPairs);
		onChange(set(updatedPairs));
	}, [pairs, onChange]);

	return (
		<Stack space={3}>
			{pairs.map((pair, index) => (
				<Grid className="manualButtonWrap" columns={[2]} key={index} gap={0} style={{ position: 'relative' }}>
					<div style={{ position: 'absolute', height: '100%', top: '0', left: '-10px', width: 'min-content', transform: 'translate(-100%, 0%)' }}>
						<button className="manualButton manualButtonUp" style={{ fontSize: '15px', height: '50%' }} onClick={() => handleMoveUp(index)}>
							<ArrowUpIcon />
						</button>
						<button className="manualButton manualButtonDown" style={{ fontSize: '15px', height: '50%' }} onClick={() => handleMoveDown(index)}>
							<ArrowDownIcon />
						</button>
					</div>

					<TextInput
						value={pair.key}
						onChange={(e) => handlePairChange(index, 'key', e.target.value)}
						placeholder="Key"
					/>
					<div style={{ marginLeft: '-1px' }}>
						<TextInput
							value={pair.value}
							onChange={(e) => handlePairChange(index, 'value', e.target.value)}
							placeholder="Value"
						/>
					</div>

					<button
						className="manualButton"
						onClick={() => handleRemovePair(index)}
						style={{ position: 'absolute', top: '0', right: '-10px', transform: 'translate(100%, 0%)' }}
					>
						<TrashIcon />
					</button>
				</Grid>
			))}
			<Button tone="primary" onClick={handleAddPair} icon={AddIcon} text="Add Row" />
		</Stack>
	);
}
