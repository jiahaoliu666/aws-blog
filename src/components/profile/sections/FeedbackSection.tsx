import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane,
  faSpinner,
  faTag,
  faComment,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';

interface Feedback {
  category: string;
  message: string;
  title: string;
  email: string;
}

interface FeedbackSectionProps {
  feedback: {
    category: string;
    message: string;
  };
  feedbackMessage?: string;
  setFeedback: (newFeedback: any) => void;
  handleSubmitFeedback: () => void;
  isSubmitting: boolean;
  userEmail: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ 
  feedback: initialFeedback,
  feedbackMessage: initialFeedbackMessage,
  setFeedback: setParentFeedback,
  handleSubmitFeedback: onSubmit,
  isSubmitting: initialIsSubmitting,
  userEmail
}) => {
  const [feedback, setFeedback] = useState<Feedback>({
    category: '',
    message: '',
    title: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const categories = [
    '使用體驗',
    '系統錯誤',
    '內容相關',
    '其他'
  ];

  const handleSubmitFeedback = () => {
    // Implement your submit logic here
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">意見反饋</h1>
        <p className="mt-2 text-gray-600">幫助我們提供更好的服務</p>
      </div>

      <div className="space-y-6">
        {/* 電子郵件 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-400">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faEnvelope} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">聯絡信箱</h3>
                <p className="text-sm text-gray-600">您的電子郵件地址</p>
              </div>
            </div>
            <input
              type="email"
              value={userEmail}
              readOnly
              className="w-full p-4 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>

        {/* 標題 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faTag} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">反饋標題</h3>
                <p className="text-sm text-gray-600">請輸入標題描述</p>
              </div>
            </div>
            <input
              type="text"
              value={feedback.title}
              onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
              placeholder="請輸入標題..."
              className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 類別 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faTag} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">反饋類別</h3>
                <p className="text-sm text-gray-600">選擇最符合的類別</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFeedback(prev => ({ ...prev, category }))}
                  className={`p-4 rounded-xl transition-all ${
                    feedback.category === category
                      ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 詳細意見 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faComment} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">詳細意見</h3>
                <p className="text-sm text-gray-600">請描述您的建議或遇到的問題</p>
              </div>
            </div>
            <textarea
              value={feedback.message}
              onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
              placeholder="請描述您的意見或建議..."
              className="w-full h-40 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || !feedback.category || !feedback.message}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl text-white
              ${isSubmitting || !feedback.category || !feedback.message
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 transition-colors'}
            `}
          >
            {isSubmitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>提交中...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} />
                <span>提交反饋</span>
              </>
            )}
          </button>
        </div>

        {/* 提交訊息 */}
        {feedbackMessage && (
          <div className={`p-4 rounded-xl ${
            feedbackMessage.includes('成功')
              ? 'bg-green-50 text-green-800 border-l-4 border-green-500'
              : 'bg-red-50 text-red-800 border-l-4 border-red-500'
          }`}>
            {feedbackMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackSection; 