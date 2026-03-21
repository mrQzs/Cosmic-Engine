/**
 * Proof-of-Work challenge solver.
 * Finds a nonce such that SHA-256(prefix + nonce) has `difficulty` leading zero bits.
 * Runs synchronously on the main thread (typically completes in ~200ms).
 * For heavier difficulties, consider moving to a Web Worker.
 */

/**
 * Solve a PoW challenge by brute-forcing nonces.
 * @param prefix - challenge prefix from server
 * @param difficulty - required leading zero bits
 * @returns the nonce integer that satisfies the challenge
 */
export async function solvePoWChallenge(prefix: string, difficulty: number): Promise<number> {
  const fullBytes = Math.floor(difficulty / 8);
  const remainBits = difficulty % 8;
  const mask = remainBits > 0 ? 0xff << (8 - remainBits) : 0;

  const encoder = new TextEncoder();

  for (let nonce = 0; nonce < 0x7fffffff; nonce++) {
    const data = encoder.encode(prefix + nonce);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    const hash = new Uint8Array(hashBuf);

    let valid = true;
    for (let i = 0; i < fullBytes; i++) {
      if (hash[i] !== 0) {
        valid = false;
        break;
      }
    }
    if (valid && remainBits > 0) {
      if ((hash[fullBytes] & mask) !== 0) {
        valid = false;
      }
    }

    if (valid) return nonce;

    // Yield to event loop every 1024 iterations to keep UI responsive
    if ((nonce & 0x3ff) === 0x3ff) {
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }

  throw new Error('PoW challenge: no valid nonce found');
}
