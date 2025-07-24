
'use client';

import * as React from 'react';

// This script is injected into the <head> of the page to prevent a flash of unstyled content (FOUC)
// when the user has a theme preference set in localStorage that differs from the default.
const script = `
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Failed to set theme from localStorage', e);
    }
  })();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
