import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import Home from './Home.jsx';
import Stats from './stats/Index.jsx';
import User from './stats/User.jsx';

export const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />
    },
    {
      path: "/stats",
      element: <Stats />,
      children: [
      ]
    },
    {
      path: "/stats/:userId",
      element: <User />,
    }
  ]);

  // console.log('GPU Usage per User:', gpuUsage);
  return (
    <div className="p-4 bg-zinc-900 text-zinc-100 font-mono min-h-screen">
      <RouterProvider router={router} />
    </div>
  );
};
