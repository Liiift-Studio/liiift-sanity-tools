// Layout wrapper that renders the studio plus a fixed version badge on the structure root

import React, { useState, useEffect } from 'react';
import { Card, Stack, Text } from '@sanity/ui';

/**
 * Returns true when the current URL is on the structure root with no document open.
 * Sanity uses a semicolon separator in the path when a pane/document is open.
 */
const isStructureRoot = () => {
	const { pathname } = window.location;
	return pathname.includes('/structure') && !pathname.includes(';');
};

/**
 * Studio layout component that injects a fixed bottom-right version badge.
 * Visible only on the structure root; disappears once a document or pane is opened.
 *
 * @param {Object} props
 * @param {Function} props.renderDefault - Sanity-provided renderer for the default studio layout
 * @param {[string, string][]} props.packages - Array of [packageName, version] tuples to display
 */
export const VersionBadgeLayout = ({ renderDefault, packages = [], ...props }) => {
	const [visible, setVisible] = useState(isStructureRoot);

	useEffect(() => {
		/** Updates badge visibility based on current URL. */
		const checkVisibility = () => setVisible(isStructureRoot());

		// Patch both pushState and replaceState — Sanity uses replaceState for its initial
		// navigation to /structure, so patching only pushState misses the first route change.
		const origPushState = history.pushState.bind(history);
		const origReplaceState = history.replaceState.bind(history);

		history.pushState = function (...args) {
			origPushState(...args);
			window.dispatchEvent(new Event('locationchange'));
		};
		history.replaceState = function (...args) {
			origReplaceState(...args);
			window.dispatchEvent(new Event('locationchange'));
		};

		window.addEventListener('locationchange', checkVisibility);
		window.addEventListener('popstate', checkVisibility);

		// Run once immediately in case the URL was already updated before this effect ran
		checkVisibility();

		return () => {
			history.pushState = origPushState;
			history.replaceState = origReplaceState;
			window.removeEventListener('locationchange', checkVisibility);
			window.removeEventListener('popstate', checkVisibility);
		};
	}, []);

	return (
		<>
			{renderDefault(props)}
			{visible && packages.length > 0 && (
				<Card
					shadow={1}
					radius={2}
					padding={3}
					style={{
						position: 'fixed',
						bottom: 16,
						right: 16,
						zIndex: 9999,
						pointerEvents: 'none',
						minWidth: 180,
					}}
				>
					<Stack space={2}>
						{packages.map(([name, version]) => {
							const displayName = name.replace('@liiift-studio/', '');
							const displayVersion = version.replace(/^[\^~]/, '');
							return (
								<Text key={name} size={1} muted style={{ fontFamily: 'monospace' }}>
									{displayName}
									<span style={{ opacity: 0.5 }}>@</span>
									{displayVersion}
								</Text>
							);
						})}
					</Stack>
				</Card>
			)}
		</>
	);
};
