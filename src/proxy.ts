import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCorsHeaders, CORS_PREFLIGHT_HEADERS, isOriginAllowed } from './lib/cors';

/**
 * Proxy for route protection, authentication, CORS, CSRF, and custom domain routing.
 * This runs on the Edge runtime before the request reaches the page.
 *
 * Subdomain Routing (brand.markitbot.com):
 * - Extracts subdomain from *.markitbot.com hostnames
 * - Rewrites to /{subdomain} to serve brand storefront
 *
 * Custom Domain Routing (mybrand.com):
 * - Checks if hostname is a custom domain (not markitbot.com or localhost)
 * - Looks up tenant via API call to avoid Firestore in Edge runtime
 * - Rewrites request to /{tenantId} or /dispensaries/{tenantId}
 *
 * Note: CSRF validation is handled in API routes using the csrf middleware
 * because Edge runtime doesn't support the 'crypto' module needed for validation.
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get('origin');
    // Use x-forwarded-host in cloud environments (Firebase/Cloud Run), fall back to host
    const hostname = request.headers.get('x-forwarded-host')
        || request.headers.get('host')
        || '';

    // ============================
    // SUBDOMAIN ROUTING (*.markitbot.com)
    // ============================
    // Check for subdomains like ecstaticedibles.markitbot.com
    const bakedBotDomains = ['markitbot.com', 'makeitbot.com', 'markitbot.dev', 'localhost:9000'];
    const isBakedBotDomain = bakedBotDomains.some(d => hostname.includes(d));

    if (isBakedBotDomain) {
        // Extract subdomain (e.g., "ecstaticedibles" from "ecstaticedibles.markitbot.com")
        const hostParts = hostname.split('.');

        // Check if this is a subdomain (not just "markitbot.com" or "www.markitbot.com")
        // For localhost, check for subdomain.localhost:port pattern
        const isLocalhost = hostname.includes('localhost');
        const hasSubdomain = isLocalhost
            ? hostParts[0] !== 'localhost' && hostParts.length > 1
            : hostParts.length > 2 && hostParts[0] !== 'www';

        if (hasSubdomain) {
            const subdomain = hostParts[0].toLowerCase();

            // Skip reserved subdomains
            const reservedSubdomains = ['www', 'api', 'app', 'dashboard', 'admin', 'mail', 'cdn', 'static'];
            if (!reservedSubdomains.includes(subdomain)) {
                // For subdomain requests, resolve to the brand's storefront
                // If hitting root, rewrite to /{subdomain}
                if (pathname === '/') {
                    const url = request.nextUrl.clone();
                    url.pathname = `/${subdomain}`;
                    return NextResponse.rewrite(url);
                }

                // For other paths, rewrite with subdomain prefix if not already prefixed
                // This allows ecstaticedibles.markitbot.com/products to work
                if (!pathname.startsWith(`/${subdomain}`)) {
                    const url = request.nextUrl.clone();
                    url.pathname = `/${subdomain}${pathname}`;
                    return NextResponse.rewrite(url);
                }

                // Pass through with subdomain header for tracking
                const response = NextResponse.next();
                response.headers.set('x-subdomain', subdomain);
                return response;
            }
        }
    }

    // ============================
    // CUSTOM DOMAIN ROUTING (mybrand.com)
    // ============================
    // Check if this is a custom domain request (not markitbot.com, localhost, or hosting domains)
    const isCustomDomain =
        !hostname.includes('markitbot.com') &&
        !hostname.includes('makeitbot.com') &&
        !hostname.includes('localhost') &&
        !hostname.includes('127.0.0.1') &&
        !hostname.includes('firebaseapp.com') &&
        !hostname.includes('hosted.app') &&
        !hostname.includes('web.app') &&
        !hostname.includes('appspot.com') &&
        hostname.includes('.'); // Has a dot = is a domain

    if (isCustomDomain && pathname === '/') {
        // For custom domains hitting root path, we need to look up the tenant
        // We can't use Firestore in Edge, so we call an internal API
        try {
            const protocol = request.headers.get('x-forwarded-proto') || 'https';
            const internalHost = request.headers.get('host') || hostname;
            const resolveUrl = `${protocol}://${internalHost}/api/domain/resolve`;

            const resolveResponse = await fetch(resolveUrl, {
                headers: {
                    'x-resolve-hostname': hostname,
                    'x-resolve-path': pathname,
                },
            });

            if (resolveResponse.ok) {
                const data = await resolveResponse.json();
                if (data.success && data.path) {
                    // Rewrite to the resolved path
                    const url = request.nextUrl.clone();
                    url.pathname = data.path;
                    return NextResponse.rewrite(url);
                }
            }

            // If resolution failed, stay on current host and show local 404 page
            const url = request.nextUrl.clone();
            url.pathname = '/404';
            return NextResponse.rewrite(url);
        } catch (error) {
            console.error('[Proxy] Custom domain resolution failed:', error);
            const url = request.nextUrl.clone();
            url.pathname = '/404';
            return NextResponse.rewrite(url);
        }
    }

    // For custom domains on other paths, pass through with hostname header
    if (isCustomDomain) {
        const response = NextResponse.next();
        response.headers.set('x-custom-domain', hostname);
        return response;
    }

    // Handle CORS preflight requests for API routes
    if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
        if (isOriginAllowed(origin)) {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    ...getCorsHeaders(origin),
                    ...CORS_PREFLIGHT_HEADERS,
                },
            });
        }
        // Reject CORS preflight from unauthorized origins
        return new NextResponse(null, { status: 403 });
    }

    // Get session cookie
    const sessionCookie = request.cookies.get('__session');

    // Define protected routes
    const isDashboardRoute = pathname.startsWith('/dashboard');
    const isAccountRoute = pathname.startsWith('/account');
    const isOnboardingRoute = pathname === '/onboarding';
    const isProtectedRoute = isDashboardRoute || isAccountRoute || isOnboardingRoute;

    // Allow public routes
    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    // ⚠️ AUTHENTICATION DISABLED: Bypassing login redirects
    // Allow ALL access to protected routes without session cookie
    // Previously redirected to login pages, now allowing direct access

    // Handle CORS preflight for API routes
    if (pathname.startsWith('/api/')) {
        const response = NextResponse.next();
        const corsHeaders = getCorsHeaders(origin);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    return NextResponse.next();
}

// Configure which routes the proxy should run on
export const config = {
    matcher: [
        // Subdomain and custom domain routing - match all paths
        '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
};

