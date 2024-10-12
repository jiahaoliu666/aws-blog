// // src/context/FavoritesContext.tsx  

// import React, { createContext, useContext, useState, ReactNode } from 'react';  
// import { News } from '@/types/newsType';  

// interface FavoritesContextType {  
//   favorites: Record<string, News>;  
//   toggleFavorite: (article: News) => void;  
//   filteredFavoritesCount: number;  
//   filteredFavoriteArticles: News[];  
// }  

// const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);  

// export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {  
//   const [favorites, setFavorites] = useState<Record<string, News>>({});  

//   const toggleFavorite = (article: News) => {  
//     setFavorites((prevFavorites) => {  
//       if (prevFavorites[article.article_id]) {  
//         console.log(`Removing favorite: ${article.article_id}`);  
//         const newFavorites = { ...prevFavorites };  
//         delete newFavorites[article.article_id];  
//         return newFavorites;  
//       } else {  
//         console.log(`Adding favorite: ${article.article_id}`);  
//         return { ...prevFavorites, [article.article_id]: article };  
//       }  
//     });  
//   };  

//   const filteredFavoritesCount = Object.keys(favorites).length;  
//   const filteredFavoriteArticles = Object.values(favorites);  

//   return (  
//     <FavoritesContext.Provider value={{ favorites, toggleFavorite, filteredFavoritesCount, filteredFavoriteArticles }}>  
//       {children}  
//     </FavoritesContext.Provider>  
//   );  
// };  

// export const useFavoritesContext = () => {  
//   const context = useContext(FavoritesContext);  
//   if (!context) {  
//     throw new Error('useFavoritesContext must be used within a FavoritesProvider');  
//   }  
//   return context;  
// };

