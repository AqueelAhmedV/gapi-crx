const AlertBox = ({ title, message, btns }) => {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="bg-white p-8 max-w-md w-full rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end">
            {btns.map((btn, index) => (
              <button
                key={index}
                onClick={btn.onClick}
                className={`mr-4 px-4 py-2 rounded ${btn.color} text-white focus:outline-none`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  export default AlertBox;