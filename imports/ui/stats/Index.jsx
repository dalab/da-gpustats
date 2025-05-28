import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Meteor } from 'meteor/meteor';


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

  const to  = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: userData, error: userError, loading: userLoading } = useQuery({
    queryKey: ['allUserStatsSummary'],
    queryFn: () => {
      return new Promise((resolve, reject) => {
        Meteor.call('usage/all_users', from.toISOString(), to.toISOString(), (err, res) => {
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
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { data: machineData, error: machineError, loading: machineLoading } = useQuery({
    queryKey: ['allMachineStatsSummary'],
    queryFn: () => {
      return new Promise((resolve, reject) => {
        Meteor.call('usage/all_machines', from.toISOString(), to.toISOString(), (err, res) => {
          console.log('Usage stats response:', res);
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
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const filteredUserData = useMemo(() => {
    if (!userData || !userId) return userData;
    return userData.filter(user => user.id.toLowerCase().includes(userId.toLowerCase()));
  }, [userData, userId]);


  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-zinc-300">Usage stats</h1>

      <h2 className="text-xl font-semibold mb-4 text-zinc-200">Machines</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        { machineData && machineData.length > 0 ? (
          machineData.map((machine) => (
            <Link to={`/stats/${machine.id}`} className="p-3 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors" key={machine.id}>
              <h2 className="font-semibold mb-1 text-zinc-200">
                {machine.id}
              </h2>
              <p className="text-zinc-400 text-sm">Last 7d: {machine.gpuHours.toFixed(2)} GPUh</p>
            </Link>
          ))
        ) : (
          <p className="text-zinc-400">No usage data available.</p>
        )}
        { userError && (
          <p className="text-red-500">Error fetching usage data: {userError.message}</p>
        )}
        { userLoading && (
          <p className="text-zinc-400">Loading...</p>
        )}
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-zinc-200">Users</h2>

      <form className="mb-4" onSubmit={handleSubmit}>
        <input
          placeholder="Search users"
          className="mb-4 p-2 bg-zinc-800 text-zinc-100 rounded"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          type="text"
        />
        <button type="submit" className="ml-2 p-2 bg-blue-600 text-white rounded">Search</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        { filteredUserData && filteredUserData.length > 0 ? (
          filteredUserData.map((user) => (
            <Link to={`/stats/${user.id}`} className="p-3 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors" key={user.id}>
              <h2 className="font-semibold mb-1 text-zinc-200">
                {user.id}
              </h2>
              <p className="text-zinc-400 text-sm">Last 7d: {user.gpuHours.toFixed(2)} GPUh</p>
            </Link>
          ))
        ) : (
          <p className="text-zinc-400">No usage data available.</p>
        )}
        { userError && (
          <p className="text-red-500">Error fetching usage data: {userError.message}</p>
        )}
        { userLoading && (
          <p className="text-zinc-400">Loading...</p>
        )}
      </div>
    </div>
  );
};
