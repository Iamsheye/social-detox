import { useStorage } from '@extension/shared';
import { siteStorage } from '@extension/storage';
import { useLayoutEffect } from 'react';

export default function App() {
  const sites = useStorage(siteStorage);

  const currentSite = sites.find(site => location.hostname.includes(site.domain));

  useLayoutEffect(() => {
    if (currentSite && currentSite.isBlocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [currentSite]);

  return (
    <>
      {currentSite?.isBlocked ? (
        <div className="fixed inset-0 bg-red-100 rounded py-1 px-2 w-screen h-screen flex justify-center items-center z-[100000000] overflow-hidden">
          <div>
            <div className="flex gap-1 text-red-500 text-3xl">
              This site is blocked by <strong className="text-red-700">Social Detox</strong>.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
