export const commonStyles = {
    // 容器相關
    container: 'w-full',
    sectionContainer: 'mb-8',
    cardContainer: 'bg-white rounded-2xl shadow-sm border border-gray-100',
    
    // 內容區塊
    contentPadding: 'p-6 sm:p-8',
    contentDivider: 'border-b border-gray-100',
    
    // 按鈕基礎樣式
    button: `
      px-6 py-2.5 rounded-lg font-medium
      transition-all duration-200
      flex items-center gap-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    // 主要按鈕
    primaryButton: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-4 focus:ring-blue-100
    `,
    
    // 次要按鈕
    secondaryButton: `
      bg-gray-100 text-gray-700
      hover:bg-gray-200
      focus:ring-4 focus:ring-gray-50
    `,
    
    // 危險按鈕
    dangerButton: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-4 focus:ring-red-100
    `,
    
    // 輸入框
    input: `
      w-full px-4 py-3 
      bg-gray-50 border border-gray-200 rounded-lg
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      transition duration-150
    `,
    
    // 標籤
    label: 'block text-gray-700 font-medium mb-1.5',
    
    // 圖標容器
    iconWrapper: `
      flex items-center justify-center 
      w-12 h-12 rounded-xl
      bg-blue-50 text-blue-600
      transition-all duration-200
    `,
    
    // 狀態標籤
    badge: {
      base: `
        inline-flex items-center gap-1.5 
        px-2.5 py-1 rounded-full
        text-sm font-medium
      `,
      success: 'bg-green-50 text-green-700 border border-green-200',
      warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      error: 'bg-red-50 text-red-700 border border-red-200',
      info: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    
    // 表單群組
    formGroup: 'space-y-6',
    
    // 網格布局
    grid: {
      base: 'grid gap-6',
      cols2: 'grid-cols-1 md:grid-cols-2',
      cols3: 'grid-cols-1 md:grid-cols-3',
    },
    
    // 彈性布局
    flex: {
      between: 'flex justify-between items-center',
      center: 'flex justify-center items-center',
      start: 'flex justify-start items-center',
      end: 'flex justify-end items-center',
    },
    
    // 間距
    spacing: {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  };