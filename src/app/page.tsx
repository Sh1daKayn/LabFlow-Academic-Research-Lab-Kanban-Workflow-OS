'use client';

import React from 'react';
import { LabFlowProvider } from '@/context/LabFlowContext';
import { MainApp } from '@/components/MainApp';

export default function HomePage() {
  return (
    <LabFlowProvider>
      <MainApp />
    </LabFlowProvider>
  );
}
