// Label-wrapped button that triggers a hidden file input

import React, { forwardRef } from 'react';
import { Button, Text } from '@sanity/ui';

/**
 * Primary button with a transparent full-size file input overlay.
 * The ref is forwarded to the hidden <input> element.
 * @param {Object} props
 * @param {Function} props.handleUpload - onChange handler for the file input
 */
const UploadButton = forwardRef(({ handleUpload }, ref) => {
	return (
		<Button
			mode="ghost"
			tone="primary"
			width="fill"
			padding={3}
			style={{ position: 'relative' }}
		>
			<Text align="center">Upload (ttf/otf/woff/woff2/etc...)</Text>
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
		</Button>
	);
});

UploadButton.displayName = 'UploadButton';

export default UploadButton;
