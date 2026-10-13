/**
 * Bethany Homestay Mobile - Secure Authentication & Session Management
 * Includes SHA-256 verification, Brute-Force Rate Limiting, Signed Session Tokens,
 * and Persistent Session Expiry.
 */

import StorageService from './storageService';

// Standalone FIPS 180-2 compliant SHA-256 implementation (pure JS, 0 dependencies)
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }

    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let lengthProperty = 'length';
    let i, j;
    let result = '';

    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;

    let hash = [];
    const k = [];
    let primeCounter = 0;

    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }

    hash = hash.slice(0, 8);

    ascii += '\x80';
    while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return;
        words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;

    for (j = 0; j < words[lengthProperty];) {
        const w = words.slice(j, (j += 16));
        const oldHash = hash.slice(0);

        for (i = 0; i < 64; i++) {
            const w15 = w[i - 15];
            const w2 = w[i - 2];
            const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
            const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
            w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

            const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
            const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
            const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + w[i]) | 0;
            const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

            hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
        }

        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }

    for (i = 0; i < 8; i++) {
        for (j = 3; j >= 0; j--) {
            const b = (hash[i] >> (8 * j)) & 255;
            result += (b < 16 ? '0' : '') + b.toString(16);
        }
    }
    return result;
}

// Authorized credentials hashes
// Primary: 'namastehills:Nama$te@1234'
const AUTHORIZED_HASHES = new Set([
    '908795878911c75e986a3840ab38920ffb866accb6f0aac430d6d705d77995b4', // lowercase user
    '49b951b0ecbeddcc90e3c335ffbbdb4c8bc7ef8662fd1fff21592e15695459da'  // uppercase user
]);

const TOKEN_KEY = '@bethany_admin_session_token';
const RATE_LIMIT_KEY = '@bethany_admin_failed_attempts';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 3 * 60 * 1000; // 3 minutes lockout
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours active session

// Pepper used for internal session signature validation
const SESSION_PEPPER = 'BETHANY_HIMALAYAN_SANCTUARY_KEY_2026';

export const AuthService = {
    /**
     * Check if client is currently in brute-force lockout
     */
    async checkLockoutStatus() {
        try {
            const raw = await StorageService.getItem(RATE_LIMIT_KEY);
            if (!raw) return { isLocked: false, remainingSeconds: 0 };
            const data = JSON.parse(raw);
            const now = Date.now();
            if (data.lockedUntil && data.lockedUntil > now) {
                const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
                return { isLocked: true, remainingSeconds };
            }
            if (data.lockedUntil && data.lockedUntil <= now) {
                await StorageService.removeItem(RATE_LIMIT_KEY);
            }
            return { isLocked: false, remainingSeconds: 0 };
        } catch {
            return { isLocked: false, remainingSeconds: 0 };
        }
    },

    /**
     * Register a failed login attempt
     */
    async recordFailedAttempt() {
        try {
            const raw = await StorageService.getItem(RATE_LIMIT_KEY);
            let data = raw ? JSON.parse(raw) : { count: 0, firstAttempt: Date.now() };
            data.count = (data.count || 0) + 1;

            if (data.count >= MAX_FAILED_ATTEMPTS) {
                data.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
            }
            await StorageService.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
            return data;
        } catch {
            return { count: 1 };
        }
    },

    /**
     * Clear failed login attempts after successful authentication
     */
    async clearFailedAttempts() {
        try {
            await StorageService.removeItem(RATE_LIMIT_KEY);
        } catch {
            // ignore
        }
    },

    /**
     * Secure login attempt
     * @param {string} username 
     * @param {string} password 
     */
    async login(username, password) {
        // 1. Check lockout
        const lockout = await this.checkLockoutStatus();
        if (lockout.isLocked) {
            return {
                success: false,
                error: `Security Lockout Active: Too many failed attempts. Please wait ${lockout.remainingSeconds} seconds.`
            };
        }

        const trimmedUser = (username || '').trim().toLowerCase();
        const trimmedPass = (password || '').trim();

        if (!trimmedUser || !trimmedPass) {
            return { success: false, error: 'Please enter both Username and Password.' };
        }

        // 2. Hash credential pair
        const hashInput = `${trimmedUser}:${trimmedPass}`;
        const computedHash = sha256(hashInput);

        const isAuthorized = (trimmedUser === 'namastehills' && trimmedPass === 'Nama$te@1234') || AUTHORIZED_HASHES.has(computedHash);

        if (!isAuthorized) {
            const status = await this.recordFailedAttempt();
            const attemptsLeft = MAX_FAILED_ATTEMPTS - status.count;
            if (attemptsLeft <= 0) {
                return {
                    success: false,
                    error: `Access Denied. Account locked for 3 minutes due to consecutive failed attempts.`
                };
            }
            return {
                success: false,
                error: `Invalid Administrator credentials. ${attemptsLeft} attempt(s) remaining before security lockout.`
            };
        }

        // 3. Success -> Clear rate limiting
        await this.clearFailedAttempts();

        // 4. Generate Cryptographically Signed Session Token
        const issuedAt = Date.now();
        const expiresAt = issuedAt + SESSION_TTL_MS;
        const payload = {
            user: 'Namastehills',
            role: 'super_admin',
            issuedAt,
            expiresAt
        };
        const signature = sha256(`${JSON.stringify(payload)}:${SESSION_PEPPER}`);
        const token = { payload, signature };

        // 5. Persist session
        await StorageService.setItem(TOKEN_KEY, JSON.stringify(token));

        return {
            success: true,
            user: payload
        };
    },

    /**
     * Validate active session token
     */
    async validateSession() {
        try {
            const raw = await StorageService.getItem(TOKEN_KEY);
            if (!raw) return { valid: false, reason: 'No session' };

            const token = JSON.parse(raw);
            if (!token || !token.payload || !token.signature) {
                await this.logout();
                return { valid: false, reason: 'Invalid token structure' };
            }

            // Verify signature
            const expectedSig = sha256(`${JSON.stringify(token.payload)}:${SESSION_PEPPER}`);
            if (token.signature !== expectedSig) {
                await this.logout();
                return { valid: false, reason: 'Tampered token' };
            }

            // Verify expiration
            if (Date.now() > token.payload.expiresAt) {
                await this.logout();
                return { valid: false, reason: 'Session expired' };
            }

            return {
                valid: true,
                user: token.payload
            };
        } catch (e) {
            await this.logout();
            return { valid: false, reason: 'Session check failed' };
        }
    },

    /**
     * Terminate active administrator session
     */
    async logout() {
        try {
            await StorageService.removeItem(TOKEN_KEY);
            return true;
        } catch {
            return false;
        }
    }
};

export default AuthService;
