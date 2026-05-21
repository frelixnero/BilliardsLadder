import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let parsedMessage = text;

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed?.message === "string" && parsed.message.trim()) {
        parsedMessage = parsed.message.trim();
      } else if (typeof parsed?.error === "string" && parsed.error.trim()) {
        parsedMessage = parsed.error.trim();
      }
    } catch {
      // Keep raw text when response is not JSON.
    }

    throw new Error(`${res.status}: ${parsedMessage}`);
  }
}

export async function apiRequest(
  urlOrMethod: string,
  urlOrOptions?: string | { method?: string; body?: string; headers?: Record<string, string> },
  bodyData?: unknown
): Promise<any> {
  let url: string;
  let method: string;
  let body: string | undefined;
  let headers: Record<string, string> = {};

  const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];
  if (httpMethods.includes(urlOrMethod.toUpperCase())) {
    // Old calling convention: apiRequest(method, url, body?)
    method = urlOrMethod.toUpperCase();
    url = urlOrOptions as string;
    body = bodyData !== undefined ? JSON.stringify(bodyData) : undefined;
  } else {
    // New calling convention: apiRequest(url, options?)
    url = urlOrMethod;
    const options = urlOrOptions as { method?: string; body?: string; headers?: Record<string, string> } | undefined;
    method = options?.method || "GET";
    body = options?.body;
    headers = options?.headers || {};
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...headers,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
