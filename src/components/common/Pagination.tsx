// src/components/common/Pagination.tsx  
import React, { useEffect } from 'react';  
import { Pagination as AmplifyPagination } from '@aws-amplify/ui-react';  
import { ArrowUp } from 'lucide-react';  
import "@aws-amplify/ui-react/styles.css";  
import { useTheme } from '@/context/ThemeContext';

interface PaginationProps {  
  currentPage: number;  
  totalPages: number;  
  onPageChange: (newPageIndex?: number) => void;  
  show: boolean;  
}  

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, show }) => {  
  const { isDarkMode } = useTheme();
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

  const [buttonPosition, setButtonPosition] = React.useState(24); // 預設 bottom 位置

  // 檢測底部元素位置並調整按鈕位置
  const adjustButtonPosition = () => {
    const footer = document.querySelector('footer');
    if (footer) {
      const footerRect = footer.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // 當滾動到接近底部時
      if (footerRect.top <= viewportHeight) {
        const newPosition = viewportHeight - footerRect.top + 24; // 24px 為基本間距
        setButtonPosition(Math.min(newPosition, 80)); // 限制最大上移距離為 80px
      } else {
        setButtonPosition(24); // 恢復預設位置
      }
    }
  };

  // 添加滾動監聽函數
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    setShowScrollButton(scrollTop > 300);
    adjustButtonPosition();
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    // 初始化時也要檢查一次
    adjustButtonPosition();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (  
    <div className="flex flex-col items-center mt-6 py-4">  
      <div className={isDarkMode ? 'dark' : ''}>
        <AmplifyPagination  
          currentPage={currentPage}  
          totalPages={totalPages}  
          onNext={() => onPageChange(currentPage + 1)}  
          onPrevious={() => onPageChange(currentPage - 1)}  
          onChange={onPageChange}  
        />  
      </div>

      {showScrollButton && (
        <button  
          style={{ bottom: `${buttonPosition}px` }}
          className={`mt-4 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full shadow-lg transition duration-300 fixed right-4 flex items-center justify-center p-3 z-10`}  
          onClick={scrollToTop}  
        >  
          <ArrowUp size={28} className="text-white" />  
        </button>
      )}
    </div>  
  );  
};  

export default Pagination;