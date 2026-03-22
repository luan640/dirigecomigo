import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado.' }, { status: 500 })
    }

    const body = await req.json()
    const amount = Number(body?.amount)
    const description = String(body?.description || 'Aula de direção')
    const customerEmail = String(body?.customerEmail || '')
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {}
    const successUrl = String(body?.successUrl || '')
    const failureUrl = String(body?.failureUrl || successUrl)
    const pendingUrl = String(body?.pendingUrl || successUrl)

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
    }
    if (!customerEmail) {
      return NextResponse.json({ error: 'E-mail do cliente é obrigatório.' }, { status: 400 })
    }

    const client = new MercadoPagoConfig({ accessToken })
    const preferenceClient = new Preference(client)

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: String(metadata?.slotId || 'aula'),
            title: description,
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL',
          },
        ],
        payer: { email: customerEmail },
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        auto_return: 'approved',
        external_reference: String(metadata?.bookingId || metadata?.slotId || `pref_${Date.now()}`),
        metadata,
        ...(process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
          ? { notification_url: `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/webhooks/mercadopago` }
          : {}),
      },
    })

    return NextResponse.json({
      data: {
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      },
      error: null,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao criar preferência.' }, { status: 500 })
  }
}
