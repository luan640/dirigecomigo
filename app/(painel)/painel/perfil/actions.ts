'use server'

import { randomUUID } from 'crypto'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

function createS3Client() {
  const endpoint = process.env.ENDPOINT_URL_S3
  const region = process.env.REGION_S3
  const accessKeyId = process.env.ACECESS_KEY_ID
  const secretAccessKey = process.env.SECRETE_ACCESS_KEY

  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error('Configuracao de S3 incompleta.')
  }

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getPublicUrl(key: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const bucket = process.env.NAME_BUCKET_S3
  if (!supabaseUrl || !bucket) throw new Error('Configuracao publica do bucket incompleta.')
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${key}`
}

function extractObjectKey(url: string) {
  const bucket = process.env.NAME_BUCKET_S3
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.slice(index + marker.length)
}

export async function getProfileDataAction() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) throw new Error('Nao autenticado.')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('instructors')
    .select(`
      *,
      profile:profiles(full_name,email,phone,avatar_url)
    `)
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function uploadAvatarAction(formData: FormData) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) throw new Error('Nao autenticado.')

  const file = formData.get('file')
  if (!(file instanceof File)) throw new Error('Arquivo obrigatorio.')

  const s3 = createS3Client()
  const bucket = process.env.NAME_BUCKET_S3
  if (!bucket) throw new Error('Bucket S3 nao configurado.')

  const bytes = Buffer.from(await file.arrayBuffer())
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg'
  const key = `avatars/${user.id}/${randomUUID()}.${extension}`

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: bytes,
    ContentType: file.type || 'application/octet-stream',
  }))

  return { url: getPublicUrl(key) }
}

export async function deleteAvatarAction(url: string) {
  const normalizedUrl = String(url || '').trim()
  if (!normalizedUrl) return

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) throw new Error('Nao autenticado.')

  const key = extractObjectKey(normalizedUrl)
  if (!key) return

  const s3 = createS3Client()
  const bucket = process.env.NAME_BUCKET_S3
  if (!bucket) throw new Error('Bucket S3 nao configurado.')

  await s3.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }))
}
