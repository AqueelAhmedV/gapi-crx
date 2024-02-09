import { useState, useEffect } from 'react'

import './NewTab.css'
import { Button } from '../components/Button'

import { SparklesIcon, EyeIcon, EyeSlashIcon, HeartIcon as HeartIconSolid } from '@heroicons/react/20/solid'
import { ArrowsPointingInIcon, CogIcon, HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline'
import { getFavorites, getPhotoBaseUrl, getRandomPhoto, imageToBase64, isFavorite, sleep, toggleFavorite } from '../utils/photos'

import { SearchBar } from './SearchBar'
import { GMAIL_BASE, RANDOM_IMG_URL } from '../utils/constants'
import { GiPerspectiveDiceSixFacesRandom } from "react-icons/gi";

import { getUserAuthToken } from '../utils/auth'
import { ErrorBoundary } from 'react-error-boundary'
import { tryViewTransition } from '../utils/dom'
import { ConnectBtn } from '../components/ConnectBtn'
import { openNotifications } from '../utils/notifications'
import { RiSideBarLine } from 'react-icons/ri'



// import { PhotoFilter, Photo } from '../types'

export const NewTab = () => {
  const getTime = () => {
    const date = new Date()
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${hour}:${minute}`
  }
  // TODO ig
  const [filters, setFilters] = useState({
    title: '',
    albums: [],
    creationTime: {
      after: new Date( Date.now() - 90*30*24*60*60*1000 ),
      before: new Date()
    }
  })

  const [time, setTime] = useState(getTime())
  const [bgBlur, setBgBlur] = useState(false)
  const [currPhoto, setCurrPhoto] = useState(null)
  const [bgLoading, setBgLoading] = useState(false)
  const [bgSize, setBgSize] = useState(100)
  const [favorites, setFavorites] = useState([])
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0});
  const [loggedIn, setLoggedIn] = useState(false)
  
  const [searchText, setSearchText] = useState('Type / to enter command')


  const link = 'https://maily-alpha.vercel.app' //'https://github.com/guocaoyi/create-chrome-ext'

  const rootEl = document.querySelector(':root')

  

  useEffect(() => {
    chrome.storage.sync.get('authToken')
    .then(({ authToken }) => {
      tryViewTransition(setLoggedIn, !!authToken)
    });
    (async () => {
      let favorites = await getFavorites()
      setFavorites(favorites)
    })()
    chrome.storage.sync.onChanged.addListener((changes) => {
      if ('favorites' in changes) {
        (async () => {
          let favorites = await getFavorites()
          setFavorites(favorites)
        })()
      } else if ('authToken' in changes) {
        tryViewTransition(setLoggedIn, !!changes.authToken.newValue)
      }
    })
  }, [])

  async function handleSetWallpaper(url, random=false) {
        if (random) setCurrPhoto(null)
        toggleBgBlur(true)
        rootEl.style.setProperty('--bgAnimation', 'none')
        await sleep(0.3)
        rootEl.style.setProperty('--bgUrl', `url("${url}")`)
        rootEl.style.setProperty('--bgAnimation', 'bgBeforeFade 2s ease-in-out')
        rootEl.style.setProperty('--bgX', "50%")
        rootEl.style.setProperty('--bgY', "50%")
        let imageAR = (currPhoto?.metadata?.width/currPhoto?.metadata?.height)
        let bgCoverSize = 130
        rootEl.style.setProperty('--bgSize', `${bgCoverSize}%`)
        console.log(bgCoverSize, imageAR)
        setBgSize(bgCoverSize)
        setDragOffset({ x: window.innerWidth/2 - currPhoto?.metadata?.width/2, y: window.innerHeight/2 - currPhoto?.metadata?.height/2 })
  }

  function handleError(err) {
    // createNotification({
    //   title: "Error",
    //   message: err?.err ?? err?.msg,
    //   type: "error"
    // })
  }

  useEffect(() => {
    chrome.sidePanel.setOptions({
      path: '/sidepanel.html'
    })
    window.onerror = (e, s, l, c, err) => {
      setTimeout(() => {
        handleError(err)
      }, (Math.random()+1)*1000)
    }
    // async listener?
    chrome.storage.sync.onChanged.addListener((changes) => {
      if ('photoFilter' in changes) {
        handleChangeWallpaper()
      }
    })

    chrome.runtime.onMessage.addListener((msg, _s, sendResponse, _r) => {
      console.log(msg)
      if (msg.action === 'setWallpaper') {
        setCurrPhoto(null)
        handleSetWallpaper(msg.data)
        return true;
      } 
    })
  

  }, [])
  

  useEffect(() => {
    handleChangeWallpaper()
    let i = 0;
    let intervalId = setInterval(() => {
      setTime(getTime())
      // if (i%10 === 0) {
      //   handleChangeWallpaper()
      // }
      // i += 1 // Enable Slideshow
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])


  
  

 

  useEffect(() => {
    if (!currPhoto) return;
  //   let sectionEl = document.querySelector('#bg-section')
  //   const rootEl = document.querySelector(':root')
  //   let isDragging = false;
  //   let dragStartY = 0;
  //   let dragStartX = 0;
    
  //   let lag = 0.03;

  //   function handleMouseDown(e) {
  //     isDragging = true;
  //     dragStartY = e.clientY;
  //     dragStartX = e.clientX;
  //     sectionEl.style.cursor = 'grabbing';
  //   }

  //   function handleMouseUp() {
  //     isDragging = false;
  //     sectionEl.style.cursor = 'grab';
  //   }

  //   function handleMouseMove(e) {
  //     if (isDragging) {
  //       let bgDiv = document.getElementById('bg-section')
  //       const dragDistanceY = e.clientY - dragStartY;
  //       const dragDistanceX = e.clientX - dragStartX;

  //       console.log({ clientX:e.clientX, dragDistanceX })
        
  //       setDragOffset((prev) => {
  //         prev.x += lag*dragDistanceX
  //         prev.y += lag*dragDistanceY
  //         // prev.x = Math.max(Math.min(prev.x, 0), -maxDragDistanceX)
  //         // prev.y = Math.max(Math.min(prev.y, 0), -maxDragDistanceY)
  //         rootEl.style.setProperty('--bgX', `${prev.x}px`)
  //         rootEl.style.setProperty('--bgY', `${prev.y}px`)
  //         return prev
  //       });
  //     }
  //   }

  const handleKeydown = (e) => {
    console.log(e)
    
    if (e.code.startsWith("Arrow")) {
        let prevX = rootEl.computedStyleMap().get('--bgX')[0]
        let prevY = rootEl.computedStyleMap().get('--bgY')[0]
        if (prevX === '50%')
          prevX = (window.innerWidth/2 - (currPhoto?.metadata?.width ?? 0)/2)/(bgSize/100)
        if (prevY === '50%')
          prevY = (window.innerHeight/2 - (currPhoto?.metadata?.height ?? 0)/2)/(bgSize/100)
        prevX = parseFloat(prevX)
        prevY = parseFloat(prevY)
        let arrowCodes = {
          'ArrowRight': ['--bgX', prevX - 100, 'x'],
          'ArrowLeft': ['--bgX', prevX + 100, 'x'],
          'ArrowUp': ['--bgY', prevY + 50, 'y'],
          'ArrowDown': ['--bgY', prevY - 50, 'y']
        }
        rootEl.style.setProperty(arrowCodes[e.code][0], `${arrowCodes[e.code][1]}px`)
        setDragOffset({ ...dragOffset, [arrowCodes[e.code][2]]: arrowCodes[e.code][1]})
      }

    setBgSize((prev) => {
      
      if (e.code === 'Space') {
        e.preventDefault()
        console.log(currPhoto)
        rootEl.style.setProperty('--bgX', '50%')
        rootEl.style.setProperty('--bgY', '50%')
        setDragOffset({ x: window.innerWidth/2 - currPhoto?.metadata?.width/2, y: window.innerHeight/2 - currPhoto?.metadata?.height/2 })
        prev = 100
      }
      if (e.key === 'Shift') {
        e.preventDefault()
        rootEl.style.setProperty('--bgX', '50%')
        rootEl.style.setProperty('--bgY', '50%')
      }
      prev = parseFloat(prev)
      if (e.code === 'ShiftLeft' && prev >= 30)
        prev -= 10;
      if (e.code === 'ShiftRight' && prev <= 200)
        prev += 10
      rootEl.style.setProperty('--bgSize', `${prev}%`)
      return prev
    })
    
  }
    
    

    document.body.addEventListener('keydown', handleKeydown)
  //   if (bgBlur) return;
    

  //   sectionEl.addEventListener('mousedown', handleMouseDown)
  //   sectionEl.addEventListener('mouseup', handleMouseUp)
  //   sectionEl.addEventListener('mousemove', handleMouseMove);
    return () => {
  //     sectionEl.removeEventListener('mousedown', handleMouseDown)
  //     sectionEl.removeEventListener('mouseup', handleMouseUp)
  //     sectionEl.removeEventListener('mousemove', handleMouseMove)
      document.body.removeEventListener('keydown', handleKeydown)     
    }
  }, [currPhoto])


  function toggleBgBlur(blur) {
    setBgBlur((prev) => {
      if (typeof blur !== 'boolean')
        blur = !prev
      rootEl.style.setProperty('--bgFilter', !blur?'none':'blur(7px) brightness(50%) grayscale(50%)')
      // rootEl.style.setProperty('--bgFilter1', !blur?'none':'brightness(50%)')
      Array.from(document.getElementsByClassName('to-hide'))
      .forEach(e => !blur ? e.classList.add('hide'):e.classList.remove('hide'))
      // rootEl.style.setProperty('--bgOverlay', !blur?'none':'radial-gradient(circle at 24.1% 68.8%, rgba(50, 50, 50, 0.5) 0%, rgba(0, 0, 0, 0.5) 99.4%)')
      // rootEl.style.setProperty('--mixBlend', !blur?'normal':'luminosity')
      // document.getElementById('btn-wallpaper').classList.toggle('hide')
      return blur
    })
  }

  async function handleChangeWallpaper() {
    if (bgLoading) return;
    setBgLoading(true)
    toggleBgBlur(true)
    rootEl.style.setProperty('--bgAnimation', 'none')
    let baseUrl;
    try {
      let photo = await getRandomPhoto()
      setCurrPhoto(photo)
      
      console.log(photo)
      baseUrl = await getPhotoBaseUrl(photo)
    } catch (err) {
      console.log(err.msg)
    }
    
    baseUrl ??= RANDOM_IMG_URL()
    handleSetWallpaper(baseUrl)
    await sleep(1)
    setBgLoading(false)
    // const connection = chrome.runtime.connect({
    //   name: 'newTab',
    // })
    // connection.onMessage.addListener((msg, _port) => {
    //   console.assert(_port.name === 'newTab')
    //   console.log(msg)
    //   })
    // connection.postMessage({ 
    //   action: 'imageToBase64',
    //   imgUrl: baseUrl
    //  })
    
  }


  useEffect(() => {
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
  
    function highlight() {
      document.body.classList.add('highlight');
    }
  
    function unhighlight() {
      document.body.classList.remove('highlight');
    }
  
    function handleDrop(e) {
      preventDefaults(e);
      
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
  
        reader.onload = function (event) {
          const base64URL = event.target.result;
          setCurrPhoto(null)
          handleSetWallpaper(base64URL)
        };
  
        reader.readAsDataURL(file);
      }
  
      unhighlight();
    }

    function handleSpecialKey(e) {
      if (e.key === '/') {
        let inputEl = document.getElementById('search-input')
        inputEl.focus()
        
      }
    }


    function handleScrollToMove(e) {
      if (bgBlur) return;
      let scrollX = -e.deltaX;
      let scrollY = -e.deltaY;
      let lagX = 0.9;
      let lagY = 0.9;
      let rootEl = document.querySelector(':root')
      let secBefore = chrome.dom.openOrClosedShadowRoot(document.querySelector('#bg-section'))
      console.log(secBefore)
      let prevX = parseFloat(rootEl.computedStyleMap().get('--bgX')[0])
      let prevY = parseFloat(rootEl.computedStyleMap().get('--bgY')[0])
      
      if (prevX === 50) prevX = e.clientX;
      if (prevY === 50) prevX = e.clientY;
      if (typeof prevX !== 'number' || typeof prevY !== 'number') {
        prevX, prevY = e.clientX, e.clientY
      } 
      prevX += lagX*scrollX;
      prevY += lagY*scrollY;
      console.log(prevX, prevY)
      rootEl.style.setProperty('--bgX', `${prevX}px`)
      rootEl.style.setProperty('--bgY', `${prevY}px`)
    }
    window.addEventListener('wheel', handleScrollToMove, false)


    document.addEventListener('keydown', handleSpecialKey)
    document.body.addEventListener('dragenter', preventDefaults, false);
    document.body.addEventListener('dragover', preventDefaults, false);
    document.body.addEventListener('dragleave', unhighlight, false);
    document.body.addEventListener('drop', handleDrop, false); 

    return () => {
      window.removeEventListener('wheel', handleScrollToMove, false)
      document.removeEventListener('keydown', handleSpecialKey)
      document.body.removeEventListener('dragenter', preventDefaults, false);
      document.body.removeEventListener('dragover', preventDefaults, false);
      document.body.removeEventListener('dragleave', unhighlight, false);
      document.body.removeEventListener('drop', handleDrop, false);
    };
  }, [bgBlur])

  async function handleOpenSettings() {
    chrome.tabs.getCurrent().then((tab) => {
      chrome.sidePanel.open({ tabId: tab.id })
    })
  }

  async function handleToggleFavorite() {
    if (currPhoto) {
      toggleFavorite(currPhoto)
    }
  }

  //reminder :smooth_bg_change
  async function testFunc(e) {
    /* TODO: open slideshow of album from panel,
     from custom context menu, pass query param 
     to sidepanel.html to view images full screen unlike
    in sidepanel (contained view), fix skeleton positioning */
    // openNotifications()
    // chrome.socket.connect(10, 'localhost', '8080')
    // chrome.notifications.getPermissionLevel(console.log)
    

    

    
    return;
    let { email } = await chrome.identity.getProfileUserInfo()
    // let accounts = await chrome.identity.getAccounts()
    let { authToken } = await getUserAuthToken()
    let headers = {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
    fetch(`${GMAIL_BASE}/users/${email}/messages?maxResults=10`, {
      headers,
      method: 'GET',
      // body: JSON.stringify({
      //   topicName: 'projects/chromex-app/topics/notifications'
      // })
    })
    .then(r => r.json())
    .then((({messages}) => {
      return fetch(`${GMAIL_BASE}/users/${email}/messages/${messages[0].id}`, {
        headers,
        method: 'GET'
      })
    }))
    .then(r => r.json())
    .then(console.log)
    .catch(console.log)
  }

  function toggleWidget(id) {
    document.getElementById(id)?.classList?.toggle('hide')
  }



  

  return (
    <ErrorBoundary onError={handleError}>
    <section id='bg-section' className=' ' >
      <span  className=' drop-shadow-xl mix-blend-luminosity to-hide'>
        <h1 className='select-none text-[6rem] font-bold '>{time}</h1>
      </span>
      <div className='mix-blend-luminosity absolute bottom-10 right-10 z-[9999]'>
      {currPhoto && <Button
        title="Add to Favorites"
        onClick={handleToggleFavorite}
        className='select-none p-0' 
        showIcon={true} 
        iconElement={(currPhoto.id in favorites)?
        <HeartIconSolid className='w-5 h-5 inline active:scale-75 hover:scale-125' />:
        <HeartIconOutline  className='w-5 h-5 inline hover:scale-105' />}
        />}
      </div>
      <div className='mix-blend-luminosity absolute top-10 right-10 z-[9999] space-x-2'>
        
        {/* <div className='to-hide inline'>
          <Button
            title="Settings"
            onClick={handleOpenSettings}
            className='select-none p-0' 
            showIcon={true} 
            iconElement={<CogIcon className='w-5 h-5 inline hover:rotate-12 active:rotate-45' />}/>
            
        </div> */}
      
      <Button
        title="Show Background" 
        onClick={toggleBgBlur} 
        showIcon={true} 
        iconElement={bgBlur?<EyeIcon className='w-5 h-5 inline' />:<EyeSlashIcon className='w-5 h-5 inline' />}
        />
        {/* <Button
        id='btn-wallpaper'
        className={'h-fit'}
        onClick={handleChangeWallpaper} 
        showIcon={true} 
        iconElement={<div className={`h-fit w-fit bg-transparent ${bgLoading?'animate-bounce':''}`}><GiPerspectiveDiceSixFacesRandom className={`w-5 h-5 inline ${bgLoading?' animate-spin':''}`} /></div>}
        /> */}
        <Button
        id='btn-panel'
        className={'h-fit'}
        title={"Open Side Panel"}
        onClick={() => chrome.tabs.getCurrent()
          .then(t => chrome.sidePanel.open({ tabId: t.id }))} 
        showIcon={true} 
        iconElement={<div className={`h-fit w-fit bg-transparent focus:rotate-45`}>
          <RiSideBarLine className={`w-5 h-5 inline `} /></div>}
        />
      </div>
      <div className='flex gap-3 drop-shadow-lg justify-around mix-blend-luminosity to-hide' >
      <SearchBar
      // newtabPrefs, setNewtabPrefs
      bgBlur={bgBlur}
      toggleBgBlur={toggleBgBlur}
      setSearchText={setSearchText} 
      searchText={searchText} 
      toggleWidget={toggleWidget} 
      currPhoto={currPhoto}
      setWallpaper={handleSetWallpaper} 
      // handleKeyDown={handleKeydown} 
      changeWallpaper={handleChangeWallpaper}/>
      {!loggedIn && <ConnectBtn/>}
      </div>
      
      <a className='select-none text-grey-500 to-hide' href={link} target="_blank">
        sponsored by maily
      </a>
    </section>
    </ErrorBoundary>
  )
}

export default NewTab
