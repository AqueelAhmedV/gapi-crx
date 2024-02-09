import { memo, useState, useEffect, useMemo, lazy } from 'react'

import './Options.css'
import { photoDb } from '../utils/db'
import { PhotoModal } from '../components/PhotoModal'
import { tryViewTransition } from '../utils/dom'
import { shuffleArray } from '../utils/common'
import { Button } from "../components/Button";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/20/solid"
import { getFavoritePhotos, getFavorites, isFavorite, sleep, toggleFavorite } from '../utils/photos'

export const Options = () => {
  const link = 'https://github.com/guocaoyi/create-chrome-ext'
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(false)
  const [slideNo, setSlideNo] = useState(0)
  const currSlide = useMemo(() => {
    if (slides.length === 0) return null;
    else return slides.at(slideNo)
  }, [slideNo, slides.length])





  function handleToggleFavorite(e) {
    e.stopPropagation()
    toggleFavorite(currSlide)
  }
  const [isFav, setIsFav] = useState(false)
  useEffect(() => {
    if (!currSlide) return;
    isFavorite(currSlide)
    .then(setIsFav)
    chrome.storage.sync.onChanged.addListener((changes) => {
      if ('favorites' in changes) {
        isFavorite(currSlide)
        .then(setIsFav)
      }
    })
  }, [currSlide])


  useEffect(() => {
    const url = new URL(window.location.href);
    let slideshowType = url.searchParams.get("slideshowType")
    if (slideshowType === "favorites") {
      console.log("FAVORITES")
      getFavoritePhotos()
      .then(shuffleArray)
      .then(setSlides)
      return;
    }
    let albumId = url.searchParams.get("albumId")
    console.log(albumId)
    if (albumId) {
      photoDb.getAlbumPhotos(albumId)
      .then(shuffleArray)
      .then((photos) => {
        console.log(photos)
        setSlides(photos)
        // tryViewTransition(setSlides, photos)
      })
    }
  }, [])


  // implement abort controller?
  // useEffect(() => {
  //   if (slides.length === 0) return;
  //   function handleKeydownSlideNav(e) {
  //     if (e.code === 'ArrowRight') {
  //       setSlideNo((slideNo + 1)%slides.length)
  //     } else if (e.code === 'ArrowLeft') {
  //       setSlideNo((slideNo - 1)%slides.length)
  //     }
  //   }
  //   window.addEventListener('keydown', handleKeydownSlideNav)
  //   return () => {
  //     window.removeEventListener('keydown', handleKeydownSlideNav)
  //   }

  // }, [slides.length])

  // useEffect(() => {
  //   if (slides.length === 0) return;
  //   let currSlideNo = 0
  //   let slideInterval = setInterval(() => {
  //     // setCurrSlide(slides[currSlideNo])
  //     tryViewTransition(setCurrSlide, slides[currSlideNo])
     
      
  //     currSlideNo = (currSlideNo + 1) % slides.length
  //   }, 5000)

  //   return () => {
  //     clearInterval(slideInterval)
  //   }
  // }, [slides])


  

  const MediaSlideMz = useMemo(() => {
    if (!currSlide) return null;
    let photo = currSlide;
    if (['png', 'jpeg', 'webp'].includes(photo.mimeType?.split('/')[1]) ) {
      return (<PhotoModal onLoad={() => {
        sleep(5)
        .then(() => {
          setSlideNo((slideNo + 1) % slides.length)
        })
      }} photo={photo} imgStyle={{
        height: "100vh",
        aspectRatio: photo?.metadata?.width/photo?.metadata?.height ?? 4/3
    }} skeletonStyle={{
        height: "100vh",
        aspectRatio: photo?.metadata?.width/photo?.metadata?.height ?? 4/3
    }} closeable={false} />)
    } else {
      window.addEventListener('online')
      return (<div>
        <iframe srcDoc=''/>
      </div>)
      // iframe passing cookies?
      // chrome.windows.create({
      //   url: photo?.productUrl,
      //   state: 'fullscreen',
      //   type: 'popup'

      // }).then((win) => {
        
      //   chrome.windows.onRemoved.addListener((rmWinId) => {
      //     if (rmWinId === win.id) {
      //       setSlideNo((slideNo + 1) % slides.length) 
      //     }
      //   })
      //   return win
      
      // })
      // .catch(console.log)
    }
  }, [currSlide?.id])

  

  return (
    <main onDoubleClick={(e) => {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.documentElement?.requestFullscreen()
      }
    }}>
      <div className='flex gap-3 justify-around max-h-screen select-text ' >
        {MediaSlideMz}
        {!currSlide && <div className='flex h-screen justify-center items-center w-full'>
          <span>No Images to show</span>
          </div>}
          {(currSlide) && <div className='mix-blend-luminosity absolute bottom-10 right-10 z-[9999]'>
              <Button
              title="Add to Favorites"
              onClick={handleToggleFavorite}
              className='select-none p-0' 
              showIcon={true} 
              iconElement={(isFav)?
              <HeartIconSolid className='w-5 h-5 inline active:scale-75 hover:scale-125' />:
              <HeartIconOutline  className='w-5 h-5 inline hover:scale-105' />}
              />
            </div>}
      </div>
    </main>
  )
}

export default Options
