import { XCircleIcon } from "@heroicons/react/20/solid";
import { getPhotoBaseUrl, imageToBase64 } from "../utils/photos";
import React, { Suspense, useMemo } from "react";
import { SkeletonLoading } from "./Skeleton";



export function PhotoModal({ onLoad, imageUrl, handleClose, photo, imgStyle, skeletonStyle, closeable }) {
  
    
  
  
    function getPhotoB64(imageUrl, photo) {
      if (!imageUrl) {
        return getPhotoBaseUrl(photo)
        .then((imgUrl) => {
          return imageToBase64(imgUrl, photo.metadata.width, photo.metadata.height)
        })
      } else {
        return imageToBase64(imageUrl, photo.metadata.width, photo.metadata.height)
      }
    } 
    const LazyImageMz = useMemo(() => {
      return React.lazy(() => getPhotoB64(imageUrl, photo).then(base64String => ({
        default: () => (<img onClick={e => e.stopPropagation()} 
        src={base64String} alt="Modal Image" style={imgStyle} onLoad={onLoad}/>)
      })))
    }, [photo, imageUrl]) 

    function handleClickAway() {
      if (imageUrl) handleClose()
    }

    return (
        !!(imageUrl || photo)?<div onClick={handleClickAway} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative  max-h-screen">
            {closeable && <button
              className="absolute drop-shadow-xl z-[9999] top-4 right-4 text-white text-2xl"
              onClick={handleClose}
            >
              <XCircleIcon className="h-7 w-7" color="#fff" />
            </button>}
            <Suspense fallback={<SkeletonLoading style={skeletonStyle}/>}>
                <LazyImageMz />
            </Suspense>
            
          </div>
        </div>:null
      );
}