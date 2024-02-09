import axios from 'axios'
import { getUserAuthToken, logoutUser } from './auth'
import { photoDb } from './db'
import { GPHOTOS_BASE } from './constants'

import { Album, Photo, PhotoFilter } from '../types'
import { SetStateAction, Dispatch } from 'react'

export async function setWallpaper(imgUrl: string) {
      let activeTab = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })
      console.log(activeTab)
      await chrome.tabs.sendMessage(activeTab[0].id, {
        action: 'setWallpaper',
        data: imgUrl
      })
}

export async function createAlbum(albumTitle: string) {
  try {
    let { authToken } = await getUserAuthToken()
    return fetch("https://photoslibrary.googleapis.com/v1/albums", {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({album: { title: albumTitle }})
    }).then(res => res.text())
  } catch (err) { 
    console.log(albumTitle + " Album create error", err)
  }
}

export async function syncAllPhotos() {
    try {
        const { authToken } = await getUserAuthToken()
        console.log(authToken)
        let res = await axios.get(`${GPHOTOS_BASE}/mediaItems?pageSize=100`, {
            headers: {
                Authorization: `Bearer ${authToken}`
            },
            
        })
        console.log(res)
        return { msg: "All photos synced", status: "sync_success" }
    } catch (err) {
        console.log(err)
        if (err.response.status === 401)
            logoutUser().then(console.log).catch(console.log)
        return err
    }
}

export async function batchGetMediaItems(photosIds: string[]) {
  let idQuery = '?'
  photosIds.forEach((id, i) => {
    if (i !== 0) {
      idQuery += ('&mediaItemIds=' + id)
    } else {
      idQuery += ('mediaItemIds=' + id)
    }
  })

  let { authToken } = await getUserAuthToken()

  let {data: {mediaItemResults}} = await axios.get(`${GPHOTOS_BASE}/mediaItems:batchGet${idQuery}`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  })
  return mediaItemResults.map(m => m.mediaItem)
}


// COMPLETE FOR `pageSize > 50` similar to `fetchAlbumPhotos`
export async function syncAllAlbums() {
  try {
    const { authToken } = await getUserAuthToken() // check EXPIRY inside
    let headers = {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
    let allAlbums = [];
    let albums: any[], nextPageToken: string;
    console.log("Here");
    do {
      await sleep(1);
      let queryStr = 'pageSize=50';
      try {
      if (nextPageToken) queryStr += `&pageToken=${nextPageToken}`;
      ({ albums, nextPageToken } = await fetch(`${GPHOTOS_BASE}/albums?${queryStr}`, {
        headers,
        method: 'GET'
      }).then(r => r.json()));
      if (Array.isArray(albums)) {
        console.log("ONCE", nextPageToken)
        allAlbums =  allAlbums.concat(albums.map((a) => (
          {
            itemCount: parseInt(a.mediaItemsCount),
            id: a.id, 
            title: a.title, 
            coverPhotoBaseUrl: a.coverPhotoBaseUrl,
            appCreated: Boolean(a?.isWriteable),
            productUrl: a.productUrl
          })))
          console.log(allAlbums)
      }
      } catch (err) {
        console.log('SyncAllAlbums err: ', err)
      }
    } while (!!nextPageToken);

    await photoDb.batchCreateAlbums(allAlbums)
    console.log(`Sync albums success`, allAlbums)
    return { albums: allAlbums }
  } catch (err) {
      console.log(err)
  }
}

export function sleep(seconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(1)
        }, seconds*1000)
    })
}

function mediaItemsToPhotos(mediaItems): Photo[] {  

  return mediaItems.map((m) => {
      return { 
        id: m.id, 
        title: m.filename,
        metadata: {
           width: Number(m.mediaMetadata.width),
           height: Number(m.mediaMetadata.height),
           creationTime: new Date(m.mediaMetadata.creationTime)
        },
        mimeType: m.mimeType,
        productUrl: m.productUrl
    }})
}


export async function syncAlbumPhotos(album: Album, setCount: Dispatch<SetStateAction<number>> = () => {}) {
    try {
        const { authToken } = await getUserAuthToken() // check EXPIRY inside
        console.log("Here")
        let { data: { mediaItems, nextPageToken } } = await axios.post(`${GPHOTOS_BASE}/mediaItems:search?pageSize=100&albumId=${album.id}`,{},
        {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        })
        console.log("there")
        if (Array.isArray(mediaItems)) {
          await photoDb.batchAddPhotosOfAlbum(album.id, mediaItemsToPhotos(mediaItems))
          setCount(mediaItems.length)
        } else throw { msg: "syncAlbumPhotos error", albumTitle: album.title}
        while (!!nextPageToken) {
            console.log("once")
            await sleep(1)
            try {
            let res = await axios.post(`${GPHOTOS_BASE}/mediaItems:search?pageSize=100&albumId=${album.id}&pageToken=${nextPageToken}`, {},
            {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            })
            console.log(res.data)
            if (Array.isArray(res.data?.mediaItems)) {
              await photoDb.batchAddPhotosOfAlbum(album.id, mediaItemsToPhotos(res.data.mediaItems))
              setCount(prev => prev + res.data.mediaItems.length)
            } else throw { msg: "syncAlbumPhotos while error", albumTitle: album.title, nextPageToken}
            nextPageToken = res.data.nextPageToken
            } catch (err) {
                console.log(err)
            }
        }
        console.log("whilend")
        console.log(`Added ${mediaItems.length} photo(s) to ${album.title}`)
    } catch (err) {
        console.log(err)
    }
}

export async function syncAllAlbumPhotos() {
    let albums = await photoDb.listAlbums()
    console.log(`Total ${albums.length} album(s)`)
    for (let a of albums) {
        await syncAlbumPhotos(a)
    } 
}

export async function getPhotoById(photoId: string): Promise<Photo | unknown> {
  let photo = await photoDb.findPhotoById(photoId)
  console.log("Phere")
  if (photo) return photo;
  console.log("Qhere")
  let { authToken } = await getUserAuthToken()
  photo = await axios.get(`${GPHOTOS_BASE}/mediaItems/${photoId}`, {
    headers: {
        Authorization: `Bearer ${authToken}`
    }
  })
  return photo
}

export async function getPhotoBaseUrl(photo: Photo) {
    let { authToken } = await getUserAuthToken()
    if (!photo) throw { msg: "No photo provided in getPhotoBaseUrl" }
    let { data: { baseUrl } } = await axios.get(`${GPHOTOS_BASE}/mediaItems/${photo.id}`, {
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    })
    return baseUrl
}

export async function toggleFavorite(photo: Photo) {
  let { favorites } = await chrome.storage.sync.get('favorites')
  favorites ??= {}
  if (favorites[photo.id] === undefined)
    favorites[photo.id] = false
  await chrome.storage.sync.set({ favorites: {
    ...favorites,
    [photo.id]: !favorites[photo.id]
  }})
}

export async function getFavorites() {
  let { favorites } = await chrome.storage.sync.get('favorites')
  return Object.fromEntries(Object.entries(favorites ?? {}).filter(e => e[1]))
}

export async function getFavoritePhotos() {
  let { favorites } = await chrome.storage.sync.get('favorites')
  let { photos } = await chrome.storage.local.get('photos')
  return Object.entries(favorites).filter(e => e[1]).map(e => photos[e[0]])
}

export async function isFavorite(photo: Photo) {
  console.assert(photo)
  let favorites = await getFavorites()
  return photo.id in favorites
}



export async function getRandomPhoto() {
    try {
        
        let photos = await photoDb.listPhotos()
        let { photoFilter } = await chrome.storage.sync.get('photoFilter')
        console.log(photoFilter)
        if (photoFilter && photoFilter.albums.length > 0) {
            photos = photos.filter((p) => {
                let combined = [...photoFilter.albums, ...p.albumIds]
                let aspectRatio = p.metadata.width/p.metadata.height
                return  (new Set(combined).size < combined.length) && p?.mimeType?.startsWith('image')
            })
            console.log(photos)
        }
        console.log(photos.length)
        return photos[Math.floor(Math.random() * photos.length)]
    } catch (err) {
        console.log(err.msg)
    }
}

export function imageToBase64(url, maxWidth=0, maxHeight=0) {
  console.log(maxHeight, maxWidth)
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable cross-origin request
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(img.naturalWidth, maxWidth);
        canvas.height = Math.max(img.naturalHeight, maxHeight);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, Math.max(img.naturalWidth, maxWidth), Math.max(img.naturalHeight, maxHeight));
        const base64String = canvas.toDataURL('image/jpeg') //.split(',')[1];
        resolve(base64String);
      };
      img.onerror = console.log;
      img.src = url;
    });
  }

  export const base64toBlob = (b64Data, contentType='', sliceSize=512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  function uploadToGooglePhotos(imageBlob: Blob, accessToken:string) {
    const googlePhotosApiEndpoint = 'https://photoslibrary.googleapis.com/v1/uploads';
    return fetch(googlePhotosApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: imageBlob,
    })
      .then(response => response.text());
  }

  async function batchUploadPhotos(imageUrls: string[], authToken: string) {
    let newMediaItems = []
    for (let imgUrl of imageUrls) {
      let imageBlob = await fetch(imgUrl).then(response => response.blob())
      console.info('Uploading', imgUrl)
      let uploadToken = await uploadToGooglePhotos(imageBlob, authToken)
      newMediaItems.push({
        simpleMediaItem: { uploadToken }
      })
      await sleep(0.5)
    }
    console.log('Uploaded images: ', newMediaItems.length)
    return newMediaItems
  }

  export async function batchAddPhotosToAlbum(imageUrls: string[], albumId: string) {
    let { authToken } = await getUserAuthToken()
    try {
    let newMediaItems = await batchUploadPhotos(imageUrls, authToken)

    const createMediaItemEndpoint = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';
    
    const requestBody = { albumId, newMediaItems };
    
    let data = await fetch(createMediaItemEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
    })
      .then(response => response.json());
    console.log('Media items created and added to the album:', data);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  export async function uploadImageUrlToPhotos(imageData, isBlob, albumId="") {
    let { authToken: accessToken } = await getUserAuthToken()
    let imageBlob;
    if (!isBlob) 
      imageBlob = await fetch(imageData).then(response => response.blob())
    else
      imageBlob = imageData
  
      uploadToGooglePhotos(imageBlob, accessToken)
      .then(uploadToken => {
        // Step 3: Create a media item in Google Photos and add it to the album
        return createMediaItem(uploadToken);
      })
      .then(data => {
        console.log('Media item created:', data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
    
    // Function to upload the image to Google Photos and get the upload token
    
    
    // Function to create a media item in Google Photos and add it to the album
    function createMediaItem(uploadToken: string) {
      const createMediaItemEndpoint = 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate';
    
      const requestBody = {
        newMediaItems: [
          {
            simpleMediaItem: {
              uploadToken: uploadToken,
            },
          },
        ],
        // albumId: albumId,
      };

      if (albumId) {
        // @ts-ignore
        requestBody.albumId = albumId
      }
    
      return fetch(createMediaItemEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      })
        .then(response => response.json());
    }
    
  }