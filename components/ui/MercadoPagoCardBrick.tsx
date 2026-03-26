'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { PaymentIntent } from '@/types'

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => {
      bricks: () => {
        create: (
          brickType: string,
          containerId: string,
          settings: {
            initialization?: Record<string, unknown>
            customization?: Record<string, unknown>
            callbacks?: Record<string, unknown>
          },
        ) => Promise<{ unmount?: () => void }>
      }
    }
  }
}

type Props = {
  amount: number
  customerEmail: string
  customerPhone?: string
  description: string
  metadata: Record<string, string>
  onPaymentCreated: (intent: PaymentIntent) => Promise<void>
}

const containerId = 'mercado-pago-card-brick'

export default function MercadoPagoCardBrick({
  amount,
  customerEmail,
  customerPhone,
  description,
  metadata,
  onPaymentCreated,
}: Props) {
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || ''
  const [sdkReady, setSdkReady] = useState(() => typeof window !== 'undefined' && Boolean(window.MercadoPago))
  const [brickReady, setBrickReady] = useState(false)
  const [brickError, setBrickError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [brickInstanceKey, setBrickInstanceKey] = useState(0)
  const activeContainerId = `${containerId}-${brickInstanceKey}`
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onPaymentCreatedRef = useRef(onPaymentCreated)
  const runtimeConfigRef = useRef({
    amount,
    customerEmail,
    customerPhone: customerPhone || '',
    description,
    metadata,
  })
  const remountSignature = JSON.stringify({
    amount,
    customerEmail,
    customerPhone: customerPhone || '',
    description,
    metadata,
  })

  useEffect(() => {
    onPaymentCreatedRef.current = onPaymentCreated
  }, [onPaymentCreated])

  useEffect(() => {
    runtimeConfigRef.current = {
      amount,
      customerEmail,
      customerPhone: customerPhone || '',
      description,
      metadata,
    }
  }, [amount, customerEmail, customerPhone, description, metadata])

  useEffect(() => {
    setBrickInstanceKey(current => current + 1)
  }, [remountSignature])

  useEffect(() => {
    if (!sdkReady || !publicKey || !window.MercadoPago || amount <= 0 || !customerEmail) return

    let active = true
    let controller: { unmount?: () => void } | null = null
    const container = containerRef.current

    const renderBrick = async () => {
      setBrickReady(false)
      setBrickError(null)
      setSubmitError(null)

      try {
        if (container) {
          container.innerHTML = ''
        }

        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' })
        const bricksBuilder = mp.bricks()

        controller = await bricksBuilder.create('cardPayment', activeContainerId, {
          initialization: {
            amount,
            payer: { email: customerEmail },
          },
          customization: {
            visual: {
              style: { theme: 'default' },
            },
            paymentMethods: {
              maxInstallments: 10,
            },
          },
          callbacks: {
            onReady: () => {
              if (!active) return
              setBrickReady(true)
              setBrickError(null)
            },
            onSubmit: async (cardFormData: Record<string, unknown>) => {
              setSubmitError(null)

              try {
                const latestConfig = runtimeConfigRef.current
                const response = await fetch('/api/payments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    amount: latestConfig.amount,
                    description: latestConfig.description,
                    customerEmail: latestConfig.customerEmail,
                    customerPhone: latestConfig.customerPhone,
                    metadata: latestConfig.metadata,
                    formData: cardFormData,
                  }),
                })

                const payload = await response.json()

                if (response.status === 422 || (!response.ok && payload?.error)) {
                  throw new Error(payload?.error || 'Pagamento recusado.')
                }

                if (!response.ok || !payload?.data) {
                  throw new Error(payload?.error || 'Nao foi possivel processar o cartao no Mercado Pago.')
                }

                await onPaymentCreatedRef.current(payload.data as PaymentIntent)
              } catch (error) {
                if (!active) return
                const message = error instanceof Error ? error.message : 'Nao foi possivel processar o cartao no Mercado Pago.'
                setSubmitError(message)
                toast.error(message)
              }
            },
            onError: (error: unknown) => {
              if (!active) return
              const message = error instanceof Error ? error.message : 'Falha ao inicializar o formulario do Mercado Pago.'
              setSubmitError(message)
            },
          },
        })
      } catch (error) {
        if (!active) return
        const message = error instanceof Error ? error.message : 'Falha ao carregar o checkout do Mercado Pago.'
        setBrickError(message)
      }
    }

    void renderBrick()

    return () => {
      active = false
      controller?.unmount?.()
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [activeContainerId, amount, customerEmail, publicKey, sdkReady])

  if (!publicKey) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY nao configurada.
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={() => setBrickError('Nao foi possivel baixar o SDK do Mercado Pago.')}
      />

      {!brickReady && !brickError ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Conectando com Mercado Pago...
        </div>
      ) : null}

      {brickError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {brickError}
          <button
            type="button"
            className="ml-3 font-semibold underline underline-offset-2"
            onClick={() => {
              setBrickError(null)
              setBrickReady(false)
              setBrickInstanceKey(current => current + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {submitError && !brickError ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {submitError}
        </div>
      ) : null}

      <div id={activeContainerId} ref={containerRef} className="min-h-[240px]" />
    </>
  )
}
