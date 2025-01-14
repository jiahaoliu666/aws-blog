// src/components/common/ErrorMessage.tsx  
import React from 'react';  

interface ErrorMessageProps {  
  message: string;  
}  

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {  
  console.log("Rendering ErrorMessage with:", message); // 調試輸出  
  return (  
    <div className="text-red-500 mb-5 bg-red-100 p-2 rounded">  
      {message}  
    </div>  
  );  
};  

export default ErrorMessage;  