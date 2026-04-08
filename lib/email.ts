import { Resend } from 'resend'

async function sendEmailOrThrow(args: Parameters<Resend['emails']['send']>[0]) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY nao configurada.')

  const override = process.env.EMAIL_TEST_OVERRIDE
  if (override) {
    args = { ...args, to: override }
  }

  const resend = new Resend(key)
  const result = await resend.emails.send(args)
  if (result.error) {
    throw new Error(result.error.message || 'Falha ao enviar e-mail.')
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada.')
  return new Resend(key)
}

const FROM = process.env.EMAIL_FROM ?? 'DirecaoFacil <noreply@dirigecomigo.com.br>'
const APP_NAME = 'DirecaoFacil'

export async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
}: {
  to: string
  name: string
  resetLink: string
}) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recuperar senha — ${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#0d1a0e;padding:32px 40px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${APP_NAME}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Olá, ${name} 👋</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta no ${APP_NAME}. Clique no botão abaixo para criar uma nova senha.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td>
                    <a href="${resetLink}" style="display:inline-block;background:#1B5E20;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;">
                      Redefinir minha senha →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, pode ignorar este e-mail — sua senha permanece a mesma.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                © ${new Date().getFullYear()} ${APP_NAME} · Fortaleza, CE
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  await sendEmailOrThrow({
    from: FROM,
    to,
    subject: `Redefinir sua senha no ${APP_NAME}`,
    html,
  })
}

export async function sendApprovalEmail({
  to,
  name,
}: {
  to: string
  name: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dirigecomigo.com.br'
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Você foi aprovado! — ${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B5E20 0%,#2E7D32 100%);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:48px;line-height:1;">🎉</p>
              <p style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${APP_NAME}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#14532d;">Parabéns, ${name}! 🎉</p>
              <p style="margin:0 0 24px;font-size:16px;font-weight:700;color:#16a34a;">Seu cadastro foi aprovado!</p>
              <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.7;">
                Sua documentação foi verificada e você está quase lá! Acesse a plataforma para <strong style="color:#14532d;">concluir a última etapa do cadastro</strong> e começar a receber alunos.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;padding:16px 20px;text-align:left;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#16a34a;letter-spacing:0.08em;text-transform:uppercase;">Próximo passo</p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                      Entre na plataforma e siga as instruções para ativar seu perfil. É rápido e você já estará pronto para receber agendamentos! 🚀
                    </p>
                  </td>
                </tr>
              </table>

              <a href="${appUrl}/entrar" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:15px 36px;border-radius:10px;letter-spacing:0.01em;">
                Concluir cadastro →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                © ${new Date().getFullYear()} ${APP_NAME} · Fortaleza, CE
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  await sendEmailOrThrow({
    from: FROM,
    to,
    subject: `🎉 Você foi aprovado no ${APP_NAME}! Bem-vindo à plataforma`,
    html,
  })
}

export async function sendRejectionEmail({
  to,
  name,
  reason,
}: {
  to: string
  name: string
  reason: string
}) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cadastro não aprovado — ${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0d1a0e;padding:32px 40px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                ${APP_NAME}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
                Olá, ${name} 👋
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Avaliamos seu cadastro como instrutor na plataforma ${APP_NAME} e, infelizmente, <strong style="color:#111827;">não foi possível aprová-lo neste momento</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#ef4444;letter-spacing:0.08em;text-transform:uppercase;">
                      Motivo da recusa
                    </p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                      ${reason.replace(/\n/g, '<br />')}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                Você pode <strong style="color:#111827;">corrigir as pendências e reenviar o cadastro</strong> acessando a plataforma. Nossa equipe fará uma nova análise assim que os documentos forem atualizados.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td>
                    <a
                      href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://dirigecomigo.com.br'}/login"
                      style="display:inline-block;background:#1B5E20;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;"
                    >
                      Atualizar meu cadastro →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Dúvidas? Responda este e-mail ou entre em contato pelo WhatsApp.<br />
                © ${new Date().getFullYear()} ${APP_NAME} · Fortaleza, CE
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  await sendEmailOrThrow({
    from: FROM,
    to,
    subject: `Seu cadastro no ${APP_NAME} precisa de ajustes`,
    html,
  })
}
