// src/components/common/ErrorMessage.tsx  
import React from 'react';  

interface ErrorMessageProps {  
  message: string;  
}  

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (  
  <div className="bg-red-100 text-red-700 p-3 rounded my-2">  
    <p>{message}</p>  
  </div>  
);  

export default ErrorMessage;