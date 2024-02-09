import React, { Suspense, useMemo } from "react";
import { getPhotoBaseUrl, imageToBase64 } from "../utils/photos";
import { SkeletonLoading } from "./Skeleton";
import { flushSync } from "react-dom";



export function ClickableThumbnail({ photo, title, baseUrl, setImageUrl, setModalPhoto }) {
    const photoAspectRatio = photo?.metadata?.width/photo?.metadata?.height
    async function getPhotoDataUrl() {
        let url = await getPhotoBaseUrl(photo)
        
        let dataUrl = await imageToBase64(`${url}=w${parseInt(window.innerHeight*photoAspectRatio/3)}-h${parseInt(window.innerHeight/3)}`)
        return {thumbDataUrl: dataUrl, imgBaseUrl: url}
    }
    const LazyThumbnail = useMemo(() => {
      if (!photo?.id) return
      return React.lazy(() => getPhotoDataUrl()
    .then(({ thumbDataUrl, imgBaseUrl }) => (
        {default: () => (<div
        className="bg-cover bg-center h-full blur-sm hover:blur-none hover:scale-110 transition-all duration-300"
        onClick={() => {
            if (document.startViewTransition)
            document.startViewTransition(() => flushSync(() => {
                setImageUrl(imgBaseUrl); setModalPhoto(photo)
            }))
            else {
                setImageUrl(imgBaseUrl); setModalPhoto(photo)
            }
        }}
        style={{ 
            backgroundImage: `url("${thumbDataUrl}")`,
            aspectRatio: photo?.metadata?photoAspectRatio:"auto"
        }}
    ></div>)})
    ))}, [photo?.id])
          

    return (
      <div className="relative overflow-hidden cursor-pointer w-fit rounded-sm h-[calc(100vh/3.2)]">
        {baseUrl && <div
          className="bg-cover bg-center h-full w-full"
          style={{ backgroundImage: `url(${baseUrl})` }}
        ></div>}
        {photo && <Suspense fallback={
        <SkeletonLoading
            className={`h-[calc(100vh/3.2)]`}
            style={{
                aspectRatio: photoAspectRatio
            }}
        />}><LazyThumbnail/></Suspense>}

        y
      </div>
    );
  };