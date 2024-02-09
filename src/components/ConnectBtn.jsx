import { Button } from "./Button"
import { getUserAuthToken, logoutUser } from '../utils/auth'
import { useState, useEffect } from "react"
import { GoogleIcon } from "./Icons"
import { IoLogoGoogle } from "react-icons/io5"

export function ConnectBtn() {
    const [connectStatus, setConnectStatus] = useState("disconnected")
    const [btnProps, setBtnProps] = useState({
        disconnected: {
          fillColor: "teal",
          innerText: "Sign in",
          onClick: handleConnectGPhotos
        },
        connected: {
          fillColor: "red",
          innerText: "Logout",
          onClick: handleDisconnect
        },
        connecting: {
          fillColor: "teal",
          innerText: "Connecting",
          onClick: () => {}
        }
      })
    
      useEffect(() => {
        chrome.storage.sync.get('authToken')
        .then(({ authToken }) => {
          setConnectStatus(authToken?"connected": "disconnected")
        })
      }, [])
    
    
      async function handleConnectGPhotos() {
        try {
          setConnectStatus("connecting")
          
          let { authToken } = await getUserAuthToken(true)
          if (authToken) await chrome.storage.sync.set({ userConnected: true });

          setConnectStatus(authToken ? "connected": "disconnected")
        } catch(err) {
          setConnectStatus("disconnected")
          console.error('Photos Connect: ', err)
        }
      }

    
      async function handleDisconnect() {
        try {
          await chrome.storage.sync.set({ userConnected: false })
          let res = await logoutUser()
          setConnectStatus(res.status)
        } catch (err) {
          console.error("Photos Disconnect: ", err) 
        }
      }

    return (
        <Button loading={connectStatus === "connecting"} 
        fillColor={btnProps[connectStatus].fillColor} 
        innerText={btnProps[connectStatus].innerText} 
        onClick={btnProps[connectStatus].onClick}
        showIcon={true} //{connectStatus === "disconnected"}
        className={'flex justify-center items-center align-middle'}
        iconElement={connectStatus !== "connecting" && <IoLogoGoogle className="h-4 w-4 me-3"/>}
        />
    )
}