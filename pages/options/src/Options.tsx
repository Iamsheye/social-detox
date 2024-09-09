import '@src/Options.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';

const Options = () => {
  return (
    <div className="App-container text-gray-900 bg-slate-50">
      <img src={chrome.runtime.getURL('options/logo_horizontal.svg')} className="App-logo" alt="logo" />
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <div> Loading ... </div>), <div> Error Occur </div>);
