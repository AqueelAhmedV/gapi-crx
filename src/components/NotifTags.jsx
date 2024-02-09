import { GmailIcon, GoogleIcon } from "./Icons";

export function GmailNotifTag({ tagText='' }) {
    return (
        <div className="bg-slate-300 rounded-md flex justify-around w-fit gap-2 px-2 h-6 items-center">
            <span><GmailIcon className={'w-4 h-4'}/></span>
            {tagText && <span className="font-semibold text-sky-900">{tagText}</span>}
        </div>
    )
}