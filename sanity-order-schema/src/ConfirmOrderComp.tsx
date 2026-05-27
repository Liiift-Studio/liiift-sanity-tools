// Order status custom input — action buttons and summary panel for Sanity Studio
import React, { useState } from 'react'
import {
	Text,
	Stack,
	Grid,
	Button,
	Badge,
	Inline,
	Spinner,
	MenuButton,
	Menu,
	MenuItem,
} from '@sanity/ui'
import { useFormValue, set, type ObjectInputProps } from 'sanity'

/** Fields stored inside the orderStatus object */
interface OrderStatusValue {
	status?: string
	paymentIntentId?: string
	setupIntentId?: string
	orderNumber?: string
	shippingStatus?: boolean
	invoiceId?: string
}

/** Human-readable status labels with outcome icons */
const STATUS_LABEL: Record<string, string> = {
	verified:     '✓ Verified',
	wireVerified: '✓ Wire Verified',
	failed:       '✗ Failed',
	wireFailed:   '✗ Wire Failed',
	wireFail:     '✗ Wire Cancelled',
	refunded:     '↩ Refunded',
	pending:      'Pending',
	wirePending:  'Wire Pending',
}

const STATUS_TONE: Record<string, 'caution' | 'positive' | 'critical'> = {
	pending:      'caution',
	wirePending:  'caution',
	verified:     'positive',
	wireVerified: 'positive',
	failed:       'critical',
	wireFailed:   'critical',
	wireFail:     'critical',
}

const labelStyle = { textTransform: 'uppercase' as const, letterSpacing: '0.06em' }

/** Truncate a Stripe ID for display — keeps first 22 chars */
const truncateId = (id?: string | null) =>
	id ? id.slice(0, 22) + (id.length > 22 ? '…' : '') : null

/** Order status panel — confirm, resend, rebuild, wire-verify actions */
export const ConfirmOrderComp = (props: ObjectInputProps) => {
	const { value, onChange } = props
	const typedValue = value as OrderStatusValue | undefined

	const orderNumber      = typedValue?.orderNumber   ?? (useFormValue(['orderNumber']) as string | undefined)
	const paymentIntentId  = typedValue?.paymentIntentId
	const setupIntentId    = typedValue?.setupIntentId
	const invoiceId        = typedValue?.invoiceId
	const status           = typedValue?.status
	const shippingStatus   = typedValue?.shippingStatus

	const shippingId         = useFormValue(['shippingId']) as string[] | undefined
	const receiptDescription = useFormValue(['receiptDescription']) as string | undefined
	const shippingData       = useFormValue(['shippingData']) as string | undefined
	const contactEmail       = useFormValue(['licenseeAddress', 'email']) as string | undefined
	const company            = useFormValue(['licenseeAddress', 'company']) as string | undefined
	const brand              = useFormValue(['licenseeAddress', 'brand']) as string | undefined
	const licenseeName       = useFormValue(['licenseeAddress', 'name']) as string | undefined
	const licenseeFirstName  = useFormValue(['licenseeAddress', 'firstName']) as string | undefined
	const licenseeLastName   = useFormValue(['licenseeAddress', 'lastName']) as string | undefined
	const behalfOfIndividual = useFormValue(['licenseeAddress', 'behalfOfIndividual']) as boolean | undefined
	const billingEmail       = useFormValue(['billingAddress', 'email']) as string | undefined
	const merch              = useFormValue(['merch']) as unknown[] | undefined
	const hasMerch           = (merch?.length ?? 0) > 0

	const [loading, setLoading]           = useState(false)
	const [error, setError]               = useState<string | null>(null)
	const [detailsOpen, setDetailsOpen]   = useState(false)

	const siteUrl = process.env.SANITY_STUDIO_SITE_URL ?? ''

	/** Dispatch one of the action types, handling loading + error state */
	async function buttonPress(type: 'confirm' | 'resend' | 'rebuild' | 'wire', args?: string) {
		if (loading) return
		setLoading(true)
		setError(null)
		try {
			if (type === 'confirm') await handleConfirm(args)
			else if (type === 'resend') await resendOrder(args)
			else if (type === 'rebuild') await rebuildOrder()
			else if (type === 'wire') await verifyWire(args)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Unexpected error')
		} finally {
			setLoading(false)
		}
	}

	/** Confirm or reject/refund an order via the site's confirmOrder endpoint */
	async function handleConfirm(confirm?: string) {
		const sid = (!setupIntentId || setupIntentId === null) ? 'non stripe payment' : setupIntentId
		const pid = (!paymentIntentId || paymentIntentId === null) ? 'non stripe payment' : paymentIntentId

		const res = await fetch(`${siteUrl}/api/sanity/confirmOrder`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				paymentIntentId: pid,
				setupIntentId: sid,
				orderNumber,
				order: confirm,
				invoiceId,
				shippingId,
				shippingData,
				receiptDescription,
			}),
		})

		const data = await res.json()
		console.warn('Confirm order response:', data)

		if (!data.success) {
			let msg: string = data.stripeError || data.message || 'Action failed'
			if (data.stripeDeclineCode) msg += ` (${data.stripeDeclineCode})`
			setError(msg)
		}
	}

	/** Resend the order confirmation email, or the shipping confirmation if type is 'shipping' */
	async function resendOrder(type?: string) {
		if (type === 'shipping') {
			await fetch(`${siteUrl}/api/sanity/resendOrder`, {
				method: 'POST',
				mode: 'no-cors',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ orderNumber, invoiceId, status: 'confirmShipping' }),
			}).then(() => {
				onChange(set({ ...typedValue, shippingStatus: true }))
			}).catch(e => console.error(e.message))
		} else {
			await fetch(`${siteUrl}/api/sanity/resendOrder`, {
				method: 'POST',
				mode: 'no-cors',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ orderNumber, invoiceId, status: 'resend' }),
			}).catch(e => console.error(e.message))
		}
	}

	/** Trigger a package rebuild for the order */
	async function rebuildOrder() {
		await fetch(`${siteUrl}/api/sanity/rebuildOrder`, {
			method: 'POST',
			mode: 'no-cors',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ orderNumber }),
		}).catch(e => console.error(e.message))
	}

	/** Verify or reject a wire transfer payment */
	async function verifyWire(code?: string) {
		await fetch(`${siteUrl}/api/sanity/verifyWire`, {
			method: 'POST',
			mode: 'no-cors',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ orderNumber: Number(orderNumber), invoiceId, code }),
		}).catch(e => console.error(e.message))
	}

	const displayName = licenseeName || [licenseeFirstName, licenseeLastName].filter(Boolean).join(' ') || null
	const showCompany = !behalfOfIndividual && !!company
	const showName    = behalfOfIndividual || (!company && !!displayName)

	const hasPrimaryAction = orderNumber && (
		status === 'pending' || status === 'failed' ||
		status === 'wirePending' || status === 'wireFail' ||
		(status === 'verified' && paymentIntentId)
	)

	return (
		<Stack space={4}>

			{/* Status badge + spinner */}
			<Stack>
				<Inline space={2}>
					<Badge
						tone={STATUS_TONE[status ?? ''] ?? 'caution'}
						fontSize={3}
						style={{ textTransform: 'capitalize' }}
						padding={3}
						radius={3}
					>
						<b>{STATUS_LABEL[status ?? ''] ?? status}</b>
					</Badge>
					{loading && <Spinner />}
				</Inline>
				{error && (
					<Text size={1} style={{ color: 'var(--card-critical-fg-color, #e05252)', fontWeight: 600 }}>
						{error}
					</Text>
				)}
			</Stack>

			{/* Contact info grid */}
			{(contactEmail || showCompany || showName || brand || hasMerch) && (
				<Grid columns={[1, 2]} gap={4}>
					{contactEmail && (
						<Stack space={2}>
							<Text size={0} muted style={labelStyle}>Licensee Email</Text>
							<Text size={1}>{contactEmail}</Text>
						</Stack>
					)}
					{(billingEmail || contactEmail) && (
						<Stack space={2}>
							<Text size={0} muted style={labelStyle}>Billing Email</Text>
							<Text size={1}>{billingEmail || contactEmail}</Text>
						</Stack>
					)}
					{showCompany && (
						<Stack space={2}>
							<Text size={0} muted style={labelStyle}>Company</Text>
							<Text size={1}>{company}</Text>
						</Stack>
					)}
					{showName && displayName && (
						<Stack space={2}>
							<Text size={0} muted style={labelStyle}>Name</Text>
							<Text size={1}>{displayName}</Text>
						</Stack>
					)}
					{brand && (
						<Stack space={2}>
							<Text size={0} muted style={labelStyle}>Brand</Text>
							<Text size={1}>{brand}</Text>
						</Stack>
					)}
					{hasMerch && (
						<Stack space={2}>
							<Text size={0} muted style={labelStyle}>Shipment</Text>
							<Text size={1} tone={shippingStatus ? 'positive' : 'caution'}>
								{status !== 'verified' ? '—' : shippingStatus ? 'Email sent' : 'Not sent'}
							</Text>
						</Stack>
					)}
				</Grid>
			)}

			{/* Action buttons */}
			<Inline space={2}>
				{hasPrimaryAction && status === 'pending' && (
					<Button disabled={loading} mode="default" tone="positive" onClick={() => buttonPress('confirm', 'verify')} text="Confirm" />
				)}
				{hasPrimaryAction && status === 'pending' && (
					<Button disabled={loading} mode="ghost" tone="critical" onClick={() => buttonPress('confirm', 'reject')} text="Cancel" />
				)}
				{hasPrimaryAction && status === 'failed' && (
					<Button disabled={loading} mode="ghost" tone="caution" onClick={() => buttonPress('confirm', 'verify')} text="Try Again" />
				)}
				{hasPrimaryAction && status === 'verified' && paymentIntentId && (
					<Button disabled={loading} mode="ghost" tone="critical" onClick={() => buttonPress('confirm', 'refund')} text="Refund" />
				)}
				{hasPrimaryAction && status === 'wirePending' && (
					<Button disabled={loading} mode="default" tone="positive" onClick={() => buttonPress('wire', 'verify')} text="Verify" />
				)}
				{hasPrimaryAction && status === 'wirePending' && (
					<Button disabled={loading} mode="ghost" tone="critical" onClick={() => buttonPress('wire', 'reject')} text="Reject" />
				)}
				{hasPrimaryAction && status === 'wireFail' && (
					<Text size={1} tone="critical">Wire Cancelled</Text>
				)}
				{hasPrimaryAction && (
					<Text size={1} muted style={{ opacity: 0.25 }}>|</Text>
				)}
				<MenuButton
					button={<Button mode="ghost" text="More" disabled={loading} />}
					id="order-more-menu"
					menu={
						<Menu>
							<MenuItem text="Resend" disabled={loading} onClick={() => buttonPress('resend')} />
							<MenuItem text="Rebuild" disabled={loading} onClick={() => buttonPress('rebuild')} />
							<MenuItem text="Send Shipment" disabled={!hasMerch || loading} onClick={() => buttonPress('resend', 'shipping')} />
						</Menu>
					}
					popover={{ placement: 'bottom-start' }}
				/>
				<Button
					mode="ghost"
					onClick={() => setDetailsOpen(v => !v)}
					text={detailsOpen ? 'Close Details' : 'Details'}
				/>
			</Inline>

			{/* ID details — accordion */}
			{detailsOpen && (
				<Grid columns={[1, 2]} gap={4}>
					<Stack space={2}>
						<Text size={0} muted style={labelStyle}>Invoice</Text>
						<Text size={1} style={{ fontFamily: 'monospace', opacity: invoiceId ? 1 : 0.35, wordBreak: 'break-all' }}>
							{invoiceId ? truncateId(invoiceId) : '—'}
						</Text>
					</Stack>
					<Stack space={2}>
						<Text size={0} muted style={labelStyle}>Payment</Text>
						<Text size={1} style={{ fontFamily: 'monospace', opacity: paymentIntentId ? 1 : 0.35, wordBreak: 'break-all' }}>
							{paymentIntentId ? truncateId(paymentIntentId) : '—'}
						</Text>
					</Stack>
					{hasMerch && (
						<Stack space={2}>
							<Text size={0} muted style={labelStyle}>Shipping</Text>
							<Text size={1} style={{ fontFamily: 'monospace', opacity: shippingId?.length ? 1 : 0.35, wordBreak: 'break-all' }}>
								{shippingId?.length ? truncateId(shippingId[0]) : '—'}
							</Text>
						</Stack>
					)}
				</Grid>
			)}

		</Stack>
	)
}
