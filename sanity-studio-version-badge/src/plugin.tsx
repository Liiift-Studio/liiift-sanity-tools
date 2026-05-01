// Sanity plugin definition — injects the version badge layout component

import React from 'react'
import {definePlugin} from 'sanity'
import {VersionBadgeLayout} from './components/VersionBadgeLayout'
import type {PackageInfo} from './components/VersionBadgeLayout'

/** Options for the liiiftVersionBadge plugin */
interface LiiiftVersionBadgeOptions {
	/** Array of imported package.json objects with name and version */
	packages?: PackageInfo[]
}

/**
 * Plugin that renders a fixed bottom-right badge listing installed @liiift-studio packages.
 * The badge is only visible on the structure root (no document open).
 */
export const liiiftVersionBadge = (options: LiiiftVersionBadgeOptions = {}) =>
	definePlugin({
		name: '@liiift-studio/sanity-studio-version-badge',
		studio: {
			components: {
				layout: (props) =>
					React.createElement(VersionBadgeLayout, {
						...props,
						packages: options.packages ?? [],
					}),
			},
		},
	})()
