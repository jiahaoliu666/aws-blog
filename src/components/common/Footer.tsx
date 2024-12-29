import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/router';

const Footer: React.FC = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const isHomePage = router.pathname === '/';
  
  return (
    <footer className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-800'} text-white ${isHomePage ? 'py-8' : 'py-4'} shadow-inner`}>
      <div className="container mx-auto px-4">
        {isHomePage ? (
          // 首頁三欄式布局
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 關於我們 */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-4">關於 AWS Blog 365</h3>
              <p className="text-gray-400 text-sm">
                提供最新的 AWS 相關資訊、技術文章與解決方案，
                幫助您更好地運用 AWS 服務。
              </p>
            </div>

            {/* 快速連結 */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">實用連結</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/history" className="text-gray-400 hover:text-white text-sm transition duration-300">
                    版本歷史
                  </Link>
                </li>
                <li>
                  <a href="https://aws.amazon.com/tw/" target="_blank" rel="noopener noreferrer" 
                     className="text-gray-400 hover:text-white text-sm transition duration-300">
                    AWS 官方網站
                  </a>
                </li>
                <li>
                  <a href="https://docs.aws.amazon.com/" target="_blank" rel="noopener noreferrer"
                     className="text-gray-400 hover:text-white text-sm transition duration-300">
                    AWS 文件
                  </a>
                </li>
              </ul>
            </div>

            {/* 版權資訊 */}
            <div className="text-center md:text-right">
              <h3 className="text-lg font-semibold mb-4">聯絡資訊</h3>
              <p className="text-gray-400 text-sm mb-2">support@awsblog365.com</p>
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} AWS Blog 365
                <br />
                All Rights Reserved.
              </p>
            </div>
          </div>
        ) : (
          // 其他頁面單列布局
          <div className="flex justify-center items-center space-x-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} AWS Blog 365 All Rights Reserved.
            </p>
            <span className="text-gray-600">|</span>
            <Link href="/history" className="text-gray-400 hover:text-white text-sm transition duration-300">
              版本歷史
            </Link>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;