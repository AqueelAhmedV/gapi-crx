import { useState, useEffect } from 'react'
import './index.css'
import { LoadingSpinner } from './Icons'

export function Button({ 
    innerText, 
    fillColor='purple', 
    textColor='white', 
    onClick, 
    loading,
    showIcon,
    iconElement,
    title,
    className,
    ...props
    }) {

    return (
    <button onDoubleClick={(e) => e.stopPropagation()} {...props} title={title}  onClick={onClick} type="button" className={`select-none focus:outline-none text-white bg-teal-700 
    hover:bg-teal-800 active:ring-1 active:ring-teal-300 font-medium rounded-lg 
    text-sm px-5 py-2.5 mb-2 dark:bg-teal-600 dark:hover:bg-teal-700 
    dark:focus:ring-teal-900 ` + (className ?? '')}
    >
    {
        showIcon && (iconElement)
    }
    {
        loading && (<LoadingSpinner/>)
    }
    <span className=''>{innerText}</span></button>)
}