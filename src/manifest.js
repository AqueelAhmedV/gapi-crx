import { defineManifest } from '@crxjs/vite-plugin'
import packageData from '../package.json' assert { type: 'json' }

export default defineManifest({
  name: packageData.displayName,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-34.png',
    48: 'img/logo-48.png',
    128: 'img/logo-128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/logo-48.png',
  },
  options_page: 'options.html',
  devtools_page: 'devtools.html',
  background: {
    service_worker: 'src/background/index.js',
    type: 'module',
  },
  side_panel: {
    default_path: 'sidepanel.html',
  },
  web_accessible_resources: [
    {
      resources: [
        'img/logo-16.png', 
        'img/logo-34.png', 
        'img/logo-48.png', 
        'img/logo-128.png',
        'icons/logo.svg'
      ],
      matches: [],
    },
  ],
  permissions: [
    'activeTab', 
    'commands',
    'bookmarks',
    'history', 
    'search',
    'tts',
    'sidePanel', 
    'storage', 
    'identity', 
    'contextMenus', 
    'webNavigation',
    'identity.email',
    'tabCapture',
    'cookies',
    'unlimitedStorage',
    'webRequest',
    'declarativeNetRequest',
    'notifications'
  ],
  chrome_url_overrides: {
    newtab: 'newtab.html',
  },
  // devtools_page: 'devtools.html',
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0r5lGYOZzOXQBRtVJYSoIRemgYI25XvhmHBUOCh5zDh38hfl0OmBzMrBGXpjinmg5rvmTkDwTg04zNdvEB6UQTs3LzsMCpdJS+8WtPYFqqOVGoMvchCa1UYbzXsD99PZh16GxurbWT+uDo3Yzn3FLG77S4KmwRJH5zepmNLIWXKzmFjJsYFI8Y3RWqS0qWP/OwB88fShIJ88qIqk24vb5tvxQf38tXSkJH7Bdyd/BWZEOPESQv81SUtyO4ZdnNYEyO7T3d+C2z+NruDwiTRXW80Sj7053PAghKRQvVR30dlBwLVe7Sd7kv6uajYSvLRggqX8Xn+KwZ4c1BtdSWm9LwIDAQAB',
  oauth2: {
    client_id: '534299632770-12eo94vdhg2v0ap738occ6r31clhd4es.apps.googleusercontent.com',
    scopes: [
      'https://www.googleapis.com/auth/photoslibrary',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ], 
  },
  omnibox: { "keyword" : "/" },
  commands: {
    focusInput: {
      "suggested_key": {
        "default": "Ctrl+Q",
        "mac": "Command+Q"
      },
      "description": "Focus search bar or command input on newtab"
    },
    openSidePanel: {
      "suggested_key": {
        "default": "Alt+Q",
        "mac": "Alt+Q"
      },
      "description": "Open side panel"
    }
  }
})
