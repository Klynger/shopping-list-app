export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * Registers the callback run when an authenticated request comes back 401,
 * meaning the session expired or was never there.
 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/v1${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  })

  const text = await response.text()
  const payload = text ? parsePayload(text) : undefined

  if (!response.ok) {
    // A failed login is a 401 too, but it means wrong credentials, not a lost session.
    if (response.status === 401 && path !== '/users/login') {
      unauthorizedHandler?.()
    }

    const first = (payload as ErrorPayload | undefined)?.errors?.[0]
    throw new ApiError(
      response.status,
      first?.code ?? 'UNKNOWN',
      first?.detail ?? `Request failed with status ${response.status}`,
    )
  }

  return payload as T
}

let unauthorizedHandler: (() => void) | null = null

function parsePayload(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

type ErrorPayload = {
  errors?: { code: string; detail: string; meta?: Record<string, unknown> }[]
}
