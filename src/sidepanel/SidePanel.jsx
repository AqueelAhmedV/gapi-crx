import { useEffect } from 'react'
import './SidePanel.css'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/20/solid'
import { DrawerIcon } from '../components/DrawerIcon'
import { useNavigate } from 'react-router-dom'
import { IoAlbums } from 'react-icons/io5'
import { sleep } from '../utils/photos'

export const SidePanel = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const url = new URL(window.location.href);
    let navTo = url.searchParams.get("nav")
    let data = url.searchParams.get('data')
    if (navTo)
    navigate(("/" + navTo), {
      state: data ? JSON.parse(data) : null
    })
    // console.log(window.location)
  }, [])
  
  


  async function handleSetWallpaper(url) {
    let rootEl = document.querySelector(":root")
    rootEl.style.setProperty('--bgAnimation', `none`)
    await sleep(0.3)
    rootEl.style.setProperty('--bgUrl', `url("${url}")`)
    rootEl.style.setProperty('--bgAnimation', 'bgBeforeFade 2s ease-in')
  }


  // useEffect(() => {
  //   getRandomPhoto()
  //   .then(getPhotoBaseUrl)
  //   .then(imageToBase64)
  //   .then(handleSetWallpaper)
  // }, [])

  return (
      <div id="sidepanel" className='mt-3 grid grid-cols-2 h-fit w-full gap-7 sm:grid-cols-3 md:grid-cols-4 mix-blend-luminosity place-items-center'>
        <DrawerIcon navigateTo='/favorites' iconElement={<HeartIcon className='w-7 h-7'/>} title={"Favorites"} />
        <DrawerIcon navigateTo='/sync-photos' iconElement={<IoAlbums className='w-7 h-7'/>} title={"Albums"}/>
        <DrawerIcon navigateTo='/newtab-settings' iconElement={<Cog6ToothIcon className='w-7 h-7'/>} title={"Settings"}/>
      </div>
  )
}

export default SidePanel
