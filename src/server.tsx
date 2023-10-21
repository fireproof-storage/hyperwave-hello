import { Hono } from 'hono'
import { logger } from 'hono/logger'
import Layout from './Layout.tsx'
import { serveStatic } from 'hono/bun'
import { fireproof } from '@fireproof/core/node'

const db = fireproof('hyperwave')

const app = new Hono()

app.use('/styles/*', serveStatic({ root: './public/' }))

app.use('*', logger())

app.onError((err, c) => c.html(<Layout title="Error">{err}</Layout>))

app.post('/message', async ({ req, html }) => {
  const body = await req.parseBody()
  const ok = await db.put(body as Record<string, string>)
  return html(
    <span id="status" hx-swap="innerHTML">
      Posted: {ok.id}
    </span>
  )
})

app.get('/messages', async ({ html }) => {
  console.log('get')
  const messages = await db.allDocs()
  console.log(messages)
  const docs = messages.rows.map(r => r.value)
  return html(
    <ul>
      {docs.map(doc => (
        <li>{doc.message}</li>
      ))}
    </ul>
  )
})

app.get('/', ({ html }) =>
  html(
    <Layout title="hyperwave">
      <section class="flex flex-col gap-8">
        <form hx-post="/message" hx-target="#status" hx-boost="true">
          <div>
            <label for="message" class="font-bold text-sm mr-6">
              Message
            </label>
            <input
              type="text"
              name="message"
              id="message"
              class="bg-blue-100 p-4 text-sm font-bold rounded-md shadow-sm"
            />

            <button
              type="submit"
              class="bg-blue-100 ml-8 p-4 text-sm font-bold rounded-md shadow-sm"
              hx-trigger="htmx:afterOnLoad:javascript:document.getElementById('message').value=''"
            >
              send message to <code>/message</code>
            </button>
          </div>
        </form>
        Post status:{' '}
        <span id="status" hx-swap="innerHTML">
          none
        </span>
        <button
          class="bg-blue-100 p-4 text-sm font-bold rounded-md shadow-sm"
          hx-get="/messages"
          hx-swap="innerHTML"
          hx-target="#messages"
        >
          fetch messages from <code>/messages</code>
        </button>
        <ul id="messages">
          <li></li>
        </ul>
      </section>
    </Layout>
  )
)

export default app
