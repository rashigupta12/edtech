// components/admin/TableContainer.tsx
import { ReactNode } from "react";

export function TableContainer({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}