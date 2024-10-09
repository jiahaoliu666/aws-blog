
// // import React, { useState } from 'react';  
// // import { News } from '../dynamoDB/newsType';   

// // interface BlogSearchProps {  
// //   articles: News[];  
// //   setFilteredArticles: React.Dispatch<React.SetStateAction<News[]>>;  
// //   isDarkMode: boolean;   
// // }  

// // const BlogSearch: React.FC<BlogSearchProps> = ({ articles, setFilteredArticles, isDarkMode }) => {  
// //   const [searchTerm, setSearchTerm] = useState('');  

// //   const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {  
// //     const term = event.target.value;  
// //     setSearchTerm(term);  
// //     const filtered = articles.filter((article) =>   
// //       article.title.toLowerCase().includes(term.toLowerCase()) // 使用 title 進行搜尋，忽略大小寫  
// //     );  
// //     setFilteredArticles(filtered);  
// //   };  

// //   return (  
// //     <div className="mb-4">  
// //       <input   
// //         type="text"  
// //         placeholder="搜尋文章..."  
// //         value={searchTerm}  
// //         onChange={handleSearch}  
// //         className={`border rounded p-2 w-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900'}`}  
// //       />  
// //     </div>  
// //   );  
// // };  

// // export default BlogSearch;

// import React, { useState } from 'react';  
// import { News } from '../dynamoDB/newsType';   

// interface BlogSearchProps {  
//   articles: News[];  
//   setFilteredArticles: React.Dispatch<React.SetStateAction<News[]>>;  
//   isDarkMode: boolean;   
// }  

// const BlogSearch: React.FC<BlogSearchProps> = ({ articles, setFilteredArticles, isDarkMode }) => {  
//   const [searchTerm, setSearchTerm] = useState('');  

//   const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {  
//     const term = event.target.value;  
//     setSearchTerm(term);  

//     if (term === '') {  
//       // 如果搜尋字串為空，重置為所有文章  
//       setFilteredArticles(articles);  
//     } else {  
//       const filtered = articles.filter((article) =>   
//         article.title.toLowerCase().includes(term.toLowerCase()) // 使用 title 進行搜尋，忽略大小寫  
//       );  
//       setFilteredArticles(filtered);  
//     }  
//   };  

//   return (  
//     <div className="mb-4">  
//       <input   
//         type="text"  
//         placeholder="搜尋文章..."  
//         value={searchTerm}  
//         onChange={handleSearch}  
//         className={`border rounded p-2 w-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900'}`}  
//       />  
//     </div>  
//   );  
// };  

// export default BlogSearch;

import React, { useState } from 'react';  
import { News } from '../dynamoDB/newsType';   

interface BlogSearchProps {  
  articles: News[];  
  setFilteredArticles: React.Dispatch<React.SetStateAction<News[]>>;  
  isDarkMode: boolean;   
}  

const BlogSearch: React.FC<BlogSearchProps> = ({ articles, setFilteredArticles, isDarkMode }) => {  
  const [searchTerm, setSearchTerm] = useState('');  

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {  
    const term = event.target.value;  
    setSearchTerm(term);  

    const filtered = articles.filter((article) =>   
      article.title.toLowerCase().includes(term.toLowerCase()) // 使用 title 進行搜尋，忽略大小寫  
    );  
    setFilteredArticles(filtered);  
  };  

  return (  
    <div className="mb-4">  
      <input   
        type="text"  
        placeholder="搜尋文章..."  
        value={searchTerm}  
        onChange={handleSearch}  
        className={`border rounded p-2 w-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900'}`}  
      />  
    </div>  
  );  
};  

export default BlogSearch;