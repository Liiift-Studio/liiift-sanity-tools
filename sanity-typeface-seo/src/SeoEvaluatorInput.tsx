/** Custom Sanity input for SEO fields — quality checklist, published diff, and optional live site scan */
import React, { useState, useEffect, useCallback } from 'react'
import { Box, Button, Card, Flex, Spinner, Stack, Text } from '@sanity/ui'
import { useClient, useFormValue, type ObjectInputProps } from 'sanity'
import type { SeoValue, SeoScanResult, SeoEvaluatorOptions } from './types'

// ─── Status helpers ───────────────────────────────────────────────────────────

type CheckStatus = 'good' | 'warn' | 'empty'

/** Returns good/warn/empty based on whether the string hits the optimal char range */
function charScore(value: string | undefined, min: number, max: number): CheckStatus {
	if (!value || value.length === 0) return 'empty'
	return value.length >= min && value.length <= max ? 'good' : 'warn'
}

const DOT_COLOR: Record<CheckStatus, string> = {
	good: '#43d675',
	warn: '#f59e0b',
	empty: '#ef4444',
}

const DOT_LABEL: Record<CheckStatus, string> = { good: '✓', warn: '!', empty: '–' }

// ─── Shared primitives ────────────────────────────────────────────────────────

/** Coloured status dot with label and detail text */
function CheckRow({ label, status, detail }: { label: string; status: CheckStatus; detail: string }) {
	return (
		<Flex align="center" gap={3}>
			<Box
				style={{
					width: 20,
					height: 20,
					borderRadius: '50%',
					background: DOT_COLOR[status],
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0,
				}}
			>
				<Text size={0} style={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>
					{DOT_LABEL[status]}
				</Text>
			</Box>
			<Stack space={1} style={{ flex: 1 }}>
				<Text size={1} weight="semibold">{label}</Text>
				<Text size={1} muted>{detail}</Text>
			</Stack>
		</Flex>
	)
}

/** Compact two-value comparison row — shows "No changes" inline if values match */
function DiffRow({ label, live, draft }: { label: string; live: string | null; draft: string | null }) {
	const changed = live !== draft
	if (!changed) {
		return (
			<Flex align="center" gap={3} style={{ borderLeft: '3px solid #43d675', paddingLeft: 12 }}>
				<Text size={1} weight="semibold" style={{ minWidth: 80 }}>{label}</Text>
				<Text size={1} muted>No changes</Text>
			</Flex>
		)
	}
	return (
		<Box style={{ borderLeft: '3px solid #f59e0b', paddingLeft: 12 }}>
			<Stack space={1}>
				<Text size={1} weight="semibold">{label}</Text>
				<Text size={1} muted>
					Live: {live ? `"${live.length > 60 ? live.slice(0, 60) + '…' : live}"` : '(empty)'}
				</Text>
				<Text size={1} muted>
					Draft: {draft ? `"${draft.length > 60 ? draft.slice(0, 60) + '…' : draft}"` : '(empty)'} ↑
				</Text>
			</Stack>
		</Box>
	)
}

// ─── Section 1: SEO quality checklist ────────────────────────────────────────

/** Live quality indicators for title length, description length, keywords, and image */
function SeoChecklist({ value }: { value: SeoValue }) {
	const titleLen = value.title?.length ?? 0
	const descLen = value.description?.length ?? 0
	const titleStatus = charScore(value.title, 50, 60)
	const descStatus = charScore(value.description, 150, 160)
	const keywordsStatus: CheckStatus = value.keywords ? 'good' : 'empty'
	const imageStatus: CheckStatus = value.image ? 'good' : 'empty'
	const score = [titleStatus, descStatus, keywordsStatus, imageStatus].filter(s => s === 'good').length
	const scoreTone = score === 4 ? 'positive' : score >= 2 ? 'caution' : 'critical'

	return (
		<Card padding={4} radius={2} tone={scoreTone} border>
			<Stack space={3}>
				<Flex align="center" justify="space-between">
					<Text size={1} weight="semibold">SEO Checklist</Text>
					<Text size={1} muted>{score}/4</Text>
				</Flex>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
					<CheckRow
						label="Title"
						status={titleStatus}
						detail={titleLen === 0 ? 'Empty — add a title (50–60 chars optimal)' : titleStatus === 'good' ? `${titleLen} chars — good` : `${titleLen} chars — aim for 50–60`}
					/>
					<CheckRow
						label="Description"
						status={descStatus}
						detail={descLen === 0 ? 'Empty — add a description (150–160 chars optimal)' : descStatus === 'good' ? `${descLen} chars — good` : `${descLen} chars — aim for 150–160`}
					/>
					<CheckRow
						label="Keywords"
						status={keywordsStatus}
						detail={keywordsStatus === 'good' ? 'Keywords present' : 'No keywords set'}
					/>
					<CheckRow
						label="Social image"
						status={imageStatus}
						detail={imageStatus === 'good' ? 'Image set' : 'No image — defaults to site image'}
					/>
				</div>
			</Stack>
		</Card>
	)
}

// ─── Section 2: published vs draft diff ──────────────────────────────────────

/** Compares the draft SEO values against the published Sanity document */
function PublishedDiff({ draft, published, loading }: { draft: SeoValue; published: SeoValue | null; loading: boolean }) {
	if (loading) {
		return (
			<Card padding={4} radius={2} tone="default" border>
				<Flex align="center" gap={3}>
					<Spinner muted />
					<Text size={1} muted>Comparing with published version…</Text>
				</Flex>
			</Card>
		)
	}

	if (!published) {
		return (
			<Card padding={4} radius={2} tone="default" border>
				<Text size={1} muted>Never published — no comparison available.</Text>
			</Card>
		)
	}

	const fields = [
		{ label: 'Title', live: published.title ?? null, draft: draft.title ?? null },
		{ label: 'Description', live: published.description ?? null, draft: draft.description ?? null },
		{ label: 'Keywords', live: published.keywords ?? null, draft: draft.keywords ?? null },
		{ label: 'Image', live: published.image ? 'Set' : null, draft: draft.image ? 'Set' : null },
	]

	const changedCount = fields.filter(f => f.live !== f.draft).length

	return (
		<Card padding={4} radius={2} tone={changedCount > 0 ? 'caution' : 'positive'} border>
			<Stack space={4}>
				<Flex align="center" justify="space-between">
					<Text size={1} weight="semibold">Published vs Draft</Text>
					<Text size={1} muted>
						{changedCount === 0 ? 'No changes' : `${changedCount} field${changedCount > 1 ? 's' : ''} will change`}
					</Text>
				</Flex>
				{changedCount > 0 && fields.map(f => (
					<DiffRow key={f.label} label={f.label} live={f.live} draft={f.draft} />
				))}
			</Stack>
		</Card>
	)
}

// ─── Section 3: live URL scan ─────────────────────────────────────────────────

/** Live site scan panel — fetches rendered meta tags and diffs against the current draft */
function LiveScanPanel({
	slug,
	scanning,
	result,
	error,
	draft,
	onScan,
}: {
	slug: string | undefined
	scanning: boolean
	result: SeoScanResult | null
	error: string | null
	draft: SeoValue
	onScan: () => void
}) {
	const canScan = Boolean(slug) && !scanning

	return (
		<Card padding={4} radius={2} tone="default" border>
			<Stack space={4}>
				<Flex align="center" justify="space-between">
					<Stack space={1}>
						<Text size={1} weight="semibold">Live site scan</Text>
						<Text size={1} muted>
							{slug ? `/${slug}` : 'No slug — save the document first'}
						</Text>
					</Stack>
					<Button
						text={scanning ? 'Scanning…' : result ? 'Rescan' : 'Scan now'}
						tone="default"
						mode="ghost"
						disabled={!canScan}
						onClick={onScan}
					/>
				</Flex>

				{scanning && (
					<Flex align="center" gap={3}>
						<Spinner muted />
						<Text size={1} muted>Fetching live page…</Text>
					</Flex>
				)}

				{error && !scanning && (
					<Card padding={3} radius={2} tone="critical">
						<Text size={1}>Scan failed: {error}</Text>
					</Card>
				)}

				{result && !scanning && (
					<Stack space={3}>
						<DiffRow label="Title" live={result.title} draft={draft.title ?? null} />
						<DiffRow label="OG Title" live={result.ogTitle} draft={draft.title ?? null} />
						<DiffRow label="Description" live={result.description} draft={draft.description ?? null} />
						<DiffRow label="OG Description" live={result.ogDescription} draft={draft.description ?? null} />
						<DiffRow label="Keywords" live={result.keywords} draft={draft.keywords ?? null} />
						<DiffRow
							label="OG Image"
							live={result.ogImage ? 'Set' : null}
							draft={draft.image ? 'Set' : null}
						/>
					</Stack>
				)}
			</Stack>
		</Card>
	)
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/** Creates a Sanity object input component with SEO quality checklist, published diff, and optional live scan */
export function createSeoEvaluatorInput(options: SeoEvaluatorOptions = {}) {
	const {
		siteUrl: rawSiteUrl,
		urlFromSlug = (s: string) => `/typefaces/${s}`,
		slugPath = ['slug', 'current'],
	} = options
	const siteUrl = rawSiteUrl?.replace(/\/$/, '')

	function SeoEvaluatorInput(props: ObjectInputProps) {
		const value = (props.value ?? {}) as SeoValue
		const client = useClient({ apiVersion: '2024-01-01' })
		const rawId = useFormValue(['_id']) as string | undefined
		const slug = useFormValue(slugPath) as string | undefined

		const publishedId = rawId?.replace(/^drafts\./, '')

		// Section 2 state: published Sanity document SEO values
		const [publishedSeo, setPublishedSeo] = useState<SeoValue | null>(null)
		const [publishedLoading, setPublishedLoading] = useState(true)

		useEffect(() => {
			if (!publishedId) {
				setPublishedLoading(false)
				return
			}
			setPublishedLoading(true)
			client
				.fetch<SeoValue | null>('*[_id == $id][0].social', { id: publishedId })
				.then(data => setPublishedSeo(data ?? null))
				.catch(() => setPublishedSeo(null))
				.finally(() => setPublishedLoading(false))
		}, [publishedId, client])

		// Section 3 state: live site scan
		const [scanResult, setScanResult] = useState<SeoScanResult | null>(null)
		const [scanning, setScanning] = useState(false)
		const [scanError, setScanError] = useState<string | null>(null)

		const runScan = useCallback(async () => {
			if (!siteUrl || !slug) return
			setScanError(null)
			setScanning(true)
			try {
				const path = urlFromSlug(slug)
				const res = await fetch(`${siteUrl}/api/seo-scan?path=${encodeURIComponent(path)}`)
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				setScanResult(await res.json())
			} catch (err) {
				setScanError(err instanceof Error ? err.message : 'Scan failed')
			} finally {
				setScanning(false)
			}
		}, [slug])

		return (
			<Stack space={4}>
				{props.renderDefault(props)}
				<SeoChecklist value={value} />
				<PublishedDiff draft={value} published={publishedSeo} loading={publishedLoading} />
				{siteUrl && (
					<LiveScanPanel
						slug={slug}
						scanning={scanning}
						result={scanResult}
						error={scanError}
						draft={value}
						onScan={runScan}
					/>
				)}
			</Stack>
		)
	}

	SeoEvaluatorInput.displayName = 'SeoEvaluatorInput'
	return SeoEvaluatorInput
}

/** Default evaluator with no live scan — attach via components: { input: SeoEvaluatorInput } */
export const SeoEvaluatorInput = createSeoEvaluatorInput()
