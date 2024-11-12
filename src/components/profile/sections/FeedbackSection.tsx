import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane,
  faSpinner,
  faTag,
  faComment,
  faEnvelope,
  faUpload,
  faXmark
} from '@fortawesome/free-solid-svg-icons';

interface Feedback {
  category: string;
  content: string;
  title: string;
  email: string;
}

interface FeedbackSectionProps {
  feedback: {
    category: string;
    content: string;
    title: string;
  };
  feedbackMessage?: string;
  setFeedback: (newFeedback: any) => void;
  handleSubmitFeedback: () => void;
  isSubmitting: boolean;
  userEmail: string;
  attachments: File[];
  handleAttachmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ 
  feedback: initialFeedback,
  feedbackMessage: initialFeedbackMessage,
  setFeedback: setParentFeedback,
  handleSubmitFeedback: onSubmit,
  isSubmitting: initialIsSubmitting,
  userEmail,
  attachments,
  handleAttachmentChange,
  removeAttachment,
}) => {
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
                <h3 className="text-lg font-semibold text-gray-800">郵件信箱</h3>
                <p className="text-sm text-gray-600">寄出的電子郵件地址</p>
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
              value={initialFeedback.title}
              onChange={(e) => setParentFeedback((prev: Feedback) => ({ 
                ...prev, 
                title: e.target.value 
              }))}
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
                  onClick={() => setParentFeedback((prev: Feedback) => ({ 
                    ...prev, 
                    category 
                  }))}
                  className={`p-4 rounded-xl transition-all ${
                    initialFeedback.category === category
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
              value={initialFeedback.content}
              onChange={(e) => setParentFeedback((prev: Feedback) => ({ 
                ...prev, 
                content: e.target.value 
              }))}
              placeholder="請描述您的意見或建議..."
              className="w-full h-40 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* 添加附件上傳區域 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faUpload} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">上傳附件</h3>
                <p className="text-sm text-gray-600">可上傳截圖或相關文件</p>
              </div>
            </div>

            {/* 文件上傳按鈕 */}
            <div className="flex flex-col gap-4">
              <label className="flex items-center justify-center w-full h-32 px-4 transition bg-gray-50 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-100 cursor-pointer">
                <div className="flex flex-col items-center">
                  <FontAwesomeIcon icon={faUpload} className="w-8 h-8 text-gray-400" />
                  <p className="pt-1 text-sm tracking-wider text-gray-400">
                    點擊上傳圖片
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    支援 JPEG、PNG 格式
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => handleAttachmentChange(e)}
                  accept="image/jpeg,image/png"
                />
              </label>

              {/* 已上傳文件列表 */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-600 truncate">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:text-red-500"
                        title="移除文件"
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end">
          <button
            onClick={onSubmit}
            disabled={initialIsSubmitting || !initialFeedback.category || !initialFeedback.content}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl text-white
              ${initialIsSubmitting || !initialFeedback.category || !initialFeedback.content
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 transition-colors'}
            `}
          >
            {initialIsSubmitting ? (
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
        {initialFeedbackMessage && (
          <div className={`p-4 rounded-xl ${
            initialFeedbackMessage.includes('成功')
              ? 'bg-green-50 text-green-800 border-l-4 border-green-500'
              : 'bg-red-50 text-red-800 border-l-4 border-red-500'
          }`}>
            {initialFeedbackMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackSection; 