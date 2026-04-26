// Font-specific wrapper around KeyValueReferenceInput — maps variable font instances to static font documents with autofill

import React, { useState, useCallback } from 'react';
import { Button, Flex, Dialog, Box, Stack, Text } from '@sanity/ui';
import { SyncIcon, DocumentTextIcon } from '@sanity/icons';
import { set, useFormValue } from 'sanity';
import { KeyValueReferenceInput } from './KeyValueReferenceInput.jsx';
import { useSanityClient } from '../hooks/useSanityClient.js';
import { parseVariableFontInstances } from '../utils/parseVariableFontInstances.js';
import { nanoid } from 'nanoid';

/**
 * Wraps KeyValueReferenceInput with font-specific autofill for variable font instance mapping.
 * Autofill with Matching calls parseVariableFontInstances to resolve instance names to static fonts.
 * Autofill Keys Only populates keys from variableInstances JSON without reference matching.
 * @param {Array} value - Current array of { _key, key, value } pairs
 * @param {Function} onChange - Sanity onChange callback
 * @param {Object} props - Remaining props forwarded to KeyValueReferenceInput
 */
export function VariableInstanceReferencesInput(props) {
	const { value = [], onChange } = props;

	const [isAutofilling, setIsAutofilling] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [pendingAction, setPendingAction] = useState(null);

	const formDocument = useFormValue([]);
	const sanityClient = useSanityClient();

	/** Fetches static (non-variable) fonts scoped to the same typeface for the reference picker */
	const fetchReferences = useCallback(async (client, doc) => {
		const typefaceName = doc?.typefaceName;
		if (!typefaceName) {
			return client.fetch(`*[_type == 'font' && variableFont != true]{_id, title}`, {});
		}
		return client.fetch(
			`*[_type == 'font' && typefaceName == $typefaceName && variableFont != true]{_id, title}`,
			{ typefaceName }
		);
	}, []);

	/** Runs parseVariableFontInstances to match instance names to static font documents */
	const performAutofillWithMatching = useCallback(async (mode) => {
		setIsAutofilling(true);
		try {
			if (!formDocument?.variableInstances) {
				console.warn('Cannot autofill: no variableInstances data on this document');
				return;
			}
			const mappings = await parseVariableFontInstances(formDocument, sanityClient);
			if (mappings.length === 0) {
				console.warn('No variable instances could be parsed from this font');
				return;
			}
			const updatedPairs = mode === 'replace'
				? mappings
				: [...value, ...mappings.filter(m => !value.some(p => p.key === m.key))];
			onChange(set(updatedPairs));
		} catch (err) {
			console.error('Error during autofill with matching:', err);
		} finally {
			setIsAutofilling(false);
		}
	}, [formDocument, sanityClient, value, onChange]);

	/** Populates key names from variableInstances JSON without reference matching */
	const performAutofillKeysOnly = useCallback(async (mode) => {
		setIsAutofilling(true);
		try {
			if (!formDocument?.variableInstances) {
				console.warn('Cannot autofill: no variableInstances data on this document');
				return;
			}
			let instances;
			try {
				instances = JSON.parse(formDocument.variableInstances);
			} catch {
				console.error('Invalid variableInstances JSON on this document');
				return;
			}
			const keys = Object.keys(instances);
			if (keys.length === 0) {
				console.warn('No variable instances found in JSON');
				return;
			}
			const keyOnlyPairs = keys.map(key => ({ key, value: null, _key: nanoid() }));
			const updatedPairs = mode === 'replace'
				? keyOnlyPairs
				: [...value, ...keyOnlyPairs.filter(p => !value.some(existing => existing.key === p.key))];
			onChange(set(updatedPairs));
		} catch (err) {
			console.error('Error during keys-only autofill:', err);
		} finally {
			setIsAutofilling(false);
		}
	}, [formDocument, value, onChange]);

	/** Triggers autofill with matching — prompts confirmation if pairs already exist */
	const handleAutofillWithMatching = useCallback(() => {
		if (value.length > 0) {
			setPendingAction('matching');
			setShowConfirmDialog(true);
			return;
		}
		performAutofillWithMatching('replace');
	}, [value, performAutofillWithMatching]);

	/** Triggers keys-only autofill — prompts confirmation if pairs already exist */
	const handleAutofillKeysOnly = useCallback(() => {
		if (value.length > 0) {
			setPendingAction('keysOnly');
			setShowConfirmDialog(true);
			return;
		}
		performAutofillKeysOnly('replace');
	}, [value, performAutofillKeysOnly]);

	/** Handles the replace/merge choice from the confirmation dialog */
	const handleConfirmChoice = useCallback(async (choice) => {
		setShowConfirmDialog(false);
		if (pendingAction === 'matching') await performAutofillWithMatching(choice);
		else if (pendingAction === 'keysOnly') await performAutofillKeysOnly(choice);
		setPendingAction(null);
	}, [pendingAction, performAutofillWithMatching, performAutofillKeysOnly]);

	/** Cancels the confirmation dialog */
	const handleConfirmCancel = useCallback(() => {
		setShowConfirmDialog(false);
		setPendingAction(null);
	}, []);

	// Only show autofill buttons when the document is a variable font with parsed instance data
	const showAutofill = !!(formDocument?.variableFont && formDocument?.variableInstances);

	const topActions = showAutofill ? (
		<Flex gap={2}>
			<Button
				tone="primary"
				mode="ghost"
				onClick={handleAutofillWithMatching}
				icon={SyncIcon}
				text="Autofill with Matching"
				disabled={isAutofilling}
				loading={isAutofilling}
			/>
			<Button
				tone="default"
				mode="ghost"
				onClick={handleAutofillKeysOnly}
				icon={DocumentTextIcon}
				text="Autofill Keys Only"
				disabled={isAutofilling}
				loading={isAutofilling}
			/>
		</Flex>
	) : null;

	return (
		<>
			<KeyValueReferenceInput
				{...props}
				referenceType="font"
				fetchReferences={fetchReferences}
				topActions={topActions}
			/>

			{showConfirmDialog && (
				<Dialog
					header="Existing entries found"
					id="autofill-confirm-dialog"
					onClose={handleConfirmCancel}
					width={1}
				>
					<Box padding={4}>
						<Stack space={4}>
							<Text>
								You already have {value.length} {value.length === 1 ? 'entry' : 'entries'}. How would you like to proceed?
							</Text>
							<Flex gap={2} justify="flex-end">
								<Button text="Cancel" mode="ghost" onClick={handleConfirmCancel} />
								<Button text="Merge (Add New)" tone="primary" mode="ghost" onClick={() => handleConfirmChoice('merge')} />
								<Button text="Replace All" tone="critical" onClick={() => handleConfirmChoice('replace')} />
							</Flex>
						</Stack>
					</Box>
				</Dialog>
			)}
		</>
	);
}
