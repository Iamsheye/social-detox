import { useState } from 'react';
import { siteStorage } from '@extension/storage';
import { useStorage, withErrorBoundary, withSuspense, formatTime } from '@extension/shared';
import {
  Settings,
  Search,
  Clock,
  Input,
  Button,
  EyeOff,
  Eye,
  ArrowUpDown,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@extension/ui';
import '@src/Popup.css';

type SortOptions = 'time' | 'timeReverse' | 'alpha' | 'alphaReverse';

const Popup = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOptions>('time');
  const domains = useStorage(siteStorage);

  const filteredDomains = domains
    .filter(domain => domain.domain.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'time') {
        return b.dailyTime - a.dailyTime;
      } else if (sortBy === 'alpha') {
        return a.domain.localeCompare(b.domain);
      } else if (sortBy === 'alphaReverse') {
        return b.domain.localeCompare(a.domain);
      } else {
        // 'timeReverse'
        return a.dailyTime - b.dailyTime;
      }
    });

  const activeDropdownClassName = (value: string) => (sortBy === value ? 'bg-slate-500 text-white cursor-pointer' : '');

  return (
    <div className="w-[300px] h-[400px] overflow-hidden">
      <div className="p-4 flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Social Detox</h1>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search domains"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 w-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-white">
                <ArrowUpDown size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className={activeDropdownClassName('time')} onClick={() => setSortBy('time')}>
                Time (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem
                className={activeDropdownClassName('timeReverse')}
                onClick={() => setSortBy('timeReverse')}>
                Time (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem className={activeDropdownClassName('alpha')} onClick={() => setSortBy('alpha')}>
                A-Z
              </DropdownMenuItem>
              <DropdownMenuItem
                className={activeDropdownClassName('alphaReverse')}
                onClick={() => setSortBy('alphaReverse')}>
                Z-A
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <a href={`chrome-extension://${chrome.runtime.id}/options/index.html`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="icon">
              <Settings size={18} />
            </Button>
          </a>
        </div>

        <div className="flex-grow overflow-y-auto">
          {filteredDomains.map(domain => (
            <div key={domain.domain} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>
                <p className="font-medium">{domain.domain}</p>
                <p className="text-sm text-gray-500 flex items-center">
                  <Clock size={14} className="mr-1" />
                  {formatTime(domain.dailyTime)}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await siteStorage.update(domain.id, { isTrackingAllowed: domain.isTrackingAllowed ? false : true });
                  }}
                  // className="text-white bg-green-500 hover:bg-green-600 flex items-center gap-1"
                  className={`flex items-center gap-1 ${domain.isTrackingAllowed ? 'bg-gray-300 hover:bg-gray-400 text-gray-700' : 'text-white bg-green-500 hover:bg-green-600'}`}>
                  {domain.isTrackingAllowed ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{domain.isTrackingAllowed ? 'Off' : 'On'}</span>
                </Button>

                <Button
                  variant={domain.isBlocked ? 'secondary' : 'destructive'}
                  size="sm"
                  onClick={async () => {
                    await siteStorage.update(domain.id, { isBlocked: domain.isBlocked ? false : true });
                  }}
                  className={domain.isBlocked ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' : ''}>
                  {domain.isBlocked ? 'Unblock' : 'Block'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
