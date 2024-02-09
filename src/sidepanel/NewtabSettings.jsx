import { useEffect } from "react";
import { MultiSelectDropdown } from "../components/MultiSelectDropdown"
import { useState } from "react";
import { photoDb } from "../utils/db";
import { ConnectBtn } from "../components/ConnectBtn";
import { Button } from "../components/Button";

export function NewtabSettings() {
    const [selectedAlbums, setSelectedAlbums] = useState([])
    const [options, setOptions] = useState([])
    const [userSettings, setUserSettings] = useState(null)

    useEffect(() => {
      setUserSettings(JSON.parse(localStorage.getItem('chromexSettings') ?? '{}'))
    }, [])
   


    async function handleChangeSettings(key, value) {
      let settings = JSON.parse(localStorage.getItem('chromexSettings') ?? '{}')
      settings[key] = value
      setUserSettings(settings)
      localStorage.setItem('chromexSettings' ,JSON.stringify(settings))
      await chrome.storage.sync.set({ settings })
    }
    
    
  
    const handleSelectChange = async (selected) => {
      console.log(selected)
      await chrome.storage.sync.set({ 
        photoFilter: {
          albums: selected.map(s => s.value),
        }
      })
      setSelectedAlbums(selected);
    };
  
    function albumsToOptions(albums) {
      return albums.map((a) => ({
        value: a.id,
        label: a.title
      }))
    }

    useEffect(() => {
      function loadAlbumFilters() {
        photoDb.listAlbums()
        .then(albumsToOptions)
        .then((options) => {
          setOptions(options)
          console.log(options)
          chrome.storage.sync.get('photoFilter')
          .then(({ photoFilter: { albums } }) => {
            console.log(albums)
            setSelectedAlbums(options.filter(o => (albums ?? []).includes(o.value)))
          })
        })
        .catch(console.log)
      }
      loadAlbumFilters()

      chrome.storage.sync.onChanged.addListener((changes) => {
        if ('photoFilter' in changes) {
          loadAlbumFilters()
        }
      })
          
      }, [])

      return (
        <div className="h-full w-full flex justify-center items-center">
          <div className="px-1 flex gap-2 mix-blend-luminosity flex-col">
        {/* <Button innerText={"Refresh Albums"} title={"Refresh Albums"} onClick={handleLoadAlbums}/> */}
            {/* <Button innerText={"Batch Get"} title={"Batch Get"} /> */}
            <ConnectBtn />
            {/* <Button innerText={"Batch Get"} title={"Batch Get"} /> */}
            <div className="h-fit mb-2">
           <MultiSelectDropdown selectedOptions={selectedAlbums} onChange={handleSelectChange} options={options}/>
           </div>
          <Button 
          innerText={!userSettings?.gmailSyncEnabled? 'Sync Gmail': 'Turn OFF Gmail Sync'} 
          onClick={() => handleChangeSettings('gmailSyncEnabled', !userSettings?.gmailSyncEnabled)} />
          
          </div>
        </div>
      )
}