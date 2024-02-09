import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom";
import { convertMsgToMail } from "../utils/mail";

export function MailViewer() {
    const { state: { mailId } } = useLocation()
    const [mail, setMail] = useState(null)
    // const iframeRef = useRef()

    useEffect(() => {
        if (!mailId) return;
        chrome.storage.local.get('notifications')
        .then(({notifications}) => notifications.find(n => n.id === mailId).data)
        .then(convertMsgToMail)
        .then(setMail)
        
    }, [mailId])

    // open links in new tab
    // useEffect(() => {
    //     if (!iframeRef) return;
    //     console.log(iframeRef?.current)
    //     // iframeRef?.current?.contentDocument.querySelectorAll('a')
    //     // .forEach(a => a.target = '_blank')
    // }, [iframeRef])

    const [viewMore, setViewMore] = useState(false)



    return (
        <div id="mailContainer" className="font-sans rounded-md h-full py-8 bg-gray-50 w-full flex flex-col justify-center items-center p-0 m-0">
            {/* <span></span> */}
            <div id="mailHeaders" className="w-[70%] text-slate-500 grid mb-4 items-start text-start">
                <span className="text-md"><b>To:</b> {(viewMore ? mail?.to : mail?.to.slice(0, 6))?.join(', ')} 
                {mail?.to?.length > 7 && <button 
                onClick={() => setViewMore(!viewMore)} 
                className="outline-none bg-transparent focus:outline-none active:underline text-blue-400 hover:text-blue-700">
                &nbsp;{viewMore?"Hide": "View More"}</button>}
                </span>
                <span className="text-md"><b>From:</b> {mail?.from}</span>
                <span className="text-md"><b>Subject:</b> {mail?.subject}</span>
            </div>
            <div id="mailContent" className="rounded-md w-[70%] h-[500px] text-slate-700 items-start text-start">
                {(!mail?.bodyHtml && mail?.bodyText) && <span className="w-full">{mail?.bodyText}</span>}
                {mail?.bodyHtml && <iframe 
                width={"100%"} height={'100%'} 
                srcDoc={mail?.bodyHtml
                .replaceAll('target="_blank"', '').replaceAll('<a ', '<a target="_blank" ')}>
                </iframe>}
            </div>
        </div>
    )
}