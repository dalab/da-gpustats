import { useQuery } from '@tanstack/react-query';

export async function useGpuUsagePerUser(from, to, unit = "hour", timezone = "CET", options = {}) {

  return (() => {useQuery({
    queryKey: ['gpuUsagePerUser', {
      from: from.toISOString(),
      to: to.toISOString(),
      unit,
      timezone,
    }],
    queryFn: () => {
      return new Promise((resolve, reject) => {
        Meteor.call('usage/by_user', from, to, unit, timezone, (err, res) => {
          err ? reject(err) : resolve(res);
        });
      });
    },
    ...options,
  })})()
}
