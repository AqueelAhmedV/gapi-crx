import Favorites from './Favorites';
import LowerBar from '../components/LowerBar';
import { Route } from 'react-router-dom/dist';
import { Routes } from 'react-router-dom/dist';
import { SidePanel } from './SidePanel'
import { BrowserRouter } from 'react-router-dom/dist';
import { useState } from 'react';
import { SyncPhotos } from './SyncPhotos';
import { NewtabSettings } from './NewtabSettings';
import './index.css'
import { useEffect } from 'react';
import { MailViewer } from './MailViewer';
// import { Puppet } from './Puppet';

export default function App() {
    const [utilityBtns, setUtilityBtns] = useState([])
    const [showLowerBar, setShowLowerBar] = useState(true)

    useEffect(() => {
        // console.log(window.location.href, window.location.host, window.location.pathname)
        if (['/mail-viewer'].includes(window.location.pathname))
            setShowLowerBar(false)
    }, [window.location.href])

    function handleNavigateBack() {
        
        window.location = "/sidepanel.html?nav=sidepanel.html"
        // commented due to commandMode nav
        // if (document.startViewTransition) {
        //     document.startViewTransition(() => flushSync(() => {
        //         history.back()
        //     }))
        // } else {
        //     history.back()
        //     // window.location = "/sidepanel.html"
        // }
    }


    return (
        <main className={`min-h-screen flex max-w-full  m-0`}>
        <BrowserRouter initialEntries={["/sidepanel.html"]}>
            <Routes>
                <Route path='sidepanel.html' element={<SidePanel/>} />
                <Route path="favorites" element={<Favorites setUtilityBtns={setUtilityBtns} />}/>
                <Route path="sync-photos" element={<SyncPhotos/>} />
                <Route path="newtab-settings" element={<NewtabSettings/>}/>
                <Route path='mail-viewer' element={<MailViewer />} />
            </Routes>
            {showLowerBar && <LowerBar handleGoBack={handleNavigateBack} utilityBtns={utilityBtns} />}
        </BrowserRouter>
        </main>
    )
}