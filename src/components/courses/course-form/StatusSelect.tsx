import Field from './Field';

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const statusOptions = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'UPCOMING', label: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'REGISTRATION_OPEN', label: 'Registration Open', color: 'bg-green-100 text-green-800' },
  { value: 'ONGOING', label: 'Ongoing', color: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-purple-100 text-purple-800' },
  { value: 'ARCHIVED', label: 'Archived', color: 'bg-red-100 text-red-800' },
];

export default function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <Field label="Status">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}