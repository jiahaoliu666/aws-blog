import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSmile, 
  faMeh, 
  faFrown,
  faPaperPlane,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

interface FeedbackSectionProps {
  feedback: {
    rating: number;
    category: string;
    message: string;
  };
  setFeedback: React.Dispatch<React.SetStateAction<{
    rating: number;
    category: string;
    message: string;
  }>>;
  handleSubmitFeedback: () => void;
  isSubmitting: boolean;
  feedbackMessage?: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  feedback,
  setFeedback,
  handleSubmitFeedback,
  isSubmitting,
  feedbackMessage
}) => {
  const categories = [
    '功能建議',
    '使用體驗',
    '系統錯誤',
    '內容相關',
    '其他'
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">意見反饋</h1>

      <div className="space-y-6">
        {/* 評分 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">整體評分</h2>
          <div className="flex justify-center space-x-8">
            {[1, 2, 3].map((rating) => (
              <button
                key={rating}
                onClick={() => setFeedback(prev => ({ ...prev, rating }))}
                className={`p-4 rounded-full transition-all ${
                  feedback.rating === rating
                    ? 'bg-blue-100 text-blue-600 scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FontAwesomeIcon 
                  icon={rating === 1 ? faFrown : rating === 2 ? faMeh : faSmile}
                  className="text-3xl"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 類別 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">反饋類別</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFeedback(prev => ({ ...prev, category }))}
                className={`p-3 rounded-lg transition-all ${
                  feedback.category === category
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 詳細意見 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">詳細意見</h2>
          <textarea
            value={feedback.message}
            onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
            placeholder="請描述您的意見或建議..."
            className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || !feedback.category || !feedback.message}
            className={`
              flex items-center space-x-2 px-6 py-3 rounded-full text-white
              ${isSubmitting || !feedback.category || !feedback.message
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'}
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
          <div className={`p-4 rounded-lg ${
            feedbackMessage.includes('成功')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {feedbackMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackSection; 