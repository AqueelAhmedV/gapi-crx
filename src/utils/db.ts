import { Photo, Album } from "../types"
import { syncAllAlbums } from "./photos"

export class PhotoDB {
    constructor() {
      
    }

    async countAlbumPhotos(albumId: string): Promise<number> {
      return (await this.getAlbumPhotos(albumId)).length
    }

    async listAlbums(): Promise<Album[]> {
      
      let { albums, userConnected } = await chrome.storage.local.get(['albums', 'userConnected'])
      if (!albums && userConnected) {
        await syncAllAlbums();
        ({albums} = await chrome.storage.local.get('albums'))
      }
        
      console.assert(albums, "No albums")
      return Object.values(albums ?? {})
    }

    async listPhotos(): Promise<Photo[]> {
      let { photos } = await chrome.storage.local.get('photos')
      if (photos)
        return  Object.values(photos ?? {}).flatMap((p:Photo[]) => p)
      else {
        throw { msg: "No photos in storage" }
      }
    }

    async getPhotos(): Promise<{ [key: string]: Photo }> {
      let { photos } = await chrome.storage.local.get('photos')
      return photos
    }

    async findAlbumById(albumId: string): Promise<Album | unknown> {
      let { albums } = await chrome.storage.local.get('albums')
      console.assert(albums)
      return albums[albumId]
    }

    async findPhotoById(photoId: string): Promise<Photo | unknown> {
      let { photos } = await chrome.storage.local.get('photos')
      console.assert(photos)
      return photos[photoId]
    }

    async getAlbumPhotos(albumId: string) {
      let photos = await this.listPhotos()
      return photos.filter((p) => p.albumIds.includes(albumId))
    }

    async addPhoto(photoData: Photo): Promise<Photo | unknown> {
      let { photos } = await chrome.storage.local.get(`photos`)
      photos[photoData.id] = photoData
      await chrome.storage.local.set({ photos })
      return photoData
    }

    async updatePhoto(photoId:string, newData:Partial<Photo>) {
      let { photos } = await chrome.storage.local.get('photos')
      console.log('before', photos[photoId])
      photos[photoId] = {
        ...photos[photoId],
        ...newData
      }
      console.log(photos[photoId])
      await chrome.storage.local.set({ photos })
      return photos[photoId]
    }

    async updateAlbum(albumId:string, newData:Partial<Album>) {
      let { albums } =  await chrome.storage.local.get('albums')
      albums[albumId] = { ...albums[albumId], ...newData }
      await chrome.storage.local.set({ albums })
    }
    
    async batchAddPhotosOfAlbum(albumId: string, newPhotos: Photo[]) {
      let { photos } = await chrome.storage.local.get('photos')
      photos ??= {}
      photos = {
        ...photos,
        ...newPhotos.reduce((prev, curr) => {
          curr.albumIds ??= []
          curr.albumIds.push(albumId)
          prev[curr.id] = curr
          return prev
        }, {})
      }
      await chrome.storage.local.set({ photos })
    }

    async batchCreateAlbums(newAlbums: Album[]): Promise<void> {
      // let { albums: existingAlbums } = await chrome.storage.local.get('albums');
      // const uniqueAlbums: Album[] = [];
      // if (!existingAlbums)
      //   existingAlbums = {}

  
    // for (let album of newAlbums) {
    //     if (!existingAlbums[album.id]) {
    //       uniqueAlbums.push(album);
    //     }
    //     existingAlbums[album.id] = album;
    //   }
      // if (uniqueAlbums.length > 0) {
        await chrome.storage.local.set({ albums: newAlbums });
        console.log(`Added ${Object.keys(newAlbums).length}  album(s) to db.`);
      // }
    }
  }
  

  export const photoDb = new PhotoDB()

