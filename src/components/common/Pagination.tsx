// src/components/common/Pagination.tsx  
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

  useEffect(() => {  
    window.addEventListener('keydown', handleKeyDown);  
    return () => {  
      window.removeEventListener('keydown', handleKeyDown);  
    };  
  }, [currentPage, totalPages]);  

  const scrollToTop = () => {  
    window.scrollTo({ top: 0, behavior: 'smooth' });  
  };  

  // 添加 state 來追踪是否顯示按鈕
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  // 添加滾動監聽函數
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    setShowScrollButton(scrollTop > 300); // 當滾動超過 300px 時顯示按鈕
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (  
    <div className="flex flex-col items-center mt-6 py-4">  
      <div className="dark:text-white">
        <AmplifyPagination  
          currentPage={currentPage}  
          totalPages={totalPages}  
          onNext={() => onPageChange(currentPage + 1)}  
          onPrevious={() => onPageChange(currentPage - 1)}  
          onChange={onPageChange}  
          className="
            [&_.amplify-pagination-button]:dark:text-white 
            [&_.amplify-pagination-button]:dark:bg-gray-600
            [&_.amplify-pagination-button]:dark:border-gray-300
            [&_.amplify-pagination-button]:dark:font-semibold
            [&_.amplify-pagination-button]:dark:shadow-lg
            [&_.amplify-pagination-button]:dark:ring-1
            [&_.amplify-pagination-button]:dark:ring-gray-300
            [&_.amplify-pagination-button-active]:dark:bg-blue-500 
            [&_.amplify-pagination-button-active]:dark:text-white
            [&_.amplify-pagination-button-active]:dark:border-blue-400
            [&_.amplify-pagination-button-active]:dark:ring-blue-400
            [&_.amplify-pagination-button-active]:dark:font-bold
            [&_.amplify-pagination-button]:dark:hover:bg-blue-600
            [&_.amplify-pagination-button]:dark:hover:text-white
            [&_.amplify-pagination-button]:dark:hover:border-blue-400
            [&_.amplify-pagination-button]:dark:hover:ring-blue-400
          "
        />  
      </div>

      {showScrollButton && (
        <button  
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition duration-300 fixed right-4 bottom-6 flex items-center justify-center p-3"  
          onClick={scrollToTop}  
        >  
          <ArrowUp size={28} className="text-white" />  
        </button>
      )}
    </div>  
  );  
};  

export default Pagination;