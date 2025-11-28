import { ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
}

export default function Field({ label, children, required = false }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}