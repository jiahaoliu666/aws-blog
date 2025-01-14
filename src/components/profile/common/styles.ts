export const commonStyles = {
    // 容器相關
    container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    sectionContainer: 'mb-8 sm:mb-12',
    cardContainer: 'bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md',
    
    // 內容區塊
    contentPadding: 'p-4 lg:p-6',
    contentDivider: 'border-b border-gray-100',
    
    // 按鈕基礎樣式
    button: {
      primary: `
        px-4 
        py-2.5 
        bg-blue-600 
        text-white 
        rounded-lg 
        hover:bg-blue-700 
        disabled:opacity-50 
        disabled:cursor-not-allowed
        transition-all 
        duration-150 
        flex 
        items-center 
        gap-2
        sm:px-6
      `,
      
      secondary: `
        px-4 
        py-2.5 
        text-gray-700 
        border 
        border-gray-200 
        rounded-lg
        hover:bg-gray-50 
        hover:text-gray-900 
        hover:border-gray-300
        transition-all 
        duration-150
        sm:px-6
      `
    },
    
    // 主要按鈕
    primaryButton: `
      bg-blue-600 text-white
      hover:bg-blue-700 active:bg-blue-800
      focus:ring-blue-100
    `,
    
    // 次要按鈕
    secondaryButton: `
      bg-gray-100 text-gray-700
      hover:bg-gray-200 active:bg-gray-300
      focus:ring-gray-50
    `,
    
    // 危險按鈕
    dangerButton: `
      bg-red-600 text-white
      hover:bg-red-700 active:bg-red-800
      focus:ring-red-100
    `,
    
    // 輸入框
    input: `
      w-full 
      px-4 
      py-2.5 
      bg-gray-50 
      border 
      border-gray-200 
      rounded-lg
      focus:ring-2 
      focus:ring-blue-500 
      focus:border-blue-500 
      transition-all 
      duration-150
      disabled:opacity-50 
      disabled:cursor-not-allowed
    `,
    
    // 標籤
    label: 'block text-sm sm:text-base text-gray-700 font-medium mb-1.5',
    
    // 圖標容器
    iconWrapper: `
      flex items-center justify-center 
      w-10 h-10 sm:w-12 sm:h-12 rounded-xl
      bg-blue-50 text-blue-600
      transition-all duration-200
    `,
    
    // 狀態標籤
    badge: {
      base: `
        inline-flex items-center gap-1.5 
        px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full
        text-xs sm:text-sm font-medium
        transition-all duration-200
      `,
      success: 'bg-green-50 text-green-700 border border-green-200',
      warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      error: 'bg-red-50 text-red-700 border border-red-200',
      info: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    
    // 表單群組
    formGroup: 'space-y-4 sm:space-y-6',
    
    // 網格布局
    grid: {
      base: 'grid gap-4 sm:gap-6',
      cols2: 'grid-cols-1 sm:grid-cols-2',
      cols3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    },
    
    // 彈性布局
    flex: {
      between: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0',
      center: 'flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6',
      start: 'flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4 sm:gap-6',
      end: 'flex flex-col sm:flex-row justify-end items-end sm:items-center gap-4 sm:gap-6',
    },
    
    // 間距
    spacing: {
      sm: 'gap-2 sm:gap-3',
      md: 'gap-3 sm:gap-4',
      lg: 'gap-4 sm:gap-6',
      xl: 'gap-6 sm:gap-8',
    },
  };