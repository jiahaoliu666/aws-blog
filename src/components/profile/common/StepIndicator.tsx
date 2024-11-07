import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

type VerificationStep = 'idle' | 'verifying' | 'confirming' | 'complete';

interface StepIndicatorProps {
  step: VerificationStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step }) => {
  const steps = [
    { key: 'idle', label: '加入好友' },
    { key: 'verifying', label: '輸入 LINE ID' },
    { key: 'confirming', label: '驗證身份' },
    { key: 'complete', label: '完成綁定' }
  ];

  const getStepProgress = (currentStep: VerificationStep) => {
    const stepOrder = {
      'idle': 0,
      'verifying': 1,
      'confirming': 2,
      'complete': 3
    };
    return stepOrder[currentStep];
  };

  const currentProgress = getStepProgress(step);

  return (
    <div className="relative mb-8">
      <div className="absolute top-5 w-full h-1 bg-gray-200">
        <div 
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ 
            width: `${(currentProgress / (steps.length - 1)) * 100}%` 
          }}
        />
      </div>
      
      <div className="relative flex justify-between">
        {steps.map((s, index) => {
          const isCompleted = currentProgress > index;
          const isCurrent = currentProgress === index;
          
          return (
            <div 
              key={s.key}
              className="flex flex-col items-center"
            >
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  mb-2 transition-colors duration-300 z-10
                  ${isCurrent ? 'bg-blue-500 text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-500'}
                `}
              >
                {isCompleted ? (
                  <FontAwesomeIcon icon={faCheck} />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-sm ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator; 