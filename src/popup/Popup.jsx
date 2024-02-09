import { useState, useEffect, useMemo } from 'react'

import './Popup.css'
import NotificationItem from '../components/NotificationItem'

import { tryViewTransition } from '../utils/dom'
import { handleReadMail } from '../utils/mail'
import { GmailIcon } from '../components/Icons'

export const Popup = () => {
  const [notifications, setNotifications] = useState(null)
  // {
  //   'abcd': {
  //     message: "Hey",
  //     title: 'New Email',
  //     id: 'abcd'
  //   },
  //   'hehe': {
  //     message: 'How are you?',
  //     title: 'Syncing Photos',
  //     id: 'hehe'
  //   }
  // }

   

  function notifArrToObj(notifs) {
    return Object.fromEntries(notifs.map(n => [n.id, n]))
  }

  useEffect(() => {
    chrome.storage.local.get('notifications')
    .then(({ notifications }) => {
      notifications ??= []
      tryViewTransition(setNotifications, notifArrToObj(notifications))
    })
    .catch(console.log)

    chrome.storage.local.onChanged.addListener((changes) => {
      if ('notifications' in changes) {
        tryViewTransition(setNotifications, notifArrToObj(changes.notifications.newValue))
      }
    })
  }, [])
  async function handleClose(nId) {
    let newNotifs = structuredClone(notifications)
    if (newNotifs[nId].type === 'mail') {
      // handleReadMail(nId)
    } else if (newNotifs[nId].type === 'erp_notice') {
      handleReadNotice(nId)
    }
    delete newNotifs[nId]
    await chrome.storage.local.set({ notifications: Object.values(newNotifs) })    
  }

  
  const [categoryFilter, setCategoryFilter] = useState({ type: 'all' })

  const notifCategories = [
    {
      title: 'All',
      onClick: () => {
        tryViewTransition(setCategoryFilter, { type: 'all' })
      },
      type: 'all'
    },
    {
      title: 'Gmail',
      icon: <GmailIcon className={"w-4 h-4"}/>,
      onClick: () => {
        tryViewTransition(setCategoryFilter, { type: 'mail' })
      },
      type: 'mail'
    },
    
  ]

  const notifsMz = useMemo(() => {
    return Object.values(notifications ?? {})
        .filter(categoryFilter.type !== 'all' ? ((n) =>  categoryFilter.type === n.type): (() => true))
        .sort((b, a) => new Date(a?.timestamp)?.getTime() - new Date(b?.timestamp)?.getTime())
        .map((n) => (
          <NotificationItem key={n.id} notification={n} onClose={handleClose}/>
        ))
  }, [notifications, categoryFilter])


  

  

  return (
    <main className='py-2 md:px-52 px-2 bg-slate-100 mb-16'>
      <div className="w-full overflow-x-auto justify-center flex ">
        <div className="flex gap-4 px-2 py-1 mb-2 whitespace-nowrap rounded-md bg-slate-200">
          {
            notifCategories.map((nC) => (
              <button 
              key={nC.title}
              onClick={nC.onClick}
              className={
                `${nC.type === categoryFilter.type ? 'font-semibold shadow-sm rounded-md bg-white text-sky-700':'text-sky-900'}
               py-2 w-12 font-sans`}
              >{nC.title}</button>
            ))
          }
        </div>
      </div>
      <div className='h-fit grid min-w-72 w-full gap-2 place-items-center max-h-[400px] pb-2'>
        {notifsMz}
        {(!notifications || Object.values(notifications ?? {}).length === 0) && (<div className='p-4 text-slate-800'>
          <span>No new notifications</span>
        </div>)}
      </div>
    </main>
  )
}

export default Popup
