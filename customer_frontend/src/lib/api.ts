export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type ApiError = { error: string };

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const msg = (data as ApiError | undefined)?.error || res.statusText || "Request failed";
    throw new Error(msg);
  }
  return data as T;
}

export async function logActivity(action: string, details?: any) {
  try {
    await apiFetch("/api/customer/activity", {
      method: "POST",
      body: JSON.stringify({ action, details }),
    });
  } catch (e) {
    // silently fail
  }
}
