// src/components/Pagination.tsx  
import React, { useEffect } from 'react';  
import { Pagination as AmplifyPagination } from '@aws-amplify/ui-react';  
import { ArrowUp } from 'lucide-react';  
import "@aws-amplify/ui-react/styles.css";  

interface PaginationProps {  
  currentPage: number;  
  totalPages: number;  
  onPageChange: (newPageIndex?: number) => void;  
  show: boolean;  
}  

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, show }) => {  
  if (!show) return null;  

  // 鍵盤事件處理函數  
  const handleKeyDown = (event: KeyboardEvent) => {  
    if (event.key === 'ArrowRight') {  
      if (currentPage < totalPages) {  
        onPageChange(currentPage + 1);  
      }  
    } else if (event.key === 'ArrowLeft') {  
      if (currentPage > 1) {  
        onPageChange(currentPage - 1);  
      }  
    }  
  };  

  // 使用 useEffect 來添加和清除鍵盤事件監聽器  
  useEffect(() => {  
    window.addEventListener('keydown', handleKeyDown);  
    return () => {  
      window.removeEventListener('keydown', handleKeyDown);  
    };  
  }, [currentPage, totalPages]);  

  // 回到頂部的功能  
  const scrollToTop = () => {  
    window.scrollTo({ top: 0, behavior: 'smooth' });  
  };  

  return (  
    <div className="flex flex-col items-center mt-6 py-4">  
      <AmplifyPagination  
        currentPage={currentPage}  
        totalPages={totalPages}  
        onNext={() => onPageChange(currentPage + 1)}  
        onPrevious={() => onPageChange(currentPage - 1)}  
        onChange={onPageChange}  
      />  
      <button  
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition duration-300 fixed right-4 bottom-6 flex items-center justify-center p-3"  
        onClick={scrollToTop}  
      >  
        <ArrowUp size={28} className="text-white" /> {/* 增大箭頭圖標的大小 */}  
      </button>  
    </div>  
  );  
};  

export default Pagination;