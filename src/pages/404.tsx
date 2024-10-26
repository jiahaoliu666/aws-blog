import React from 'react';
import Link from 'next/link';

const Custom404: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 items-center justify-center">
            <img src="/kuku.png" alt="哭哭圖" className="mb-6 w-48 h-48" />
            <h1 className="text-5xl font-extrabold text-center mb-6 text-gray-900 drop-shadow-lg">
                404 - 找不到頁面
            </h1>
            <p className="text-xl text-center mb-6 text-gray-800 max-w-2xl leading-relaxed">
                抱歉，我們無法找到您要查找的頁面。
            </p>
            <Link href="/" legacyBehavior>
                <a className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105 hover:bg-blue-700">
                    返回首頁
                </a>
            </Link>
        </div>
    );
};

export default Custom404;
