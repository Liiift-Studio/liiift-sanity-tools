// Drop-zone style upload button with hidden file input overlay
import React, { forwardRef } from 'react';
import { Card, Flex, Stack, Text } from '@sanity/ui';
import { UploadIcon } from '@sanity/icons';

/**
 * Drop-zone style card with a transparent full-size file input overlay.
 * The ref is forwarded to the hidden <input> element.
 * @param {Object} props
 * @param {Function} props.handleUpload - onChange handler for the file input
 */
const UploadButton = forwardRef(({ handleUpload }, ref) => {
	return (
		<Card
			radius={2}
			padding={5}
			style={{
				position: 'relative',
				border: '1px dashed var(--card-border-color)',
				cursor: 'pointer',
				textAlign: 'center',
			}}
		>
			<Flex direction="column" align="center" justify="center" gap={3} style={{ pointerEvents: 'none' }}>
				<Text muted><UploadIcon style={{ fontSize: '1.5rem' }} /></Text>
				<Stack space={1}>
					<Text align="center" weight="semibold">Upload font files</Text>
					<Text size={1} muted align="center">TTF, OTF, WOFF, WOFF2 — replaces existing fonts</Text>
				</Stack>
			</Flex>
			<input
				ref={ref}
				type="file"
				multiple
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					opacity: 0,
					cursor: 'pointer',
				}}
				onChange={handleUpload}
			/>
		</Card>
	);
});

UploadButton.displayName = 'UploadButton';

export default UploadButton;
