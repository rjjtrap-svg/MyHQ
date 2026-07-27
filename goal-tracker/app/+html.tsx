import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
// If your production domain changes (custom domain, new Vercel project, etc.), update this
// so the Open Graph tags below point at a real, absolute image URL — most link-preview
// scrapers (iMessage, Slack, etc.) require an absolute og:image, a relative path won't work.
const SITE_URL = 'https://goal-tracker-nu-beige.vercel.app';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>Goal Tracker</title>
        <meta name="description" content="Track sales, hit goals, and coach your team with AI." />

        {/* Makes "Add to Home Screen" open in its own standalone window (no Safari chrome)
            with a real name/icon instead of a plain bookmark. */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0E1014" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Goal Tracker" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/icon-192.png" />

        {/* Open Graph / link-preview "cover photo" — shown when the app's link is pasted
            into iMessage, Slack, etc. */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Goal Tracker" />
        <meta property="og:description" content="Track sales, hit goals, and coach your team with AI." />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/og-cover.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE_URL}/og-cover.png`} />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #0E1014;
}`;
