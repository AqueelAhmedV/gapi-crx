import { useState } from "react"
import { useCallback } from "react"
import { useEffect } from "react"
import { flushSync } from "react-dom"
import { photoDb } from "../utils/db"
import { RANDOM_IMG_URL } from "../utils/constants"
import { sleep, syncAlbumPhotos, syncAllAlbums, toggleFavorite } from "../utils/photos"
import { useMemo } from "react"
import Select from 'react-select';
import './SearchBar.css'
// import { openNotifications } from "../utils/notifications"
import { tryViewTransition } from "../utils/dom"
import { bgCommandLookup } from "../utils/common"

export function SearchBar({ 
    searchText, setSearchText, 
    toggleWidget, handleKeyDown, 
    changeWallpaper, setWallpaper,
    currPhoto,
    toggleBgBlur,
    bgBlur
}) {
    const [suggestions, setSuggestions] = useState([])
    const [commandMode, setCommandMode] = useState(false)

    function handleSuggestionClick(s) {
        setSearchText(s.title)
    }

    function handleSearchInput(e, k=null) {
        console.log(e, k)
        let inputText = e?.target?.value ?? e
        setSearchText(inputText)
        chrome.storage.session.set({ commandIndex: 0 })
        if (inputText === '/') toggleCommandMode(true)
        else if (!inputText.startsWith('/')) toggleCommandMode(false)
        
        if (!inputText){
            tryViewTransition(setSuggestions, [])
            return;
        }
        if (commandMode) return;
        chrome.history.search({
            text: inputText,
            startTime: 0,
            maxResults: 1000,
        }).then((results) => {
            tryViewTransition(setSuggestions, results)
        })
        

        chrome.bookmarks.search(inputText).then((bookmarks) => {
            tryViewTransition(setSuggestions, [...bookmarks, ...suggestions])
        })

                
    }


    async function handleSearch(e) {
        e?.preventDefault()
        await chrome.search.query({
            text: searchText,
            disposition: "CURRENT_TAB",
        })
    }

    function toggleCommandMode(val) {
        if (val) {
            toggleBgBlur(true)
        }
        
        let commandKeyframes = [
            {
                transform: 'translateY(-5px)',
                zoom: 1.2,
                boxShadow: '0 16px 32px rgba(0, 0, 0, 0.3)',
            },
            { 
                transform: 'translateY(0px)',
                zoom: 1,
                boxShadow: 'none',
            },
        ]
        let inputEl = document.getElementById('search-input')
        let searchBoxEl = document.getElementById('search-box')
        if (!val) {
            if (!commandMode) return;
            inputEl.blur()
            inputEl.style.fontFamily = 'inherit'
            inputEl.style.color = 'unset'
            setSuggestions([])
            searchBoxEl.animate(commandKeyframes, {
                duration: 300, // Animation duration in milliseconds
                easing: 'ease-in-out', // Animation easing function
                fill: 'forwards', // Keep the final state of the animation
              });
        } else {
            if (commandMode) return;
            commandKeyframes.reverse()
            inputEl.style.color = 'cyan'
            inputEl.style.fontFamily = 'Courier New'
            searchBoxEl.animate(commandKeyframes, {
                duration: 300, // Animation duration in milliseconds
                easing: 'ease-in-out', // Animation easing function
                fill: 'forwards', // Keep the final state of the animation
              });
            }
        tryViewTransition(setCommandMode, val)
    }
    const commandLookup = useMemo(() => {
        let commands = {
        // open in tab, or popup or as browserAction
            ...bgCommandLookup,
            panel: ([navTo, ...params]) => {
                if (navTo === 'sync-photos') {
                    let arg = params.at(0)?.replaceAll("_", " ")
                    if (arg === "headless") {
                        syncAllAlbums()
                        return;
                    } else if (arg) {
                        photoDb.listAlbums()
                        .then(albums => albums.filter((a) => a.title.toLowerCase().includes(arg.toLowerCase())))
                        .then((matchingAlbums) => {
                            if (matchingAlbums.length > 1) {
                                throw {err: 'Specify a title that identifies a single album'}
                            } else if (matchingAlbums.length === 0) {
                                throw {err: `No albums with title ${arg}`}
                            } else {
                                syncAlbumPhotos(matchingAlbums[0])
                            }
                        })
                        return;
                    }
                }
                
                chrome.tabs.getCurrent().then((tab) => {
                    chrome.sidePanel.setOptions({ 
                        path: navTo?`sidepanel.html?nav=${navTo}?time=${Date.now()}`:"sidepanel.html",
                        tabId: tab.id
                    }).then(() => {
                        chrome.sidePanel.open({ tabId: tab.id })
                    })
                })
            },
            change: () => changeWallpaper(),
            close: () => {
                chrome.tabs.getCurrent().then(t => chrome.tabs.remove(t.id))
            },
            reload: () => {
                chrome.sidePanel.setOptions({enabled: false})
                .then(() => {
                    window.close()
                    window.open("/newtab.html","_blank")
                })
            },
            like: () => {
                if (currPhoto)
                toggleFavorite(currPhoto)
                else throw {err: "Photo data not available" }
            },
            refresh: () => {
                chrome.runtime.reload()
            },
            toggle: ([id, ...params]) => {
                if (id === 'blur') {
                    toggleBgBlur(params[0])
                }
                toggleWidget(id)
            },
        }
        commands.favs = ([...params]) => commandLookup.panel(["favorites", ...params])
        commands.sync = ([...params]) => commandLookup.panel(["sync-photos", ...params])
        commands.filter = ([...params]) => commandLookup.panel(["newtab-settings", ...params])
        commands.back = () => commandLookup.panel([])
        commands.show = () => commandLookup.toggle(['blur', false])
        commands.blur = () => commandLookup.toggle(['blur', true]) 
        return commands
    }, [changeWallpaper, setWallpaper, currPhoto])

    


    // convert to useEffect?
    function handleSearchKeydown(e) {
        e.stopPropagation()
        let inputText = searchText
        let inputEl = document.getElementById('search-input')
        // console.log(e)
        if (e.code === "Enter") {
            console.log(suggestions, searchText)
            if (inputText.startsWith("/")) {
                e.preventDefault()
                handleSearchInput("")
                let command = inputText.split("/")[1].split(" ")[0]
                let args = inputText.split("/")[1].split(" ").slice(1).map(s => s.slice(1))
                if (!commandLookup[command]) throw {err: "No such command/alias"}
                commandLookup[command](args)
                chrome.storage.session.get('commandHistory', ({ commandHistory=[] }) => {
                    if (commandHistory.at(-1) !== inputText)
                    commandHistory.push(inputText)
                    chrome.storage.session.set({ commandHistory, commandIndex: 0 })
                })
            } else if (suggestions.length === 0 && !commandMode) {
                handleSearch()
            }
        } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
            if (!commandMode) return;
            chrome.storage.session.get(['commandHistory', 'commandIndex'], ({ commandHistory=[], commandIndex=0 }) => {
                let prevCommand = commandHistory.at(commandHistory.length - commandIndex - 1)
                console.log(commandHistory, commandIndex)
                if (prevCommand) {
                    setSearchText(prevCommand)
                    if (e.code === "ArrowUp" && commandIndex <= commandHistory.length - 1) {
                        commandIndex += 1
                    } else if (commandIndex >= 1) {
                        commandIndex -= 1
                    }
                    chrome.storage.session.set({ commandIndex })
                }
            })
        } else if (e.code === 'Escape') {
            inputEl.blur()
        }
    }

    useEffect(() => {
        chrome.commands.onCommand.addListener((command, tab) => {
            if (command === "focusInput") {
              document.getElementById("search-input").focus()
            } else if (command === "openSidePanel") {
                chrome.sidePanel.open({})
            }
          })
    }, [])

    useEffect(() => {
        function backslashEnableCommandMode(e) {
            if (e.code === '/') {
                toggleCommandMode(true)
            }
        }
        function blurOnMouseMove() {
            let inputEl = document.getElementById('search-input')
            setTimeout(() => {
                inputEl.blur()
            }, 300)
        }
        function cleanUpBackslash() {
            document.documentElement.removeEventListener('keydown', backslashEnableCommandMode)
        }
        function cleanUpMouse() {
            document.removeEventListener('mousemove', blurOnMouseMove)
        }
        if (bgBlur) {
            document.addEventListener('mousemove', blurOnMouseMove)
            return cleanUpBackslash
        } else {
            document.addEventListener('keydown', backslashEnableCommandMode)
            return cleanUpMouse
        }
    }, [bgBlur])

    

    // const [selectedOption, setSelectedOption] = useState(null)

    function handleSelectOption(newValue) {
        if (!newValue?.url) return
        window.location = newValue.url
    }
    
    
    
    // const optionsMz = useMemo(() => {
    //     function suggestionsToOptions(sgts) {
    //         return sgts.map(s => ({
    //             value: s.url,
    //             label: s.title
    //         }))
    //     }
    //     return suggestionsToOptions(suggestions)
    // }, [suggestions])

    return (        
             <div className="flex">
                <div className="relative w-[300px]">
                    {/* <input autoComplete="off" onChange={handleSearchInput} autoCorrect="off" autoFocus={true} 
                    onKeyDown={handleSearchKeydown} 
                    onFocus={() => document.body.removeEventListener('keydown', handleKeyDown)} 
                    type="text" id="search-input" 
                    className="focus:shadow-lg  focus:outline-none block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border-s-gray-50 border-s-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-s-gray-700  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500" 
                    placeholder="Search Anything..." required/>
                    <button disabled={commandMode} type="submit" className="disabled:hover:bg-blue-700 disabled:opacity-10  absolute top-0 end-0 p-2.5 text-sm font-medium h-full text-white bg-blue-700 rounded-e-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                        <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                        </svg>
                        <span className="sr-only">Search</span>
                    </button> */}
                    <Select
                        id='search-box'
                        onFocus={() => setSearchText('')} 
                        isMulti={false}
                        onMenuClose={() => {
                            setSearchText('Type / to enter command')
                        }}
                        onKeyDown={handleSearchKeydown}
                        closeMenuOnScroll={false}

                        menuIsOpen={!commandMode && suggestions.length > 0 && searchText}
                        onChange={handleSelectOption}
                        styles={{
                            container: (provided) => ({
                                ...provided,
                                borderRadius: '0.375rem',
                                backgroundColor: '#555'
                            }),
                            indicatorsContainer: () => ({
                                display: "none"
                            }),
                            input: (provided) => ({
                                ...provided,
                                backgroundColor: "#555",
                                color: "wheat",
                                width: "100%"
                            }), 
                            control: (provided) => ({
                              ...provided,
                              background: "transparent",
                              width: "100%",
                                // Adjust as needed
                            }),
                            option: (provided, state) => ({
                              ...provided,
                              backgroundColor: !state.isSelected ?  state.isFocused ? '#777' :'#555' : '#999',
                              color: state.isSelected ? '#666' : 'white',
                            }),
                            menu: (provided, custom) => ({
                              ...provided,
                              maxHeight: "120px",
                              borderRadius: "5px",
                              padding: "2%",
                              overflow: "hidden",
                              backgroundColor: "#555"
                            }),
                            menuList: (provided) => ({
                                ...provided,
                                maxHeight: "120px"
                            })
                          }}
                        isClearable={true}
                        options={suggestions}
                        getOptionLabel={(o) => o['title']}
                        getOptionValue={(o) => o['url']} 
                        inputValue={searchText}
                        onInputChange={handleSearchInput}
                        inputId="search-input"
                        menuShouldScrollIntoView={true}
                    />
                </div>
            </div>
            

    )
}