import React, { useState } from "react"
import { useEffect } from "react"
import { photoDb } from "../utils/db"
import { ClickableThumbnail } from "../components/ClickableThumbnail"
import { PhotoModal } from "../components/PhotoModal"
import { useMemo } from "react"
import { PhotoIcon } from "@heroicons/react/24/outline"
import { RiDislikeLine } from "react-icons/ri";
import { getFavorites, setWallpaper, toggleFavorite } from "../utils/photos"
import { flushSync } from "react-dom"

export default function Favorites({ setUtilityBtns }) {
    const [favorites, setFavorites] = useState([])
    const [imageUrl, setImageUrl] = useState("")
    const [modalPhoto, setModalPhoto] = useState(null)
    useEffect(() => {
        (async () => {
            let favorites = await getFavorites()
            console.log(favorites)
            let photos = await photoDb.getPhotos()
            setFavorites(Object.keys(favorites).map(fId => photos[fId]))
        })()
        chrome.storage.sync.onChanged.addListener((changes) => {
            if ('favorites' in changes) {
              (async () => {
                let favorites = await getFavorites()
                let photos = await photoDb.getPhotos()
                setFavorites(Object.keys(favorites).map(fId => photos[fId]))
              })()
            }
          })
        
    }, [])

    async function handleSetWallpaper() {
        await setWallpaper(imageUrl)
    }

    async function handleRemoveFavorite() {
        await toggleFavorite(modalPhoto)
        handleCloseModal()
    }

    function handleCloseModal() {
        if (document.startViewTransition) {
            document.startViewTransition(() => flushSync(() => {
                setImageUrl("")
                setModalPhoto(null)
            }))
        } else {
            setModalPhoto(null)
            setImageUrl("")
        }
    }

    useEffect(() => {
        if (!imageUrl) {
            setUtilityBtns([])
            return
        }
        setUtilityBtns([
            {
                title: "removeFavBtn",
                iconElement: <RiDislikeLine className="w-7 h-7"/>,
                handleClick: handleRemoveFavorite
            },
            {
                title: "setWallBtn",
                iconElement: <PhotoIcon className="w-7 h-7"/>,
                handleClick: handleSetWallpaper
            }
        ])
    }, [imageUrl])

    const FavoritesGrid = useMemo(() => favorites.map((p) => (
        <ClickableThumbnail setModalPhoto={setModalPhoto} key={p.id} photo={p} setImageUrl={setImageUrl} />
    )), [favorites, setImageUrl])

    return (
    
    <div className='mt-3 flex flex-wrap h-fit justify-center gap-1 pb-32' onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        chrome.windows.create({
            url: chrome.runtime.getURL('options.html') + `?slideshowType=favorites`,
            state: 'maximized',
            type: 'popup'
        })
    }}>
        {FavoritesGrid}
        <PhotoModal imgStyle={{
            height: "100vh",
            objectFit: "contain",
            aspectRatio: modalPhoto?.metadata?.width/modalPhoto?.metadata?.height
        }} skeletonStyle={{
            height: "100vh",
            aspectRatio: modalPhoto?.metadata?.width/modalPhoto?.metadata?.height ?? 4/3,
            objectFit: "contain",
        }} photo={modalPhoto} imageUrl={imageUrl} handleClose={handleCloseModal} closeable={true}/>
    </div>)
}