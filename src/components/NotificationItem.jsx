// NotificationItem.js
import React from 'react';
import { IoCloseCircle } from "react-icons/io5";
import { GmailNotifTag } from './NotifTags';
import moment from 'moment';

const NotificationItem = ({ notification, onClose }) => {

  const handleClickNotif = {
    mail: () => {
      console.log(notification)      
      chrome.windows.create({
        url: chrome.runtime.getURL(
          `sidepanel.html?nav=mail-viewer&data={"mailId":"${notification.id}"}`
          ),
        type: 'popup',
        state: 'maximized',
        // width: 700,
        // height: window.innerHeight
      })
    },
    'erp_notice': () => {
      
      console.log(notification)
      chrome.windows.create({
        url: chrome.runtime.getURL(
          `sidepanel.html?nav=notice-viewer&data={"noticeId":"${notification.id}"}`
          ),
        type: 'popup',
        state: 'maximized',
        // width: 700,
        // height: window.innerHeight
      })
    }
  }

  const tagLookup =  {
    mail: <GmailNotifTag />,
    'erp_notice': <ErpNotifTag />,
    err: <div>Err</div>
  }

  return (
    <div className="shadow-sm hover:bg-gray-200 focus:bg-gray-400 bg-gray-50 rounded py-3 px-2 min-w-[18rem] max-w-[18rem] md:min-w-full relative">
      <div className="" onDoubleClick={handleClickNotif[notification.type]}>
        <div className=' text-left flex flex-col gap-2 '>
          <p className="inline-block break-words text-slate-700 pr-8 text-md font-bold ">{notification.title}</p>
          <div className='my-1 h-fit w-full flex justify-between items-center'>
            <span>{tagLookup[notification.type]}</span>
            {notification.timestamp && <span className='text-slate-400'>{moment(new Date(notification.timestamp)).fromNow()}</span>}
          </div>  
          <p className="inline-block break-words text-slate-500 text-xs pl-1">{notification.message}</p>
        </div>
      </div>
      
      <button
          className="text-red-400 hover:text-red-100 focus:outline-none absolute top-0 right-0 p-2"
          onClick={() => onClose(notification.id)}
          
        >
          <IoCloseCircle className='h-5 w-5'/>
        </button>
    </div>
  );
};

export default NotificationItem;
