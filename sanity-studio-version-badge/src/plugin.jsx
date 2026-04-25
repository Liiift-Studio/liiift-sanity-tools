// Sanity plugin definition — injects the version badge layout component

import React from 'react';
import { definePlugin } from 'sanity';
import { VersionBadgeLayout } from './components/VersionBadgeLayout.jsx';

/**
 * Plugin that renders a fixed bottom-right badge listing installed @liiift-studio packages.
 * The badge is only visible on the structure root (no document open).
 *
 * @param {Object} options
 * @param {[string, string][]} options.packages - Array of [packageName, version] tuples to display.
 */
export const liiiftVersionBadge = (options = {}) => definePlugin({
	name: '@liiift-studio/sanity-studio-version-badge',
	studio: {
		components: {
			layout: (props) => React.createElement(VersionBadgeLayout, { ...props, packages: options.packages ?? [] }),
		},
	},
})();
