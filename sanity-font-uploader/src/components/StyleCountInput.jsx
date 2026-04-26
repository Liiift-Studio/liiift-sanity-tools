// Displays the total count of static and variable font styles linked to a typeface document

import React from 'react';
import { Text } from '@sanity/ui';
import { useFormValue } from 'sanity';

/** Reads styles.fonts and styles.variableFont arrays and displays the combined count. */
export const StyleCountInput = (props) => {
	const styles = useFormValue(['styles', 'fonts']) || [];
	const vfStyles = useFormValue(['styles', 'variableFont']) || [];
	const count = styles.length + vfStyles.length;

	return (
		<Text size={1}>{count}</Text>
	);
};
