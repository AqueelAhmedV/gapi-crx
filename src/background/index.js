console.log('background is running')

import { bgCommandLookup } from "../utils/common"
import { photoDb } from "../utils/db"
import { checkNewMails } from "../utils/mail"
import { openNotifications, removeNotif } from "../utils/notifications"
import { 
  uploadImageUrlToPhotos, 
  base64toBlob, createAlbum, 
  batchAddPhotosToAlbum, syncAllAlbums } from "../utils/photos"

chrome.windows.onCreated.addListener((win) => {
  if (win.type !== 'popup' && win.state !== 'minimized')
  syncAllAlbums()
})

chrome.omnibox.onInputEntered.addListener((str, dis) => {
  console.log(dis)
  let command = str.split("/")[1].split(" ")[0]
  let args = str.split("/")[1].split(" ").slice(1).map(s => s.slice(1))
  if (!bgCommandLookup[command]) throw {err: "No such command/alias"}
  bgCommandLookup[command](args)
})

// chrome.runtime.onMessage.addListener((request, sender, sendResponse, response) => {
//   return new Promise(async (resolve, reject) => {
//     if (request.action === 'imageToBase64') {
//       try {
//         let base64String = await imageToBase64(request.imgUrl)
//         await sendResponse({ base64String })
//         resolve({ base64String })
//       } catch (err) {
//         reject(err)
//       }
//     }
//   })
// // })
// function base64toBlob(byteString, contentType='') {
//   // Create an ArrayBuffer to hold the binary data
//   const arrayBuffer = new ArrayBuffer(byteString.length);

//   // Create a typed array (UInt8Array) and fill it with the binary data
//   const uint8Array = new Uint8Array(arrayBuffer);
//   for (let i = 0; i < byteString.length; i++) {
//     uint8Array[i] = byteString.charCodeAt(i);
//   }

//   // Create a Blob using the ArrayBuffer and content type
//   return new Blob([arrayBuffer], { type: contentType });
// }

chrome.runtime.onMessage.addListener((msg, _sdr, sendResponse) => {
  if (msg.action === "countAlbumPhotos") {
    photoDb.countAlbumPhotos(msg.albumId).then((count) => {
      sendResponse({ data: count})
    })
    return true;
  } else if (msg.action === "batchUploadPhotos") {
    let { links, albumId } = msg.data
    batchAddPhotosToAlbum(links, albumId)
  } 
  // else if (msg.action === 'systemNotif') {
  // }
})

chrome.contextMenus.onClicked.addListener(async ({ srcUrl, mediaType, menuItemId, parentMenuItemId } , tab) => {
  if (menuItemId === "createAlbum") {
    chrome.tabs.sendMessage(tab.id, { action: "createAlbum" }, (res) => {
      console.log(res)
      createAlbum(res.newAlbumTitle)
      .then((msg) => {
        console.log("Created Album: ", msg)
        syncAllAlbums()
      })
    })
    
  } else if (menuItemId) {
    let albumId = ((parentMenuItemId === "addToAlbum") ? menuItemId : "")
    if (mediaType === "image") {
      chrome.tabs.sendMessage(tab.id, { imgSrc: srcUrl, action: 'imgTagToBlob' }, (res) => {
        console.log("Image Tag To Blob Response: ", res)
        if (res?.base64String) {
          uploadImageUrlToPhotos(base64toBlob(res.base64String, 'image/jpeg'), true, albumId)
          .then(console.log)
          .catch(console.log)
        } else if (res?.imageUrl) {
          uploadImageUrlToPhotos(res.imageUrl, false, albumId)
          .then(console.log).catch(console.log)
        } else {
          uploadImageUrlToPhotos(srcUrl, false, albumId)
          .then(console.log).catch(console.log)
        }
      })
      // 
    } else if (mediaType === 'video') {
      uploadImageUrlToPhotos(srcUrl, false, albumId)
      .then(console.log).catch(console.log)
    }
  }
  
})


function downloadBlobVideo(blobUrl) {
  // Create an anchor tag
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = 'downloaded_video.mp4'; // Specify the desired file name

  // Programmatically trigger a click on the anchor tag
  a.click();
}



chrome.contextMenus.create({
  title: "Upload to Photos",
  contexts: ['image', 'video'],
  id: "uploadToPhotos",
  type: 'normal'
});

chrome.contextMenus.create({
  title: "Add to Album (not functional)",
  id: "addToAlbum",
  type: "normal",
  contexts: ['image', 'video']
})

photoDb.listAlbums()
.then(albums => {
  albums.forEach((a) => {
    if (a.appCreated)
    chrome.contextMenus.create({
      title: a.title,
      contexts: ['image', 'video'],
      parentId: "addToAlbum",
      id: a.id,
    });
  })
})

chrome.storage.local.onChanged.addListener((changes) => {
  if ('albums' in changes) {
    Object.values(changes.albums.newValue ?? {}).forEach((a) => {
        if (a.appCreated)
        chrome.contextMenus.create({
          title: a.title,
          contexts: ['image', 'video'],
          parentId: "addToAlbum",
          id: a.id,
        });
    })
  } else if ('notifications' in changes) {
    let dn = changes.notifications.newValue?.length - changes.notifications.oldValue?.length
    if (dn <= 0) return;
    // console.log({ dn })
    // openNotifications()
  }
})


chrome.contextMenus.create({
  title: "Create Album..",
  contexts: ["image", 'video'],
  id: "createAlbum",
  parentId: 'addToAlbum',
  type: 'normal'
})




// chrome.runtime.onConnect.addListener(function(port) {
//   console.assert(port.name === "newTab");
//   console.log(`${port.name} connected`)
//   port.onMessage.addListener(function(msg) {
//     console.log(msg)
//     if (msg.action === 'imageToBase64') {
      
//     }
//   });
// });


chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "openSidePanel") {
      chrome.sidePanel.open({ tabId: tab.id })
  }
  if (command === "focusInput") {
    chrome.windows.create({
      type: 'popup',
      url: chrome.runtime.getURL('popup.html'),
      state: 'fullscreen'
    })
  }
})


chrome.windows.onRemoved.addListener((winId) => {
  chrome.storage.session.get('openPopupWinId')
  .then(({ openPopupWinId }) => {
    if (openPopupWinId === winId) {
      chrome.storage.session.remove('openPopupWinId')
    } 
  })
})

let gmailCheckInterval = setInterval(() => {
  checkNewMails()
}, 3*1000)

chrome.storage.sync.onChanged.addListener((changes) => {
  if ('mailSyncInterval' in changes) {
    clearInterval(gmailCheckInterval)
    console.log('mailCheckInterval changed')
    gmailCheckInterval = setInterval(() => {
      checkNewMails()
    }, parseInt(changes.mailSyncInterval.newValue+'')*1000)
  }
})

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  chrome.tabs.get(tabId)
  .then((tab) => {
    if (!tab?.url) return;
    chrome.storage.sync.set({ mailSyncInterval: 3 })
  })
  // implement setPref
  
})


chrome.notifications.onClicked.addListener((nId) => {
  openNotifications(true)
})



chrome.notifications.onClosed.addListener((nId, byUser) => {
  if (!byUser) return;
  console.log("Close")
  removeNotif(nId, true)
})