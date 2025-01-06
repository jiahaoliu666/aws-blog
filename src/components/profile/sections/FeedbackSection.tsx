import React, { useEffect, useState } from 'react';
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
import { useToastContext } from '@/context/ToastContext';

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

interface ValidationErrors {
  title: string;
  category: string;
  content: string;
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
  const categories = ['使用體驗', '系統錯誤', '功能建議', '其他'];
  const { showToast } = useToastContext();
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({
    title: '',
    category: '',
    content: ''
  });
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  useEffect(() => {
    const hasAnyChanges = 
      initialFeedback.title !== '' ||
      initialFeedback.category !== '' ||
      initialFeedback.content !== '' ||
      attachments.length > 0;

    setHasChanges(hasAnyChanges);
  }, [initialFeedback, attachments]);

  const handleCancel = () => {
    resetFeedbackForm();
    setHasChanges(false);
    showToast('已重置表單', 'info');
  };

  useEffect(() => {
    // 組件卸載時清理表單
    return () => {
      resetFeedbackForm();
    };
  }, [resetFeedbackForm]);

  const isSubmitDisabled = () => {
    const isTitleEmpty = !initialFeedback.title.trim();
    const isCategoryEmpty = !initialFeedback.category.trim();
    const isContentEmpty = !initialFeedback.content.trim();
    
    return isTitleEmpty || isCategoryEmpty || isContentEmpty || initialIsSubmitting;
  };

  const validateForm = () => {
    const newErrors = {
      title: !initialFeedback.title.trim() ? '請輸入反饋標題' : '',
      category: !initialFeedback.category.trim() ? '請選擇最符合的反饋分類' : '',
      content: !initialFeedback.content.trim() ? '請輸入您的意見或建議' : ''
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = () => {
    setIsFormSubmitted(true);
    if (validateForm()) {
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <SectionTitle 
          title="意見反饋"
          description="您的建議是我們進步的動力"
        />
      </div>

      <Card>
        <div className="p-6">
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
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={initialFeedback.title}
                    onChange={(e) => {
                      setParentFeedback((prev: Feedback) => ({
                        ...prev,
                        title: e.target.value
                      }));
                      if (isFormSubmitted) {
                        setErrors(prev => ({
                          ...prev,
                          title: e.target.value.trim() ? '' : '請輸入反饋標題'
                        }));
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg transition-colors duration-200
                      ${errors.title ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                      'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="請輸入標題"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title}</p>
                  )}
                </div>
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
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setParentFeedback((prev: Feedback) => ({ 
                            ...prev, 
                            category 
                          }));
                          if (isFormSubmitted) {
                            setErrors(prev => ({
                              ...prev,
                              category: ''
                            }));
                          }
                        }}
                        className={`
                          p-4 rounded-xl transition-all duration-200
                          ${initialFeedback.category === category
                            ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700'
                          }
                          ${errors.category ? 'border-red-500' : ''}
                        `}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  {errors.category && (
                    <p className="text-red-500 text-sm">{errors.category}</p>
                  )}
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
                
                <div className="relative space-y-2">
                  <textarea
                    value={initialFeedback.content}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setParentFeedback((prev: Feedback) => ({ 
                          ...prev, 
                          content: e.target.value 
                        }));
                        if (isFormSubmitted) {
                          setErrors(prev => ({
                            ...prev,
                            content: e.target.value.trim() ? '' : '請輸入您的意見或建議'
                          }));
                        }
                      }
                    }}
                    placeholder="請描述您的意見或建議..."
                    className={`w-full h-40 p-4 bg-gray-50 border-2 rounded-xl resize-none transition-colors duration-200
                      ${errors.content ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                      'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                    maxLength={500}
                  />
                  {errors.content && (
                    <p className="text-red-500 text-sm">{errors.content}</p>
                  )}
                  <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                    {initialFeedback.content.length}/500
                  </div>
                </div>
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
                    <h3 className="text-lg font-semibold text-gray-800">附件上傳 (可選)</h3>
                    <p className="text-sm text-gray-600">可上傳相關的截圖或文件（最多3個）</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {attachments.length < 3 ? (
                    <label className="flex justify-center items-center p-6
                      border-2 border-dashed border-gray-300 rounded-xl
                      hover:border-blue-500 hover:bg-blue-50
                      transition-all duration-200 cursor-pointer">
                      <input
                        type="file"
                        onChange={handleAttachmentChange}
                        className="hidden"
                        multiple
                        accept="image/*"
                      />
                      <div className="text-center">
                        <FontAwesomeIcon icon={faUpload} className="text-2xl text-gray-400 mb-2" />
                        <p className="text-gray-600">至此處點擊上傳</p>
                        <p className="text-sm text-gray-500 mt-1">
                          支援的格式：JPEG、PNG（還可上傳 {3 - attachments.length} 個檔案）
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
                      已達到最大上傳數量（3個檔案）
                    </div>
                  )}

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
            <div className="mt-6 px-6 mr-2 pb-6 -mx-6 border-gray-100">
              <div className="flex justify-end gap-3">
                {hasChanges && (
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 rounded-xl text-gray-700 border border-gray-200
                      hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={initialIsSubmitting}
                  >
                    取消
                  </button>
                )}
                
                <button
                  onClick={handleSubmit}
                  disabled={initialIsSubmitting || isSubmitDisabled()}
                  className={`
                    px-6 py-3
                    rounded-xl
                    flex items-center gap-2
                    transition-all duration-200
                    ${initialIsSubmitting || isSubmitDisabled()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
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
        </div>
      </Card>
    </div>
  );
};

export default FeedbackSection; 