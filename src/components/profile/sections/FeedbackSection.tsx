import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane,
  faSpinner,
  faTag,
  faComment,
  faUpload,
  faXmark,
  faEnvelope,
  faPencil
} from '@fortawesome/free-solid-svg-icons';
import { SectionContainer } from '../common/SectionContainer';
import { Card } from '../common/Card';
import { commonStyles as styles } from '../common/styles';
import { SectionTitle } from '../common/SectionTitle';

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
  resetFeedbackForm: () => void;
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
  resetFeedbackForm,
}) => {
  const categories = ['使用體驗', '系統錯誤', '內容相關', '其他'];

  useEffect(() => {
    // 組件卸載時清理表單
    return () => {
      resetFeedbackForm();
    };
  }, [resetFeedbackForm]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <SectionTitle 
          title="意見反饋"
          description="您的建議是我們進步的動力"
        />
      </div>

      <Card>
        <div className="space-y-6">
          {/* 電子郵件 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 
                  flex items-center justify-center">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">電子郵件</h3>
                  <p className="text-sm text-gray-600">您的聯絡信箱</p>
                </div>
              </div>
              
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
              />
            </div>
          </div>

          {/* 標題輸入 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 
                  flex items-center justify-center">
                  <FontAwesomeIcon icon={faPencil} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">標題</h3>
                  <p className="text-sm text-gray-600">請輸入反饋標題</p>
                </div>
              </div>
              
              <input
                type="text"
                value={initialFeedback.title}
                onChange={(e) => setParentFeedback((prev: Feedback) => ({
                  ...prev,
                  title: e.target.value
                }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="請輸入標題"
              />
            </div>
          </div>

          {/* 反饋類別 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 
                  flex items-center justify-center">
                  <FontAwesomeIcon icon={faTag} />
                </div>
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
                    className={`
                      p-4 rounded-xl transition-all duration-200
                      ${initialFeedback.category === category
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700'
                      }
                    `}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 詳細意見 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 
                  flex items-center justify-center">
                  <FontAwesomeIcon icon={faComment} />
                </div>
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
                className="w-full h-40 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl 
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* 附件上傳 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 
                  flex items-center justify-center">
                  <FontAwesomeIcon icon={faUpload} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">附件上傳</h3>
                  <p className="text-sm text-gray-600">可上傳相關的截圖或文件</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex justify-center items-center p-6
                  border-2 border-dashed border-gray-300 rounded-xl
                  hover:border-blue-500 hover:bg-blue-50
                  transition-all duration-200 cursor-pointer">
                  <input
                    type="file"
                    onChange={handleAttachmentChange}
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <div className="text-center">
                    <FontAwesomeIcon icon={faUpload} className="text-2xl text-gray-400 mb-2" />
                    <p className="text-gray-600">點擊或拖曳檔案至此處上傳</p>
                    <p className="text-sm text-gray-500 mt-1">支援的格式：圖片、PDF、Word</p>
                  </div>
                </label>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 
                        bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1.5 hover:text-red-500 rounded-full
                            hover:bg-red-50 transition-colors duration-200"
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

          {/* 提交按鈕容器 */}
          <div className="mt-6 px-6 mr-2 pb-6 -mx-6 border-gray-100 ">
            <div className="flex justify-end">
              <button
                onClick={onSubmit}
                disabled={initialIsSubmitting}
                className={`
                  px-6 py-3
                  rounded-xl
                  flex items-center gap-2
                  transition-all duration-200
                  ${initialIsSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                  }
                `}
              >
                {initialIsSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    提交反饋
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 提交訊息 */}
          {initialFeedbackMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              initialFeedbackMessage.includes('成功')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {initialFeedbackMessage}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FeedbackSection; 