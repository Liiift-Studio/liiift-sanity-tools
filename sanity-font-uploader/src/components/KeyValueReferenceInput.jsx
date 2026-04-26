// Generic key-value pair editor where values are weak Sanity document references — add, remove, reorder, and searchable picker

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Stack, TextInput, Box, Card, Flex, Text, Dialog, Menu, MenuButton, MenuItem, Autocomplete } from '@sanity/ui';
import { AddIcon, ArrowDownIcon, ArrowUpIcon, TrashIcon, SyncIcon, EllipsisHorizontalIcon } from '@sanity/icons';
import { set, useFormValue } from 'sanity';
import { useSanityClient } from '../hooks/useSanityClient.js';
import { nanoid } from 'nanoid';

/**
 * Generic key-value pair editor where values are weak references to Sanity documents.
 * Handles add/remove/reorder, a searchable reference picker dialog, and cached title display.
 * @param {Array} value - Current array of { _key, key, value } pairs
 * @param {Function} onChange - Sanity onChange callback
 * @param {string} referenceType - Display label for the referenced document type (e.g. 'font')
 * @param {Function} fetchReferences - async (client, doc) => [{ _id, title }] — populates the picker
 * @param {ReactNode} topActions - Optional slot rendered above the pairs list (e.g. autofill buttons)
 * @param {Object} schemaType - Sanity schemaType passed automatically by the Studio
 */
export function KeyValueReferenceInput(props) {
	const { value = [], onChange, schemaType, referenceType, fetchReferences, topActions } = props;

	const [pairs, setPairs] = useState(value);
	const [referenceData, setReferenceData] = useState({});
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingIndex, setEditingIndex] = useState(null);
	const [availableReferences, setAvailableReferences] = useState([]);

	const sanityClient = useSanityClient();
	const formDocument = useFormValue([]);

	/** Fetches and caches display titles for all referenced documents whenever pairs change */
	useEffect(() => {
		const refIds = pairs.filter(p => p.value?._ref).map(p => p.value._ref);
		if (refIds.length === 0) return;

		if (!sanityClient) {
			const fallback = {};
			refIds.forEach(id => { fallback[id] = `Reference (${id.substring(0, 6)}...)`; });
			setReferenceData(fallback);
			return;
		}

		sanityClient.fetch(`*[_id in $ids]{_id, title}`, { ids: refIds })
			.then(result => {
				const map = {};
				result.forEach(item => { map[item._id] = item.title; });
				setReferenceData(map);
			})
			.catch(err => {
				console.error('Error fetching reference data:', err);
				const fallback = {};
				refIds.forEach(id => { fallback[id] = `Reference (${id.substring(0, 6)}...)`; });
				setReferenceData(fallback);
			});
	}, [pairs, sanityClient]);

	/** Updates a field on a pair at the given index and syncs to Sanity */
	const handlePairChange = useCallback((index, field, fieldValue) => {
		const updatedPairs = pairs.map((pair, idx) => idx === index ? { ...pair, [field]: fieldValue } : pair);
		setPairs(updatedPairs);
		onChange(set(updatedPairs));
	}, [pairs, onChange]);

	/** Appends a new empty pair */
	const handleAddPair = useCallback(() => {
		const updatedPairs = [...pairs, { key: '', value: null, _key: nanoid() }];
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

	/** Opens the reference picker, calling fetchReferences to populate the list */
	const openReferenceSelector = useCallback(async (index) => {
		setEditingIndex(index);
		if (!sanityClient) {
			console.error('KeyValueReferenceInput: Sanity client not available');
			return;
		}
		try {
			let refs;
			if (fetchReferences) {
				refs = await fetchReferences(sanityClient, formDocument);
			} else if (referenceType) {
				refs = await sanityClient.fetch(`*[_type == $type]{_id, title}`, { type: referenceType });
			} else {
				console.warn('KeyValueReferenceInput: provide a fetchReferences prop or referenceType');
				refs = [];
			}
			setAvailableReferences(refs);
			setIsDialogOpen(true);
		} catch (err) {
			console.error('Error fetching available references:', err);
		}
	}, [sanityClient, fetchReferences, referenceType, formDocument]);

	/** Closes the picker dialog and clears editing state */
	const closeDialog = useCallback(() => {
		setIsDialogOpen(false);
		setEditingIndex(null);
	}, []);

	/** Writes the selected item as a weak reference and closes the dialog */
	const handleReferenceSelect = useCallback((reference) => {
		if (editingIndex === null) return;
		handlePairChange(editingIndex, 'value', { _type: 'reference', _ref: reference._id, _weak: true });
		closeDialog();
	}, [editingIndex, handlePairChange, closeDialog]);

	const referenceOptions = availableReferences.map(ref => ({ value: ref._id, title: ref.title }));

	// Infer labels from schemaType if available
	const keyField = schemaType?.options?.of?.[0]?.fields?.find(f => f.name === 'key');
	const valueField = schemaType?.options?.of?.[0]?.fields?.find(f => f.name === 'value');
	const keyTitle = keyField?.title || 'Key';
	const valueTitle = valueField?.title || 'Value';
	const keyPlaceholder = keyField?.placeholder || 'Enter key';
	const pickerLabel = referenceType || valueTitle.toLowerCase();

	return (
		<Stack space={3}>
			{topActions && <Box paddingBottom={2}>{topActions}</Box>}

			<Box>
				<Stack space={2}>
					{pairs.map((pair, index) => (
						<Box key={index} style={{ position: 'relative' }}>
							{/* Reorder buttons */}
							<div style={{ position: 'absolute', height: '100%', top: '0', left: '-5px', width: 'min-content', transform: 'translate(-100%, 0%)' }}>
								<button className="manualButton manualButtonUp" style={{ fontSize: '15px', height: '50%' }} onClick={() => handleMoveUp(index)}>
									<ArrowUpIcon />
								</button>
								<button className="manualButton manualButtonDown" style={{ fontSize: '15px', height: '50%' }} onClick={() => handleMoveDown(index)}>
									<ArrowDownIcon />
								</button>
							</div>

							<Flex gap={2} align="flex-start">
								{/* Key input */}
								<Box flex={1}>
									<TextInput
										value={pair.key}
										onChange={(e) => handlePairChange(index, 'key', e.target.value)}
										placeholder={keyPlaceholder}
									/>
								</Box>

								{/* Reference display or empty-state picker trigger */}
								<Box flex={1} style={{ minHeight: '100%' }}>
									{pair.value?._ref ? (
										<Card className="referenceCard" radius={2} tone="primary" style={{ paddingLeft: '1rem', height: 'fit-content' }}>
											<Flex align="center" justify="space-between">
												<Text
													size={2}
													style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%' }}
												>
													{referenceData[pair.value._ref] || 'Loading...'}
												</Text>
												<MenuButton
													button={<Button icon={EllipsisHorizontalIcon} mode="bleed" title="Options" />}
													id={`ref-options-${index}`}
													menu={
														<Menu>
															<MenuItem tone="critical" icon={TrashIcon} text="Remove" onClick={() => handlePairChange(index, 'value', null)} />
															<MenuItem icon={SyncIcon} text="Replace" onClick={() => openReferenceSelector(index)} />
														</Menu>
													}
													popover={{ portal: true, tone: 'default', placement: 'left' }}
												/>
											</Flex>
										</Card>
									) : (
										<Box
											padding={2}
											style={{ minHeight: '100%', border: '1px dashed #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
											onClick={() => openReferenceSelector(index)}
										>
											<Text muted size={2}>Click to select a {pickerLabel}</Text>
										</Box>
									)}
								</Box>
							</Flex>

							{/* Remove button */}
							<button
								className="manualButton"
								onClick={() => handleRemovePair(index)}
								style={{ position: 'absolute', top: '0', right: '-7px', transform: 'translate(100%, 0%)' }}
							>
								<TrashIcon />
							</button>
						</Box>
					))}
				</Stack>
			</Box>

			<Button tone="primary" mode="ghost" onClick={handleAddPair} icon={AddIcon} text={`Add ${keyTitle}`} />

			{/* Reference picker dialog */}
			{isDialogOpen && (
				<Dialog
					header={`Select a ${pickerLabel}`}
					id="reference-selector-dialog"
					onClose={closeDialog}
					width={1}
				>
					<Box padding={4}>
						<Autocomplete
							id="reference-autocomplete"
							options={referenceOptions}
							placeholder={`Search ${pickerLabel}s...`}
							renderOption={(option) => (
								<Card key={option.value} padding={3} radius={2} tone="default" style={{ cursor: 'pointer' }}>
									<Text size={2}>{option.title}</Text>
								</Card>
							)}
							renderValue={(val) => referenceOptions.find(o => o.value === val)?.title || ''}
							onChange={(newValue) => {
								const selected = availableReferences.find(r => r._id === newValue);
								if (selected) handleReferenceSelect(selected);
							}}
							openButton
							fontSize={2}
						/>
					</Box>
				</Dialog>
			)}
		</Stack>
	);
}
