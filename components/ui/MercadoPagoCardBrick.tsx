/**
 * MercadoPagoCardBrick
 *
 * Componente de pagamento com cartão via Checkout Transparente do Mercado Pago.
 * Utiliza o Card Brick do MercadoPago.js v2 para tokenizar o cartão no navegador
 * do comprador — nenhum dado de cartão trafega pelo servidor da plataforma,
 * garantindo conformidade PCI DSS (Secure Fields / PCI Compliance card form).
 *
 * O Brick renderiza o formulário completo de cartão com:
 *  - Campos de número, validade e CVV com validação em tempo real
 *  - Seleção de parcelas
 *  - Identificação do comprador (CPF/CNPJ)
 *
 * Ao submeter, o Brick gera um token one-time e chama onSubmit com os dados
 * do formulário, que são enviados ao backend via /api/payments.
 */

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
  /** Telefone do comprador (ex: "85999999999"). Usado no additional_info do MP. */
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

  // Detecta quando o Brick injetou seu conteúdo no container
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const syncRenderedState = () => {
      if (container.childElementCount > 0) setBrickReady(true)
    }

    syncRenderedState()

    const observer = new MutationObserver(syncRenderedState)
    observer.observe(container, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [activeContainerId])

  // Inicializa o Card Brick assim que o SDK estiver disponível
  useEffect(() => {
    if (!sdkReady || !publicKey || !window.MercadoPago || amount <= 0 || !customerEmail) return

    let active = true
    let controller: { unmount?: () => void } | null = null

    const renderBrick = async () => {
      setBrickReady(false)
      setBrickError(null)
      setSubmitError(null)

      try {
        const mp = new window.MercadoPago!(publicKey, { locale: 'pt-BR' })
        const bricksBuilder = mp.bricks()

        controller = await bricksBuilder.create('cardPayment', activeContainerId, {
          initialization: {
            amount,
            // Pré-preenche o e-mail no formulário do Brick
            payer: { email: customerEmail },
          },
          customization: {
            visual: {
              style: { theme: 'default' },
            },
            paymentMethods: {
              // Limita a 12 parcelas máximas
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => {
              if (active) setBrickReady(true)
            },
            onSubmit: async (cardFormData: Record<string, unknown>) => {
              setSubmitError(null)

              try {
                const response = await fetch('/api/payments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    amount,
                    description,
                    customerEmail,
                    customerPhone: customerPhone || '',
                    metadata,
                    formData: cardFormData,
                  }),
                })

                const payload = await response.json()

                // Erro de rejeição com mensagem amigável (status 422)
                if (response.status === 422 || (!response.ok && payload?.error)) {
                  throw new Error(payload?.error || 'Pagamento recusado.')
                }

                if (!response.ok || !payload?.data) {
                  throw new Error(payload?.error || 'Não foi possível processar o cartão no Mercado Pago.')
                }

                await onPaymentCreated(payload.data as PaymentIntent)
              } catch (error) {
                if (!active) return
                const message =
                  error instanceof Error
                    ? error.message
                    : 'Não foi possível processar o cartão no Mercado Pago.'
                setSubmitError(message)
                toast.error(message)
              }
            },
            onError: (error: unknown) => {
              if (!active) return
              // Erros de validação de campo do Brick não são fatais
              const message =
                error instanceof Error
                  ? error.message
                  : 'Falha ao inicializar o formulário do Mercado Pago.'
              setSubmitError(message)
            },
          },
        })
      } catch (error) {
        if (!active) return
        const message =
          error instanceof Error
            ? error.message
            : 'Falha ao carregar o checkout do Mercado Pago.'
        setBrickError(message)
      }
    }

    void renderBrick()

    return () => {
      active = false
      controller?.unmount?.()
    }
  }, [activeContainerId, amount, customerEmail, customerPhone, description, metadata, onPaymentCreated, publicKey, sdkReady])

  if (!publicKey) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY não configurada.
      </div>
    )
  }

  return (
    <>
      {/* SDK MercadoPago.js v2 — carregado após a página ser interativa */}
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={() => setBrickError('Não foi possível baixar o SDK do Mercado Pago.')}
      />

      {!brickReady && !brickError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Conectando com Mercado Pago...
        </div>
      )}

      {brickError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {brickError}
          <button
            type="button"
            className="ml-3 font-semibold underline underline-offset-2"
            onClick={() => {
              setBrickError(null)
              setBrickReady(false)
              setBrickInstanceKey(k => k + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {submitError && !brickError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {submitError}
        </div>
      )}

      <div id={activeContainerId} ref={containerRef} className="min-h-[240px]" />
    </>
  )
}
