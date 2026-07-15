import { put, del, list } from '@vercel/blob'

export const runtime = 'nodejs'

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'download'
  const token = req.headers.get('x-admin-token')

  if (action === 'upload') {
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    if (!req.body) {
      return new Response(JSON.stringify({ error: 'No body' }), { status: 400 })
    }

    try {
      const body = await req.text()
      const blob = await put('students-tracker/db.json', body, {
        access: 'public',
        contentType: 'application/json'
      })

      return new Response(JSON.stringify({ success: true, url: blob.url }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 })
    }
  }

  if (action === 'download') {
    try {
      const blobs = await list({ prefix: 'students-tracker/' })
      const dbBlob = blobs.blobs.find(b => b.pathname === 'students-tracker/db.json')

      if (!dbBlob) {
        return new Response(JSON.stringify({ error: 'No database found' }), { status: 404 })
      }

      const response = await fetch(dbBlob.url)
      const data = await response.text()

      return new Response(data, {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Download failed' }), { status: 500 })
    }
  }

  if (action === 'reset') {
    if (!token || token !== process.env.ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    try {
      const blobs = await list({ prefix: 'students-tracker/' })
      await Promise.all(blobs.blobs.map(b => del(b.url)))
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Reset failed' }), { status: 500 })
    }
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 })
}
