# Google APIs Required for Markitbot

This document lists all Google APIs used in the project and how to obtain credentials.

## PageSpeed Insights API

**Used in:** `src/server/services/seo-auditor.ts`

**Purpose:** Audit page performance, accessibility, SEO, and best practices

**How to get the API key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Library**
4. Search for "PageSpeed Insights API" and enable it
5. Go to **APIs & Services** > **Credentials**
6. Click **Create Credentials** > **API Key**
7. Copy the key and add to `.env.local`:
   
```
   GOOGLE_PAGESPEED_API_KEY=your_api_key_here
   
```

---

## Google Search Console API

**Used in:** `src/server/services/growth/search-console.ts`

**Purpose:** Get search analytics data, URL inspection

**How to set up:**
1. Enable "Search Console API" in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Configure consent screen
4. Store credentials securely (not in env vars for OAuth)

---

## Google Analytics Data API (GA4)

**Used in:** `src/server/services/growth/google-analytics.ts`

**Purpose:** Fetch analytics data for reporting

**How to set up:**
1. Enable "Google Analytics Data API" 
2. Create Service Account or OAuth credentials
3. Add service account to Google Analytics with Viewer permissions

---

## Google Sheets API

**Used in:** `src/server/services/sheets/service.ts`

**Purpose:** Read/write Google Sheets for data export

**How to set up:**
1. Enable "Google Sheets API"
2. Create OAuth 2.0 credentials
3. Configure redirect URIs

---

## Google Drive API

**Used in:** `src/server/services/drive/service.ts`

**Purpose:** Create and manage Google Drive files

**How to set up:**
1. Enable "Google Drive API"
2. Create OAuth credentials

---

## Gmail API

**Used in:** `src/server/integrations/gmail/send.ts`

**Purpose:** Send emails via Gmail

**How to set up:**
1. Enable "Gmail API"
2. Create OAuth 2.0 credentials
3. Configure consent screen with required scopes

---

## Google Calendar API

**Used in:** `src/server/tools/calendar.ts`

**Purpose:** Manage calendar events

**How to set up:**
1. Enable "Google Calendar API"
2. Create OAuth credentials

---

## Quick Setup for Local Development

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable all required APIs:
   - PageSpeed Insights API
   - Search Console API
   - Google Analytics Data API
   - Google Sheets API
   - Google Drive API
   - Gmail API
   - Google Calendar API
4. Create API Key (for PageSpeed)
5. Create OAuth 2.0 Client ID (for other services)
6. Add to `.env.local`:
   
```
   GOOGLE_PAGESPEED_API_KEY=your_api_key
