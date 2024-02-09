// LowerBar.js

import { ArrowPathRoundedSquareIcon, ArrowUturnLeftIcon, Cog6ToothIcon } from '@heroicons/react/20/solid';
import React from 'react';


const LowerBar = ({ handleGoBack, utilityBtns }) => {
  return (
    <div className="p-4 fixed  bottom-0 left-0 h-fit w-full bg-[#111] bg-opacity-70 flex justify-around items-center shadow-md">
      <button onClick={handleGoBack} className="text-white focus:outline-none hover:text-gray-500 transition">
        <ArrowUturnLeftIcon className="h-7 w-7"/>
      </button>
      {utilityBtns && (utilityBtns.map((uBtn, i) => (
        <button key={i} onClick={uBtn.handleClick} className="text-white focus:outline-none hover:text-gray-500 transition">
            {uBtn.iconElement}
        </button>
      )))}
    </div>
  );
};

export default LowerBar;
