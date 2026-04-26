import * as signalR from '@microsoft/signalr'
import { getAccess } from './auth'

/** @type {Set<(lotId?: number) => void>} */
const listeners = new Set()

/** @type {import('@microsoft/signalr').HubConnection | null} */
let connection = null

/** @type {Promise<import('@microsoft/signalr').HubConnection> | null} */
let connectPromise = null

function getHubUrl() {
  const envBase = import.meta.env.VITE_API_URL
  const base = typeof envBase === 'string' ? envBase.replace(/\/$/, '') : ''
  if (base) return `${base}/hubs/parking`
  if (typeof window !== 'undefined') return `${window.location.origin}/hubs/parking`
  return '/hubs/parking'
}

function notifyAll() {
  for (const cb of listeners) {
    try {
      cb()
    } catch {
      /* ignore subscriber errors */
    }
  }
}

async function startSharedConnection() {
  const hubUrl = getHubUrl()
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      accessTokenFactory: () => getAccess() ?? '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  conn.on('slotsUpdated', notifyAll)
  await conn.start()
  connection = conn
  return conn
}

/**
 * Subscribes to live slot updates. Uses one shared connection for all subscribers (avoids React StrictMode
 * tearing down a dedicated socket during negotiation). When VITE_API_URL is set, connects to the API host
 * directly instead of the Vite dev port (more reliable WebSockets than proxying).
 * @param {(lotId?: number) => void} onSlotsUpdated
 * @returns {() => Promise<void>} stop function — call on unmount; connection stops when last subscriber leaves.
 */
export function startParkingHub(onSlotsUpdated) {
  listeners.add(onSlotsUpdated)

  if (!connectPromise) {
    connectPromise = startSharedConnection().catch((err) => {
      connectPromise = null
      connection = null
      throw err
    })
  }

  void connectPromise.catch(() => {
    /* optional hub; polling still works */
  })

  return async () => {
    listeners.delete(onSlotsUpdated)
    if (listeners.size > 0) return

    const pending = connectPromise
    connectPromise = null
    try {
      if (connection) {
        await connection.stop()
      } else if (pending) {
        const conn = await pending
        await conn.stop()
      }
    } catch {
      /* ignore */
    } finally {
      connection = null
    }
  }
}
