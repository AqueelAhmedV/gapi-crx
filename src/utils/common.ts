// @ts-nocheck

export function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

import { logoutUser } from './auth';
import { photoDb } from './db'
import { openNotifications } from "./notifications";


export const bgCommandLookup = {
  exit: () => {
    chrome.windows.getCurrent(win => chrome.windows.remove(win.id))
  },
  refresh: () => {
    chrome.runtime.reload()
  },
  
  notifs: () => {
    openNotifications(true)
  },
  album: async ([str, ...params]) => {
      let albums = await photoDb.listAlbums()
      // override and append options?
      let foundAlbums = albums.filter((a) => a.title.toLowerCase().includes(str.replaceAll("_", " ").toLowerCase()))
      await chrome.storage.sync.set({ photoFilter: {
          albums: foundAlbums.map(a => a.id)
      } })
  },
  setPref: async ([storageArea, key, val, ...params]) => {
    if (!['local', 'sync', 'session'].includes(storageArea))
        throw {err: 'invalid storage area' }
    if (!key || !val) throw {err: 'invalid key or value'}
    await chrome.storage[storageArea].set({ [key]: val })
  },
  removePref: async ([storageArea, key, ...params]) => {
      if (!key) throw {err: "invalid key"}
      await chrome.storage[storageArea].remove(key)
  },
  unsync: async ([option, ...params]) => {
    if (option === 'media')
      await chrome.storage.local.remove(['photos', 'albums'])
  },
  purge: async ([option, ...params]) => {
    await logoutUser()
    localStorage.clear()
    sessionStorage.clear()
    await chrome.storage.sync.clear()
    await chrome.storage.local.clear()
    await chrome.storage.session.clear()
  }
}

