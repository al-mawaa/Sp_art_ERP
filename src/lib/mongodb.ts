import mongoose from 'mongoose';
import dns from 'node:dns';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch {
  /* ignore if unsupported */
}

let resolvedUri: string | null = null;

function buildAuthAndDb(parsed: URL) {
  const auth =
    parsed.username && parsed.password
      ? `${encodeURIComponent(parsed.username)}:${encodeURIComponent(parsed.password)}@`
      : parsed.username
        ? `${encodeURIComponent(parsed.username)}@`
        : '';
  const dbName = parsed.pathname.replace(/^\//, '') || 'SpArts';
  const search = parsed.search ? parsed.search.replace(/^\?/, '') : '';
  const params = new URLSearchParams(search);
  if (!params.has('ssl')) params.set('ssl', 'true');
  if (!params.has('authSource')) params.set('authSource', 'admin');
  const query = params.toString();
  return { auth, dbName, querySuffix: query ? `?${query}` : '' };
}

/** Google DNS JSON API — works when Windows blocks local SRV lookups. */
async function resolveSrvViaGoogleDns(
  srvHost: string,
): Promise<{ name: string; port: number }[]> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(srvHost)}&type=SRV`;
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!res.ok) throw new Error(`Google DNS HTTP ${res.status}`);

  const json = (await res.json()) as { Status: number; Answer?: { data: string }[] };
  if (json.Status !== 0 || !json.Answer?.length) {
    throw new Error('No SRV records from Google DNS');
  }

  return json.Answer.map(answer => {
    const parts = answer.data.trim().split(/\s+/);
    if (parts.length < 4) throw new Error(`Invalid SRV record: ${answer.data}`);
    return {
      port: Number(parts[2]),
      name: parts[3].replace(/\.$/, ''),
    };
  });
}

/** Resolve mongodb+srv to a standard URI (avoids querySrv ECONNREFUSED on some Windows setups). */
async function getConnectionUri(): Promise<string> {
  if (resolvedUri) return resolvedUri;

  const directOverride = process.env.MONGODB_URI_DIRECT?.trim();
  if (directOverride) {
    resolvedUri = directOverride;
    return resolvedUri;
  }

  if (!MONGODB_URI.startsWith('mongodb+srv://')) {
    resolvedUri = MONGODB_URI;
    return resolvedUri;
  }

  const parsed = new URL(MONGODB_URI);
  const { auth, dbName, querySuffix } = buildAuthAndDb(parsed);

  const srvHost = `_mongodb._tcp.${parsed.hostname}`;

  try {
    const records = await dns.promises.resolveSrv(srvHost);
    const hosts = records.map(r => `${r.name}:${r.port}`).join(',');
    resolvedUri = `mongodb://${auth}${hosts}/${dbName}${querySuffix}`;
    return resolvedUri;
  } catch (srvError) {
    console.warn(
      '[mongodb] Local SRV lookup failed:',
      srvError instanceof Error ? srvError.message : srvError,
    );
  }

  try {
    const records = await resolveSrvViaGoogleDns(srvHost);
    const hosts = records.map(r => `${r.name}:${r.port}`).join(',');
    resolvedUri = `mongodb://${auth}${hosts}/${dbName}${querySuffix}`;
    console.warn('[mongodb] Connected using Google DNS SRV fallback');
    return resolvedUri;
  } catch (dohError) {
    console.warn(
      '[mongodb] Google DNS SRV fallback failed:',
      dohError instanceof Error ? dohError.message : dohError,
    );
  }

  resolvedUri = `mongodb://${auth}${parsed.hostname}:27017/${dbName}${querySuffix}`;
  return resolvedUri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      maxPoolSize: 10,
    };

    cached.promise = getConnectionUri()
      .then(uri => mongoose.connect(uri, opts))
      .then(m => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    resolvedUri = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
