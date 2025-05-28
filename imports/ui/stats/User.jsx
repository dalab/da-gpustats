import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import * as Plot from "@observablehq/plot";
import * as d3 from 'd3';


function useWidth(ref) {
  const [width, setWidth] = useState(false);
  if (typeof window != 'undefined') { // Client only.
    useEffect(() => {
      let recalcWidth = () => {
        let w = ref?.current?.offsetWidth || 0;
        setWidth(w);
      };
      // Recalculate on window resize.
      window.addEventListener('resize', recalcWidth);
    }, [ref]);

    useLayoutEffect(() => {
      let w = ref?.current?.offsetWidth || 0;
      setWidth(w);
    }, [ref]);
  }
  return width ? width : 0;
}

export const UsagePlot = ({ data, from, to, timeFormat = null, interval = d3.utcHour }) => {
  const containerRef = React.useRef(null);
  const plotWidth = useWidth(containerRef);

  console.log(Plot.utcInterval("day"))

  const formatter = (d) => {
    return timeFormat ? d3.timeFormat(timeFormat)(d) : d.toISOString();
  }

  useEffect(() => {
    if (!data) {
      containerRef.current.innerHTML = ''; // Clear previous plot
      return;
    }
    const plot = Plot.plot({
      y: {grid: true, label: "GPUh"},
      // x: {label: "Time", interval: 3600000, type: "utc"},
      x: {grid: false, label: "Time", tickFormat: formatter, domain: [from, to], type: "utc"},
      width: plotWidth,
      marks: [
        Plot.ruleY([0]),
        Plot.rectY(data, {
          x: {value: "bucket", type: "utc", interval: interval},
          y: "gpuHours",
          // interval: interval,
          tip: {
            fill: "var(--color-zinc-800)",
            fillOpacity: 0.8,
            stroke: "var(--color-zinc-700)",
            strokeOpacity: 0.8,
            format: {
              x: d => formatter(d),
              y: d => `${d.toFixed(2)}h`,
            }
          },
          ry2: 4,
          ry1: -4,
          // clip: "frame",
          fill: "var(--color-blue-400)",
          fillOpacity: 0.5,
          insetLeft: 4,
          insetRight: 4,
        }),
      ]
    });
    containerRef.current.innerHTML = ''; // Clear previous plot
    containerRef.current.append(plot);
  }, [data, plotWidth]);


  return (
    <div className="w-full" ref={containerRef} />
  );
};

export default User = () => {
  const params = useParams();


  const hourlyTo  = new Date();
  hourlyTo.setMinutes(0, 0, 0, 0); // set to the start of the current hour
  hourlyTo.setHours(hourlyTo.getHours() + 1); // get the end of the current hour by adding one hour
  const hourlyFrom = new Date(hourlyTo.getTime() - 25 * 60 * 60 * 1000);
  console.log('hourlyFrom/hourlyTo:', hourlyFrom, hourlyTo);

  const { data: hourlyUsage, error: hourlyError, loading: hourlyLoading } = useQuery({
    queryKey: ['userStatsHourly', params.userId],
    queryFn: () => {
      return new Promise((resolve, reject) => {
        Meteor.call('usage/by_user', params.userId, hourlyFrom.toISOString(), hourlyTo.toISOString(), "hour", "CET", (err, res) => {
          if (err) {
            console.error('Error fetching user stats:', err);
            reject(err);
          } else {
            console.log('User stats fetched:', res);
            resolve(res);
          }
        });
      });
    },
    enabled: !!params.userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });


  // from 30 days ago until end of today
  // get enf of today by setting hours, minutes, seconds and milliseconds to 0 and adding 1 day
  const dailyTo = new Date();
  dailyTo.setHours(0, 0, 0, 0);
  dailyTo.setDate(dailyTo.getDate() + 1); // add one day to get the end of today
  const dailyFrom = new Date(dailyTo.getTime() - 31 * 24 * 60 * 60 * 1000);
  console.log('dailyFrom/dailyTo:', dailyFrom, dailyTo);

  const { data: dailyUsage, error: dailyError, loading: dailyLoading } = useQuery({
    queryKey: ['userStatsDaily', params.userId],
    queryFn: () => {
      return new Promise((resolve, reject) => {
        Meteor.call('usage/by_user', params.userId, dailyFrom.toISOString(), dailyTo.toISOString(), "day", "CET", (err, res) => {
          if (err) {
            console.error('Error fetching user stats:', err);
            reject(err);
          } else {
            console.log('User stats fetched:', res);
            resolve(res);
          }
        });
      });
    },
    enabled: !!params.userId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-zinc-300">Usage stats</h1>

      {params.userId && (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-zinc-200">
              Hourly usage
            </h2>
            {hourlyError && <div className="text-red-500">Error fetching data: {hourlyError.message}</div>}
            {hourlyLoading ? (
              <div className="text-zinc-400">Loading...</div>
            ) : (
              <UsagePlot data={hourlyUsage} timeFormat="%H:%M" from={hourlyFrom} to={hourlyTo} interval={Plot.utcInterval("hour")} />
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-zinc-200">
              Daily usage
            </h2>
            {dailyError && <div className="text-red-500">Error fetching data: {dailyError.message}</div>}
            {dailyLoading ? (
              <div className="text-zinc-400">Loading...</div>
            ) : (
              <UsagePlot data={dailyUsage} timeFormat="%B %d" from={dailyFrom} to={dailyTo} interval={Plot.utcInterval("day")} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
