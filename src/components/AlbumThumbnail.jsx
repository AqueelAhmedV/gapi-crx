import React, { Suspense, useState, useMemo, useEffect } from "react";
import { getPhotoBaseUrl, getPhotoById, imageToBase64, sleep, syncAlbumPhotos } from "../utils/photos"
import { SkeletonLoading } from "./Skeleton";
import { photoDb } from "../utils/db";
import './index.css'

export function AlbumThumbnail({ album }) {
    // const [coverPhoto, setCoverPhoto] = useState(null)
    const [currItemCount, setCurrItemCount] = useState(0)

    const [photoAspectRatio, _setPAR] =  useState(0.9);
    const [photoHeight, _setPH] = useState(window.innerHeight/3.5)
    const [albumStatus, setAlbumStatus] = useState("")

    useEffect(() => {
        if (!album?.id) return
        chrome.runtime.sendMessage({ albumId: album.id, action: "countAlbumPhotos" }, (res) => {
            setCurrItemCount(res.data)
        })
    }, [album?.id])


    // const AlbumTitle = useMemo(() => {
    //     return (
            
    //     )
    // }, [title, currItemCount, album?.itemCount])

    async function handleSyncAlbumPhotos() {
        console.log(album)
        if (parseInt(album.mediaItemsCount) === currItemCount) {
            if (!confirm("The album is already synced, do you want to proceed?")) {
                return;
            }
        } 
        document.getElementById(album.id).classList.add("album-syncing")
        setAlbumStatus("Syncing...")
        await syncAlbumPhotos(album, setCurrItemCount)
        setAlbumStatus("")
        await sleep(0.5)
        document.getElementById(album.id).classList.remove("album-syncing") 
    }

    const LazyThumbnail = useMemo(() => {
        // console.log(album)
        if (!album?.coverPhotoBaseUrl) return;
        
        // Change
        
        
        async function getPhotoDataUrl() {
            try {
            let url = album.coverPhotoBaseUrl
            let dataUrl = await imageToBase64(`${url}=w${parseInt(photoHeight*photoAspectRatio)}-h${parseInt(photoHeight)}`)
            return {thumbDataUrl: dataUrl, photoAspectRatio}
            } catch (err) {console.log(err)}
        }

        
            
        return React.lazy(() => getPhotoDataUrl()
        .then(({ thumbDataUrl, photoAspectRatio }) => (
        {
            default: () => (
            <div
            className="bg-cover bg-center h-full object-cover "
            style={{ 
                backgroundImage: `url("${thumbDataUrl}")`,
                aspectRatio: photoAspectRatio ?? "auto"
            }}></div>)
        })
      ))}, [album?.coverPhotoBaseUrl])

      return (
        <div className={`relative overflow-hidden cursor-pointer rounded-md flex flex-col justify-center`} style={{ objectFit: "cover", height: photoHeight, aspectRatio: photoAspectRatio ?? "auto"}}>
            <Suspense fallback={<SkeletonLoading className={`h-full w-full`} 
            style={{ aspectRatio: photoAspectRatio ?? "auto" }}/>}>
                <LazyThumbnail />
            </Suspense>
            {/* {AlbumTitle} */}
            <div className=" absolute inset-0 flex items-center justify-center -m-1">
                <div id={album.id} 
                onClick={handleSyncAlbumPhotos} 
                className="h-full w-full hover:scale-120 flex flex-col justify-center text-white text-center opacity-0 hover:opacity-100  hover:backdrop-brightness-50 hover:backdrop-grayscale transition-all duration-300"
                
                onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    chrome.windows.create({
                        url: chrome.runtime.getURL('options.html') + `?albumId=${album.id}`,
                        state: 'maximized',
                        type: 'popup'
                    })
                }}
                
                >
                    <h2 className="text-md font-semibold px-2">{albumStatus || album.title}</h2>
                    <span className="text-xs">{`${currItemCount}/${album.itemCount} synced`}</span>
                </div>
            </div>
        </div>
      )
}