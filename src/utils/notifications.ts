import { Notif } from "../types"
import { sleep } from "./photos"

export async function openNotifications(manual=false) {
  
  (!manual && chrome.tts.speak('DingDing', { gender: "female", lang: "en-GB" }))
    let { openPopupWinId } = await chrome.storage.session.get('openPopupWinId')
    if (openPopupWinId) {
      chrome.windows.update(openPopupWinId, {
        focused: true,
        drawAttention: true
      })
    } else {
      chrome.windows.create({
        top: 84,
        left: Number((await chrome.windows.getCurrent()).width - 18*16 - 32),
        width: 18*16 + 64,
        height: 300,
        type: 'popup',
        url: chrome.runtime.getURL('popup.html'),
      }).then(win => {
        chrome.storage.session.set({ openPopupWinId: win.id })
      })
    }
}


export async function createNotification(notifData: Partial<Notif>) {
  return await chrome.storage.local.get('notifications')
  .then(({ notifications }) => {
    notifications ??= []
    console.log("CHANGES", 1)
    if (notifications.findIndex((n:Notif) => n.id === notifData.id) !== -1) return;
    notifData.id ??= Date.now()+'err'

    chrome.notifications.create(notifData.id, {
      title: notifData.title,
      requireInteraction: true,
      type: 'basic',
      isClickable: true,
      iconUrl: '/img/logo-48.png',
      message: notifData.message,
      eventTime: new Date(notifData.timestamp).getTime(),
    }, console.log)

    notifications.push(notifData)
    chrome.storage.local.set({ notifications })
    return notifData
  })
}

export async function removeNotif(nId: string, sysClose=false) {
  if (!sysClose) chrome.notifications.clear(nId, console.log)
  return chrome.storage.local.get('notifications')
  .then(({ notifications }) => 
  chrome.storage.local
  .set({ notifications: notifications.filter((n: Notif) => n.id !== nId) }))
}