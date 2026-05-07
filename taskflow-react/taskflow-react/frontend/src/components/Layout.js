// src/components/Layout.js
import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: 220, flex: 1, padding: '32px 36px',
        minHeight: '100vh', overflow: 'auto',
      }}>
        {children}
      </main>
    </div>
  );
}
