import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseServerConfig } from "@/lib/supabase/config";

export interface AuthenticatedContext {
  accessToken: string;
  client: SupabaseClient;
  email: string | null;
  userId: string;
}

export async function createServerAuthClient() {
  const cookieStore = await cookies();
  const { serviceRoleKey, url } = getSupabaseServerConfig();

  return createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The root proxy refreshes
          // the session before protected rendering reaches this client.
        }
      },
    },
  });
}

export function createAuthenticatedDataClient(
  accessToken: string,
): SupabaseClient {
  const { serviceRoleKey, url } = getSupabaseServerConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function createServiceRoleClient(): SupabaseClient {
  const { serviceRoleKey, url } = getSupabaseServerConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export async function getAuthenticatedContext(): Promise<AuthenticatedContext | null> {
  const authClient = await createServerAuthClient();
  const { data: claimsData, error: claimsError } =
    await authClient.auth.getClaims();

  if (claimsError || typeof claimsData?.claims.sub !== "string") {
    return null;
  }

  const {
    data: { session },
  } = await authClient.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  return {
    accessToken: session.access_token,
    client: createAuthenticatedDataClient(session.access_token),
    email:
      typeof claimsData.claims.email === "string"
        ? claimsData.claims.email
        : null,
    userId: claimsData.claims.sub,
  };
}
