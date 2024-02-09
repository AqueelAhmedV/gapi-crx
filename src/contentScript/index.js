import { photoDb } from "../utils/db";



  function imgTagToBase64(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    return canvas.toDataURL('image/jpeg').split(',')[1]
  }
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'imgTagToBlob') {
      let img = document.querySelector(`img[srcset*="${msg.imgSrc}"]`)
      img ??= document.querySelector(`img[src="${msg.imgSrc}"]`)
      // img.setAttribute('crossorigin', 'anonymous')
      if (img.hasAttribute('srcset')) {
        console.log(img.getAttribute('srcset'))
        let maxResUrl = img.getAttribute('srcset').split(',')[0].split(' ')[0]
        console.log(img.getAttribute('srcset').split(',')[0])
        sendResponse({ imageUrl: maxResUrl })
      } else {
        try {
          let base64String = imgTagToBase64(img)
          sendResponse({ base64String})
        } catch (err) {
          console.log(err)
          sendResponse({ imageUrl: msg.imgSrc })
        }
        
      }
      
      return true;
    } else if (msg.action === "createAlbum") {
      let newAlbumTitle = prompt("Enter Album Title: ")
      sendResponse({ newAlbumTitle })
      return true;
    } 
  })



 