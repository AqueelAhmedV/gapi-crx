import { useState } from "react";
import { syncAllAlbums } from "../utils/photos";
import { useEffect } from "react";
import { AlbumThumbnail } from "../components/AlbumThumbnail";
import { useMemo } from "react";

import { SparklesIcon } from "@heroicons/react/20/solid";
import { flushSync } from "react-dom";

export function SyncPhotos() {
    const [albums, setAlbums] = useState([])
    const [loading, setLoading] = useState(false)

    const AlbumGrid = useMemo(() => {
        return albums.map((a) => {
            return (
                <AlbumThumbnail key={a.id} album={a} />            
            )
        })
    }, [albums.map(a => a.id)])

    

    useEffect(() => {
        async function handleLoadAlbums() {
            setLoading(true)
            let { albums } = await syncAllAlbums()
            console.log(albums)
            return albums
        }
        handleLoadAlbums()
        .then((albums) => {
            if (document.startViewTransition) {
                document.startViewTransition(() => flushSync(() => {
                    console.log(albums)
                    setAlbums(albums)
                    setLoading(false)
                }))
            } else {
                setAlbums(albums)
                setLoading(false)
            }
        })
        
    }, [])
    return (
    <div className=" h-fit w-full pb-32">
        
        <div className="flex h-full min-h-screen flex-wrap gap-3 justify-center items-center">
            {AlbumGrid}
            {loading && <SparklesIcon className=" animate-ping w-7 h-7 mb-48" />}
        </div>
    </div>
    )
}