import { supabase } from './supabase';

interface JWTHeader {
  alg: string;
  kid?: string;
  typ?: string;
}

interface JWK {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n?: string;
  e?: string;
}

interface JWKSet {
  keys: JWK[];
}

export class JWTVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JWTVerificationError';
  }
}

async function base64UrlDecode(str: string): Promise<string> {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');

  try {
    return atob(paddedBase64);
  } catch (error) {
    throw new JWTVerificationError('Invalid base64url encoding');
  }
}

function parseJWT(token: string): { header: JWTHeader; payload: any; signature: string } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new JWTVerificationError('Invalid JWT format');
  }

  try {
    const headerJson = base64UrlDecode(parts[0]);
    const payloadJson = base64UrlDecode(parts[1]);

    return {
      header: JSON.parse(headerJson as unknown as string),
      payload: JSON.parse(payloadJson as unknown as string),
      signature: parts[2]
    };
  } catch (error) {
    throw new JWTVerificationError('Failed to parse JWT');
  }
}

async function fetchJWKS(jwksUrl: string): Promise<JWKSet> {
  try {
    const response = await fetch(jwksUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new JWTVerificationError(`Failed to fetch JWKS: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof JWTVerificationError) throw error;
    throw new JWTVerificationError('Network error fetching JWKS');
  }
}

async function importRSAPublicKey(jwk: JWK): Promise<CryptoKey> {
  if (!jwk.n || !jwk.e) {
    throw new JWTVerificationError('Invalid RSA JWK: missing n or e');
  }

  try {
    const keyData = {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
      alg: jwk.alg || 'RS256',
      ext: true,
    };

    return await crypto.subtle.importKey(
      'jwk',
      keyData,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      true,
      ['verify']
    );
  } catch (error) {
    throw new JWTVerificationError('Failed to import RSA public key');
  }
}

async function verifySignature(
  token: string,
  publicKey: CryptoKey
): Promise<boolean> {
  const parts = token.split('.');
  const message = `${parts[0]}.${parts[1]}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const signatureBase64Url = parts[2];
  const signatureBase64 = signatureBase64Url.replace(/-/g, '+').replace(/_/g, '/');
  const paddedSignature = signatureBase64.padEnd(
    signatureBase64.length + (4 - (signatureBase64.length % 4)) % 4,
    '='
  );

  const signatureArrayBuffer = Uint8Array.from(atob(paddedSignature), c => c.charCodeAt(0));

  try {
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureArrayBuffer,
      data
    );
  } catch (error) {
    throw new JWTVerificationError('Signature verification failed');
  }
}

function validateClaims(payload: any, expectedIssuer?: string, expectedAudience?: string): void {
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new JWTVerificationError('Token has expired');
  }

  if (payload.nbf && payload.nbf > now) {
    throw new JWTVerificationError('Token not yet valid');
  }

  if (expectedIssuer && payload.iss !== expectedIssuer) {
    throw new JWTVerificationError('Invalid issuer');
  }

  if (expectedAudience && payload.aud !== expectedAudience) {
    throw new JWTVerificationError('Invalid audience');
  }

  if (!payload.sub) {
    throw new JWTVerificationError('Missing subject claim');
  }
}

export async function verifyLTIToken(
  idToken: string,
  issuer: string
): Promise<any> {
  try {
    const { header, payload, signature } = parseJWT(idToken);

    if (header.alg !== 'RS256') {
      throw new JWTVerificationError('Unsupported algorithm: only RS256 is allowed');
    }

    const { data: deployment, error } = await supabase
      .from('lti_deployments')
      .select('jwks_url, issuer, client_id')
      .eq('issuer', issuer)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !deployment) {
      throw new JWTVerificationError('LTI deployment not found or inactive');
    }

    if (!deployment.jwks_url) {
      throw new JWTVerificationError('JWKS URL not configured for deployment');
    }

    const jwks = await fetchJWKS(deployment.jwks_url);

    const jwk = header.kid
      ? jwks.keys.find(k => k.kid === header.kid)
      : jwks.keys[0];

    if (!jwk) {
      throw new JWTVerificationError('No matching key found in JWKS');
    }

    const publicKey = await importRSAPublicKey(jwk);

    const isValid = await verifySignature(idToken, publicKey);
    if (!isValid) {
      throw new JWTVerificationError('Invalid token signature');
    }

    validateClaims(payload, deployment.issuer, deployment.client_id);

    if (payload['https://purl.imsglobal.org/spec/lti/claim/message_type'] !== 'LtiResourceLinkRequest') {
      throw new JWTVerificationError('Invalid LTI message type');
    }

    if (!payload['https://purl.imsglobal.org/spec/lti/claim/version'] ||
        !payload['https://purl.imsglobal.org/spec/lti/claim/version'].startsWith('1.3')) {
      throw new JWTVerificationError('Invalid or missing LTI version');
    }

    return payload;
  } catch (error) {
    if (error instanceof JWTVerificationError) {
      console.error('[JWT Verification]', error.message);
      throw error;
    }
    console.error('[JWT Verification] Unexpected error:', error);
    throw new JWTVerificationError('Token verification failed');
  }
}

export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';

  let sanitized = input.trim().substring(0, maxLength);

  sanitized = sanitized.replace(/[<>]/g, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');

  return sanitized;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
