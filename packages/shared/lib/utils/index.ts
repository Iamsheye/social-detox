export * from './shared-types';

export const formatTime = (time: number) => {
  const days = Math.floor(time / 86400);
  const hours = Math.floor((time % 86400) / 3600);
  const minutes = Math.floor((time % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};
