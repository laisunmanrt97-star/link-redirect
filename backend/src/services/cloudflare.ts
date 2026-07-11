const CF_API = "https://api.cloudflare.com/client/v4";

function headers() {
  return {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

type CfResponse<T = unknown> = { success: boolean; errors: unknown[]; result: T };

async function cfFetch(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const data = (await res.json()) as CfResponse;
  if (!data.success) throw new Error(JSON.stringify(data.errors));
  return data.result;
}

export async function listZones(): Promise<{ id: string; name: string }[]> {
  const zones = await cfFetch(`${CF_API}/zones`, { headers: headers() });
  return zones.map((z: any) => ({ id: z.id, name: z.name }));
}

export async function kvPut(key: string, value: string): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
  const url = `${CF_API}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
  await cfFetch(url, {
    method: "PUT",
    headers: headers(),
    body: value,
  });
}

export async function kvDelete(key: string): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
  const url = `${CF_API}/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
  await cfFetch(url, {
    method: "DELETE",
    headers: headers(),
  });
}

export async function createWildcardDnsRecord(zoneId: string, domainName: string): Promise<void> {
  const url = `${CF_API}/zones/${zoneId}/dns_records`;
  await cfFetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type: "A",
      name: `*.${domainName}`,
      content: "192.0.2.1",
      ttl: 1,
      proxied: true,
    }),
  });
}

export async function createWorkerRoute(zoneId: string, pattern: string, workerName: string): Promise<void> {
  const url = `${CF_API}/zones/${zoneId}/workers/routes`;
  await cfFetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ pattern, script: workerName }),
  });
}
