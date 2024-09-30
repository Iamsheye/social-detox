import { useState } from 'react';
import { withErrorBoundary, withSuspense, useStorage, formatTime } from '@extension/shared';
import { siteStorage } from '@extension/storage';
import {
  X,
  Download,
  Search,
  Clock,
  Input,
  Button,
  ArrowUpDown,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  CardContent,
  Card,
  ChevronDown,
  EyeOff,
  Eye,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@extension/ui';
import '@src/Options.css';

type SortOptions = 'time' | 'timeReverse' | 'alpha' | 'alphaReverse';

const Options = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOptions>('time');
  const domains = useStorage(siteStorage);

  const filteredAndSortedDomains = domains
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

  const exportToCSV = () => {
    const header = ['Domain', 'Is Blocked', 'Daily Limit', 'Date', 'Time Spent'].join(',');

    const rows = domains.flatMap(site =>
      site.dateTracking.map(tracking =>
        [site.domain, site.isBlocked, site.dailyLimit ?? '', tracking.date, tracking.timeSpent].join(','),
      ),
    );

    const csvContent = [header, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'social_detox-data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeDropdownClassName = (value: string) => (sortBy === value ? 'bg-slate-500 text-white cursor-pointer' : '');

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 flex items-center justify-center gap-4">
        <h1 className="text-3xl font-bold text-center font-permanent_marker">Social Detox Settings</h1>
        <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center gap-1.5">
          <Download size={18} />
          <span>Export to CSV</span>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
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
                  <Button variant="outline" size="icon">
                    <ArrowUpDown size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white">
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
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="px-4 py-2">
          <div className="space-y-4">
            {filteredAndSortedDomains.map(domain => (
              <Collapsible key={domain.id} style={{ marginTop: 0 }} className="border-b last:border-b-0">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div>
                      <p className="font-medium">{domain.domain}</p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Clock size={14} className="mr-1" />
                        {formatTime(domain.dailyTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={domain.dailyLimit || ''}
                      onChange={async e => {
                        const value = e.target.value;

                        await siteStorage.update(domain.id, {
                          dailyLimit: value ? parseInt(value) : null,
                        });
                      }}
                      min="0"
                      placeholder="Daily Limit (minutes)"
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      className={`flex items-center gap-1 ${domain.isTrackingAllowed ? 'bg-gray-300 hover:bg-gray-400 text-gray-700' : 'text-white bg-green-500 hover:bg-green-600'}`}
                      onClick={async () => {
                        await siteStorage.update(domain.id, { isTrackingAllowed: !domain.isTrackingAllowed });
                      }}
                      disabled={domain.isBlocked}>
                      {domain.isTrackingAllowed ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{domain.isTrackingAllowed ? 'Disable Tracking' : 'Enable Tracking'}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={domain.isBlocked ? 'secondary' : 'destructive'}
                      onClick={async () => {
                        await siteStorage.update(domain.id, { isBlocked: !domain.isBlocked });
                      }}
                      className={
                        domain.isBlocked
                          ? 'bg-gray-300 text-gray-700 hover:bg-gray-400 flex items-center gap-1'
                          : 'flex items-center gap-1'
                      }>
                      <X />
                      {domain.isBlocked ? 'Unblock' : 'Block'}
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                        <span>View Tracking History</span>
                        <ChevronDown size={14} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="my-2 px-6 space-y-2">
                    <h4 className="font-semibold text-sm">Tracking History</h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Time Spent(last 30 days)</span>
                      <span>{formatTime(domain.dateTracking.reduce((acc, curr) => acc + curr.timeSpent, 0))}</span>
                    </div>
                    {domain.dateTracking.map(entry => (
                      <div key={entry.date} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {entry.date === new Date().toISOString().split('T')[0]
                            ? 'Today'
                            : new Date(entry.date).toDateString()}
                        </span>

                        <span>{formatTime(entry.timeSpent)}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="w-full text-xs fixed bottom-0 left-0 py-1.5 bg-[#f9fafb]">
        <p className="text-center">
          Created with ❤️ by{' '}
          <a target="_blank" rel="noreferrer" href="https://github.com/Iamsheye" className="underline font-semibold">
            Sheye
          </a>{' '}
          |{' '}
          <a rel="noreferrer" target="_blank" href="https://buymeacoffee.com/sheye" className="underline font-semibold">
            Support me
          </a>
        </p>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <div> Loading ... </div>), <div> Error Occur </div>);
