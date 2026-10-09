export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
}

/** Pokliče API in vrne JSON; ob napaki vrne sporočilo strežnika. */
export async function apiJson<T = Record<string, unknown>>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const res = await apiFetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (data as { error?: string }).error || "Napaka", status: res.status };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Napaka pri povezavi s strežnikom", status: 0 };
  }
}
