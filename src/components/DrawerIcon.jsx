import { useNavigate } from "react-router-dom/dist"
import { Button } from "./Button"
import { flushSync } from "react-dom"

export function DrawerIcon({ onClick, title, iconElement, navigateTo="/" }) {
    const navigate = useNavigate()
    function handleNavigateTo() {
        if (document.startViewTransition) {
            document.startViewTransition(() => flushSync(() => {
                navigate(navigateTo)
            }))
        } else navigate(navigateTo)
    }
    return (
    <div className='flex flex-col w-full items-center'>
        <Button onClick={onClick ?? handleNavigateTo} className='w-fit aspect-5/4' showIcon={true} iconElement={iconElement}/>
        <span className='max-w-full whitespace-nowrap text-ellipsis overflow-hidden'>{title}</span>
    </div>)
}