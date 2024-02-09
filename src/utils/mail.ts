import { GmailMessage, Mail } from "../types";
import { getUserAuthToken } from "./auth";
import { GMAIL_BASE } from "./constants";
import { createNotification } from "./notifications";
import { decode } from "js-base64";

export async function updateMailHistoryId() {
    // @ts-ignore chrome.identity mistake
    let { email } = await chrome.identity.getProfileUserInfo()
    // let accounts = await chrome.identity.getAccounts()
    let { authToken } = await getUserAuthToken()
    let headers = {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
    return fetch(`${GMAIL_BASE}/users/${email}/messages?maxResults=1`, {
      headers,
      method: 'GET',
    })
    .then(r => r.json())
    .then((({messages}) => {
      return fetch(`${GMAIL_BASE}/users/${email}/messages/${messages[0].id}`, {
        headers,
        method: 'GET'
      })
    }))
    .then(r => r.json())
    .then(({historyId} : {[key :string]: string}) => {
        chrome.storage.sync.set({ historyId })
        console.log(historyId)
        return historyId
    })
    .catch(console.log)
}

export async function checkNewMails() {
    let { settings } = await chrome.storage.sync.get('settings')
    if (!settings?.gmailSyncEnabled) return;
    // @ts-ignore
    let { email } = await chrome.identity.getProfileUserInfo()
    let { authToken } = await getUserAuthToken()
    let { historyId: currHistoryId } = await chrome.storage.sync.get('historyId')
    if (!currHistoryId) 
      currHistoryId = await updateMailHistoryId()

    let headers = {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    await fetch(
      `${GMAIL_BASE}/users/${email}/history?maxResults=10&startHistoryId=${currHistoryId}&labelId=UNREAD`, {
        headers,
        method: 'GET',
      })
      .then(r => r.json())
      .then(((data) => {

        console.log(data, data.historyId, currHistoryId, data.history)
        if (data.historyId > currHistoryId) {
            chrome.storage.sync.set({ historyId: data.historyId })
            console.log("Succesfully updated historyId")
            return data
        }
      }))
      .then((data) => {
        if (data && data?.history) {
          let messages = data.history.reduce((prev, curr) => prev.concat(curr.messages), [])
          let mPromises = []

          for (let m of messages) {
            mPromises.push(fetch(`${GMAIL_BASE}/users/${email}/messages/${m.id}`, { headers })
            .then(r => r.json())
            .then((msg: Partial<GmailMessage>) => {
              console.log(msg)
              let mailSubject = (msg.payload.headers?.find(h => h.name === 'Subject')).value        
              createNotification({
                id: msg.id,
                title: mailSubject,
                message: msg.snippet,
                type: 'mail',
                data: msg,
                timestamp: new Date(parseInt(msg.internalDate)).toString()
              })
            }))
          }
          Promise.all(mPromises)
          .then(() => console.log("SUCCESS"))
        }
      })
      .catch(console.log)
}

export async function handleReadMail(mailId: string) {
  // @ts-ignore
  let { email } = await chrome.identity.getProfileUserInfo()
  let { authToken } = await getUserAuthToken()
  let { historyId: currHistoryId } = await chrome.storage.sync.get('historyId')
  let headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
  let reqBody = {
    // addLabelIds: ['READ'],
    removeLabelIds: ['UNREAD']
  }
  // console.log("EEHHEHEH")
  return fetch(`${GMAIL_BASE}/users/${email}/messages/${mailId}/modify`, {
    headers,
    method: 'POST',
    body: JSON.stringify(reqBody)
  }).then(r => r.json())
  .then((data) => {
    console.log(data.historyId)
    if (data.historyId > currHistoryId) {
      chrome.storage.sync.set({ historyId: data.historyId })
      console.log("Succesfully read email", data)
    }
  })
  .catch(console.log)

}


export function convertMsgToMail(msg: GmailMessage): Partial<Mail> {
  const headersMap = new Map(msg.payload.headers.map(({name, value}) => [name, value]));
  new Blob()
  console.log(headersMap, headersMap?.get('To'))
  console.log(msg)
  let alternativeParts = msg.payload.parts?.find(p => p.mimeType === 'multipart/alternative')?.parts 
  let bodyTextData = (msg.payload.parts?.find(p => p.mimeType === 'text/plain') ?? 
  alternativeParts?.find(p => p.mimeType === 'text/plain'))?.body.data
  return {
      to: headersMap.get('To').split(', '),
      from: headersMap.get('From'),
      subject: headersMap.get('Subject'),
      bodyHtml: decode(
        (msg.payload.parts?.find(p => p.mimeType === 'text/html') ?? 
        alternativeParts?.find(p => p.mimeType === 'text/html'))?.body.data ?? btoa('')),
      bodyText: bodyTextData ? decode(bodyTextData) : msg?.snippet,
      timestamp: new Date(parseInt(msg.internalDate))
  }
}