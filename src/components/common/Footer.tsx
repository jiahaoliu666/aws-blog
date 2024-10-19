// src/components/common/Footer.tsx
const Footer: React.FC = () => {  
  return (  
    <footer className="bg-gray-900 text-white py-4 shadow-inner">  
      <div className="container mx-auto text-center">  
        <p>&copy; {new Date().getFullYear()} AWS Blog . All rights reserved.</p>  
      </div>  
    </footer>  
  );  
};  

export default Footer;