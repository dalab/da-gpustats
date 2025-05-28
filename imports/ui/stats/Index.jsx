import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
        Plot.line(data, {
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

export default Stats = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  console.log('Search Params:', searchParams);

  const [userId, setUserId] = useState(searchParams.get('userId') || '');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Navigate to the stats page for the specific user
    navigate(`/stats/${userId}`);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-zinc-300">Usage stats</h1>

      <form className="mb-4" onSubmit={handleSubmit}>
        <input
          placeholder="Search by user"
          className="mb-4 p-2 bg-zinc-800 text-zinc-100 rounded"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          type="text"
        />
        <button type="submit" className="ml-2 p-2 bg-blue-600 text-white rounded">Search</button>
      </form>
    </div>
  );
};
