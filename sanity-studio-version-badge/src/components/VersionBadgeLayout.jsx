// Layout wrapper that renders the studio plus a fixed version badge on the structure root

import React, { useState, useEffect } from 'react';
import { Badge, Card, Flex, Stack, Text } from '@sanity/ui';

const COOKIE_NAME = 'liiift_pkg_versions';
const SHOW_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/** Read and parse the version cookie, or return null. */
const readCookie = () => {
	const match = document.cookie.split('; ').find(r => r.startsWith(COOKIE_NAME + '='));
	if (!match) return null;
	try {
		return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
	} catch {
		return null;
	}
};

/** Write the version cookie with a 1-year expiry. */
const writeCookie = (data) => {
	const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
	document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires}; path=/; SameSite=Strict`;
};

/**
 * Diffs current package versions against the stored cookie.
 * Writes an updated cookie if any version changed.
 * Returns which packages are newly updated and whether the badge should show.
 *
 * @param {{ name: string, version: string }[]} packages
 */
const compareVersions = (packages) => {
	const stored = readCookie();
	const storedVersions = stored?.versions ?? {};
	const updatedAt = stored?.updatedAt ?? 0;

	const updatedPackages = new Set();
	const currentVersions = {};

	for (const { name, version } of packages) {
		currentVersions[name] = version;
		if (storedVersions[name] !== version) updatedPackages.add(name);
	}

	if (updatedPackages.size > 0) {
		writeCookie({ versions: currentVersions, updatedAt: Date.now() });
	}

	return {
		updatedPackages,
		// Show if there are new versions now, or if the last update was within the past 7 days
		shouldShow: updatedPackages.size > 0 || (Date.now() - updatedAt) < SHOW_DURATION_MS,
	};
};

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
 * Only visible on the structure root and within 7 days of a package update.
 * Packages that changed since the last visit are labelled "new".
 *
 * @param {Object} props
 * @param {Function} props.renderDefault - Sanity-provided renderer for the default studio layout
 * @param {{ name: string, version: string }[]} props.packages - Array of imported package.json objects
 */
export const VersionBadgeLayout = ({ renderDefault, packages = [], ...props }) => {
	const [onStructureRoot, setOnStructureRoot] = useState(isStructureRoot);
	const [{ updatedPackages, shouldShow }] = useState(() => compareVersions(packages));

	useEffect(() => {
		const checkVisibility = () => setOnStructureRoot(isStructureRoot());

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
		checkVisibility();

		return () => {
			history.pushState = origPushState;
			history.replaceState = origReplaceState;
			window.removeEventListener('locationchange', checkVisibility);
			window.removeEventListener('popstate', checkVisibility);
		};
	}, []);

	const visible = onStructureRoot && shouldShow && packages.length > 0;

	return (
		<>
			{renderDefault(props)}
			{visible && (
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
						{packages.map(({ name, version }) => {
							const displayName = name.replace('@liiift-studio/', '');
							const isNew = updatedPackages.has(name);
							return (
								<Flex key={name} align="center" gap={2}>
									<Text size={1} muted style={{ fontFamily: 'monospace' }}>
										{displayName}
										<span style={{ opacity: 0.5 }}>@</span>
										{version}
									</Text>
									{isNew && <Badge tone="positive" size={0}>new</Badge>}
								</Flex>
							);
						})}
					</Stack>
				</Card>
			)}
		</>
	);
};
