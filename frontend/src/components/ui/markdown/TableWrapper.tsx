'use client';

import type { ReactNode } from 'react';

interface TableWrapperProps {
  children: ReactNode;
}

export default function TableWrapper({ children }: TableWrapperProps) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-cosmic-frost/10">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
