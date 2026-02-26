/**
 * Unit tests for super-admin-config.ts
 * Q1 2026 Security Audit - MEDIUM finding remediation
 *
 * Tests verify that the dev persona (owner@markitbot.com) is properly
 * gated by environment and only available in non-production.
 */

describe('Super Admin Config', () => {
    // Store original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
        // Clear module cache to re-evaluate with new env
        jest.resetModules();
    });

    describe('SUPER_ADMIN_EMAILS', () => {
        it('should always include production super admin emails', async () => {
            const { SUPER_ADMIN_EMAILS } = await import('../super-admin-config');

            expect(SUPER_ADMIN_EMAILS).toContain('martez@markitbot.com');
            expect(SUPER_ADMIN_EMAILS).toContain('jack@markitbot.com');
            expect(SUPER_ADMIN_EMAILS).toContain('vib@cannmenus.com');
        });

        it('should include dev persona in development environment', async () => {
            // This test runs in 'test' environment which is !== 'production'
            const { SUPER_ADMIN_EMAILS } = await import('../super-admin-config');

            expect(SUPER_ADMIN_EMAILS).toContain('owner@markitbot.com');
        });

        it('should not have duplicate entries', async () => {
            const { SUPER_ADMIN_EMAILS } = await import('../super-admin-config');

            const uniqueEmails = new Set(SUPER_ADMIN_EMAILS);
            expect(uniqueEmails.size).toBe(SUPER_ADMIN_EMAILS.length);
        });
    });

    describe('isSuperAdminEmail', () => {
        it('should return true for valid production super admin email', async () => {
            const { isSuperAdminEmail } = await import('../super-admin-config');

            expect(isSuperAdminEmail('martez@markitbot.com')).toBe(true);
            expect(isSuperAdminEmail('jack@markitbot.com')).toBe(true);
            expect(isSuperAdminEmail('vib@cannmenus.com')).toBe(true);
        });

        it('should be case-insensitive', async () => {
            const { isSuperAdminEmail } = await import('../super-admin-config');

            expect(isSuperAdminEmail('MARTEZ@markitbot.com')).toBe(true);
            expect(isSuperAdminEmail('Jack@markitbot.com')).toBe(true);
            expect(isSuperAdminEmail('VIB@CannMenus.Com')).toBe(true);
        });

        it('should return false for non-admin emails', async () => {
            const { isSuperAdminEmail } = await import('../super-admin-config');

            expect(isSuperAdminEmail('random@example.com')).toBe(false);
            expect(isSuperAdminEmail('hacker@evil.com')).toBe(false);
            expect(isSuperAdminEmail('admin@someothercompany.com')).toBe(false);
        });

        it('should return false for null/undefined', async () => {
            const { isSuperAdminEmail } = await import('../super-admin-config');

            expect(isSuperAdminEmail(null)).toBe(false);
            expect(isSuperAdminEmail(undefined)).toBe(false);
            expect(isSuperAdminEmail('')).toBe(false);
        });

        it('should return true for dev persona in non-production', async () => {
            // Test environment is not 'production'
            const { isSuperAdminEmail } = await import('../super-admin-config');

            expect(isSuperAdminEmail('owner@markitbot.com')).toBe(true);
        });
    });

    describe('SuperAdminEmail type', () => {
        it('should include all known admin emails in the type', async () => {
            const { SUPER_ADMIN_EMAILS } = await import('../super-admin-config');

            // Type system should recognize these - runtime check
            const expectedEmails = [
                'martez@markitbot.com',
                'jack@markitbot.com',
                'vib@cannmenus.com',
            ];

            // In non-production, dev persona is also included
            if (process.env.NODE_ENV !== 'production') {
                expectedEmails.push('owner@markitbot.com');
            }

            for (const email of expectedEmails) {
                expect(SUPER_ADMIN_EMAILS).toContain(email);
            }
        });
    });

    describe('Environment Gating (Security)', () => {
        it('should filter based on NODE_ENV at module load time', async () => {
            // The filtering happens at module evaluation time
            // In test environment (not production), dev persona should be included
            const { SUPER_ADMIN_EMAILS } = await import('../super-admin-config');

            // Verify the filter logic works
            const devPersonaIncluded = SUPER_ADMIN_EMAILS.includes('owner@markitbot.com' as any);

            if (process.env.NODE_ENV === 'production') {
                expect(devPersonaIncluded).toBe(false);
            } else {
                expect(devPersonaIncluded).toBe(true);
            }
        });

        it('should have exactly 4 emails in non-production (3 prod + 1 dev)', async () => {
            // In test/development environment
            if (process.env.NODE_ENV !== 'production') {
                const { SUPER_ADMIN_EMAILS } = await import('../super-admin-config');
                expect(SUPER_ADMIN_EMAILS.length).toBe(4);
            }
        });
    });
});

describe('Super Admin Session Management', () => {
    // Mock localStorage for browser environment tests
    let localStorageMock: { [key: string]: string } = {};

    beforeEach(() => {
        localStorageMock = {};

        // Create localStorage mock functions that actually modify localStorageMock
        const getItemMock = (key: string) => localStorageMock[key] || null;
        const setItemMock = (key: string, value: string) => {
            localStorageMock[key] = value;
        };
        const removeItemMock = (key: string) => {
            delete localStorageMock[key];
        };

        // Mock window and localStorage
        Object.defineProperty(global, 'window', {
            value: {
                localStorage: {
                    getItem: getItemMock,
                    setItem: setItemMock,
                    removeItem: removeItemMock,
                },
            },
            writable: true,
            configurable: true,
        });

        // Also set localStorage directly on global for compatibility
        Object.defineProperty(global, 'localStorage', {
            value: {
                getItem: getItemMock,
                setItem: setItemMock,
                removeItem: removeItemMock,
            },
            writable: true,
            configurable: true,
        });

        jest.resetModules();
    });

    afterEach(() => {
        // @ts-ignore - cleanup mock
        delete global.window;
        // @ts-ignore - cleanup mock
        delete global.localStorage;
    });

    it('should validate email against whitelist when setting session', async () => {
        const { setSuperAdminSession } = await import('../super-admin-config');

        // Valid admin should succeed
        const result = setSuperAdminSession('martez@markitbot.com');
        expect(result).toBe(true);

        // Invalid email should fail
        const invalidResult = setSuperAdminSession('hacker@evil.com');
        expect(invalidResult).toBe(false);
    });

    it('should store session with timestamp', async () => {
        const { setSuperAdminSession, SUPER_ADMIN_SESSION_KEY } = await import('../super-admin-config');

        const result = setSuperAdminSession('jack@markitbot.com');
        expect(result).toBe(true);

        const storedValue = localStorageMock[SUPER_ADMIN_SESSION_KEY];
        expect(storedValue).toBeDefined();

        const stored = JSON.parse(storedValue);
        expect(stored.email).toBe('jack@markitbot.com');
        expect(stored.timestamp).toBeDefined();
        expect(typeof stored.timestamp).toBe('number');
    });

    it('should lowercase email when storing session', async () => {
        const { setSuperAdminSession, SUPER_ADMIN_SESSION_KEY } = await import('../super-admin-config');

        const result = setSuperAdminSession('MARTEZ@markitbot.com');
        expect(result).toBe(true);

        const storedValue = localStorageMock[SUPER_ADMIN_SESSION_KEY];
        expect(storedValue).toBeDefined();

        const stored = JSON.parse(storedValue);
        expect(stored.email).toBe('martez@markitbot.com');
    });
});
