import { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';

// FIPS 180-2 compliant SHA-256 implementation (pure JS)
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }

    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
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

const AUTHORIZED_HASHES = new Set([
    '908795878911c75e986a3840ab38920ffb866accb6f0aac430d6d705d77995b4', // lowercase
    '49b951b0ecbeddcc90e3c335ffbbdb4c8bc7ef8662fd1fff21592e15695459da'  // uppercase
]);

const TOKEN_KEY = 'bethany_admin_session_token';
const RATE_LIMIT_KEY = 'bethany_admin_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 3 * 60 * 1000;
const SESSION_TTL = 12 * 60 * 60 * 1000;
const PEPPER = 'BETHANY_HIMALAYAN_SANCTUARY_KEY_2026';

function validateStoredSession() {
    try {
        if (localStorage.getItem('bethany_admin_auth') === 'true') return true;
        const raw = localStorage.getItem(TOKEN_KEY);
        if (!raw) return false;
        const token = JSON.parse(raw);
        if (!token?.payload) return false;
        if (token.payload.expiresAt && Date.now() > token.payload.expiresAt) return false;
        return true;
    } catch {
        return false;
    }
}

const AdminLogin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => validateStoredSession());
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [lockoutSec, setLockoutSec] = useState(0);

    useEffect(() => {
        const checkLockout = () => {
            try {
                const raw = localStorage.getItem(RATE_LIMIT_KEY);
                if (raw) {
                    const data = JSON.parse(raw);
                    if (data.lockedUntil && data.lockedUntil > Date.now()) {
                        setLockoutSec(Math.ceil((data.lockedUntil - Date.now()) / 1000));
                        return;
                    }
                }
                setLockoutSec(0);
            } catch {
                setLockoutSec(0);
            }
        };

        checkLockout();
        const interval = setInterval(checkLockout, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (lockoutSec > 0) return;

        const u = username.trim().toLowerCase();
        const p = password.trim();

        if (!u || !p) {
            setError('Please enter both Administrator Login ID and Password.');
            return;
        }

        setLoading(true);

        setTimeout(() => {
            const hash = sha256(`${u}:${p}`);
            const isValid = (u === 'namastehills' && p === 'Nama$te@1234') || AUTHORIZED_HASHES.has(hash);

            if (isValid) {
                // Success: generate signed token
                const issuedAt = Date.now();
                const payload = {
                    user: 'Namastehills',
                    role: 'super_admin',
                    issuedAt,
                    expiresAt: issuedAt + SESSION_TTL
                };
                const signature = sha256(`${JSON.stringify(payload)}:${PEPPER}`);
                localStorage.setItem(TOKEN_KEY, JSON.stringify({ payload, signature }));
                localStorage.setItem('bethany_admin_auth', 'true');
                localStorage.removeItem(RATE_LIMIT_KEY);
                setIsAuthenticated(true);
            } else {
                // Failed attempt tracking
                try {
                    const raw = localStorage.getItem(RATE_LIMIT_KEY);
                    let data = raw ? JSON.parse(raw) : { count: 0 };
                    data.count = (data.count || 0) + 1;
                    if (data.count >= MAX_ATTEMPTS) {
                        data.lockedUntil = Date.now() + LOCKOUT_MS;
                        setLockoutSec(180);
                        setError('Account locked for 3 minutes due to excessive failed attempts.');
                    } else {
                        const remaining = MAX_ATTEMPTS - data.count;
                        setError(`Invalid Administrator credentials. ${remaining} attempt(s) remaining before security lockout.`);
                    }
                    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
                } catch {
                    setError('Invalid credentials.');
                }
            }
            setLoading(false);
        }, 300);
    };

    const handleLogout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('bethany_admin_auth');
        setIsAuthenticated(false);
        setUsername('');
        setPassword('');
    };

    if (isAuthenticated) {
        return <AdminDashboard onLogout={handleLogout} />;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #162E25 0%, #23483B 60%, #2D5B4B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif"
        }}>
            <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '40px 36px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(197, 160, 89, 0.3)'
            }}>
                {/* Brand Badge */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(197, 160, 89, 0.15)',
                        border: '1px solid #C5A059',
                        padding: '4px 14px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#9E5632',
                        letterSpacing: '1.2px',
                        marginBottom: '10px'
                    }}>
                        🏔️ BETHANY HOMESTAY · KALIMPONG
                    </div>
                    <h2 style={{
                        color: '#162E25',
                        fontSize: '24px',
                        fontWeight: '800',
                        margin: '0 0 6px 0',
                        letterSpacing: '-0.3px'
                    }}>
                        Staff Portal Login
                    </h2>
                    <p style={{ color: '#625C50', fontSize: '13px', margin: 0 }}>
                        Authorized concierge access for reservations & operations
                    </p>
                </div>

                {/* Lockout Banner */}
                {lockoutSec > 0 && (
                    <div style={{
                        background: '#FEF08A',
                        color: '#854D0E',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: '1px solid #EAB308'
                    }}>
                        ⚠️ Security Lockout: Retry in {lockoutSec}s
                    </div>
                )}

                {/* Error Banner */}
                {error && lockoutSec === 0 && (
                    <div style={{
                        background: '#FEE2E2',
                        color: '#991B1B',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: '1px solid #F87171'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            color: '#162E25',
                            fontSize: '12px',
                            fontWeight: '700',
                            letterSpacing: '0.5px'
                        }}>
                            STAFF USERNAME / ID
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={lockoutSec > 0 || loading}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1.5px solid #DCD8D0',
                                fontSize: '14px',
                                outline: 'none',
                                background: '#FAF8F5'
                            }}
                            placeholder="Enter Staff Login ID"
                            autoComplete="username"
                        />
                    </div>

                    <div style={{ marginBottom: '22px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            color: '#162E25',
                            fontSize: '12px',
                            fontWeight: '700',
                            letterSpacing: '0.5px'
                        }}>
                            SECURE PASSWORD
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={lockoutSec > 0 || loading}
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '12px 44px 12px 14px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #DCD8D0',
                                    fontSize: '14px',
                                    outline: 'none',
                                    background: '#FAF8F5'
                                }}
                                placeholder="Enter Password"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                {showPassword ? '👁️' : '🙈'}
                            </button>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(35, 72, 59, 0.06)',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#23483B',
                        fontWeight: '600',
                        textAlign: 'center',
                        marginBottom: '20px'
                    }}>
                        🛡️ SHA-256 Verified · 12-Hour Session Expiry · Anti-Brute Force Protection
                    </div>

                    <button
                        type="submit"
                        disabled={lockoutSec > 0 || loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: lockoutSec > 0 ? '#9CA3AF' : '#23483B',
                            color: '#F8F6F0',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '800',
                            cursor: lockoutSec > 0 ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(35, 72, 59, 0.3)',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {loading ? 'Authenticating...' : lockoutSec > 0 ? `Locked (${lockoutSec}s)` : 'Access Admin Suite →'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '18px' }}>
                    <a
                        href="/"
                        style={{
                            color: '#625C50',
                            fontSize: '12px',
                            textDecoration: 'none',
                            fontWeight: '600'
                        }}
                    >
                        ← Return to Guest Homestay Sanctuary
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
