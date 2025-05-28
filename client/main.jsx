import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '/imports/ui/App';

const qc = new QueryClient();

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
  root.render(
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  );
});
