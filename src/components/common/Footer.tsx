// src/components/common/Footer.tsx
const Footer: React.FC = () => {  
  return (  
    <footer className="bg-gray-800 text-white py-4">  
      <div className="container mx-auto text-center">  
        <p>&copy; {new Date().getFullYear()} AWS Blog Reader. All rights reserved.</p>  
        <div className="mt-2">  
          <a href="#" className="text-white mx-2 hover:underline">Facebook</a>  
          <a href="#" className="text-white mx-2 hover:underline">Twitter</a>  
          <a href="#" className="text-white mx-2 hover:underline">LinkedIn</a>  
        </div>  
      </div>  
    </footer>  
  );  
};  

export default Footer;