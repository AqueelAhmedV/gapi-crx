import axios from "axios"

const { oauth2 } = chrome.runtime.getManifest()


export async function logoutUser() {
  let { authToken } = await chrome.storage.sync.get('authToken')
  if (!authToken)
    throw { msg: "Already logged out" }
  await chrome.identity.clearAllCachedAuthTokens()
  await chrome.storage.sync.remove('authToken')
  return { msg: "Disconnect Success", status: "disconnected" }
}

export async function getUserAuthToken(init=false) {
    let { userConnected } = await chrome.storage.sync.get('userConnected')
    if (!init && !userConnected) throw { err: 'User not connected' };
    let { connectTime } = await chrome.storage.sync.get(['connectTime'])
    
    if (connectTime && ( new Date().getTime() - new Date(connectTime).getTime() > 30*60*1000 ))
      await logoutUser()

    let { authToken } = await chrome.storage.sync.get(['connectTime'])
    
    
    if (!authToken) {
      ({ token: authToken } = await chrome.identity.getAuthToken({
          interactive: true,
          scopes: oauth2.scopes,
      }))
      await chrome.storage.sync.set({
          authToken: authToken,
          connectTime: new Date()
      })
    }
    return { authToken }
  }




  