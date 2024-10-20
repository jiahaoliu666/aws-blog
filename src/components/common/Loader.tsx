import React from 'react';
import { Loader as AmplifyLoader } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <AmplifyLoader className="mb-4" size="large" />
    </div>
  );
};

export default Loader;
