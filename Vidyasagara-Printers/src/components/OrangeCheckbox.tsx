import React from 'react';

interface OrangeCheckboxProps {
  checked: boolean;
  selectedRow?: boolean;
  onChange: () => void;
  title?: string;
}

export const OrangeCheckbox: React.FC<OrangeCheckboxProps> = ({
  checked,
  selectedRow = false,
  onChange,
  title,
}) => {
  return (
    <button
      type="button"
      title={title}
      aria-checked={checked}
      role="checkbox"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`inline-flex items-center justify-center w-[15px] h-[15px] rounded-[2px] border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F26522]/40 ${
        selectedRow
          ? checked
            ? 'bg-white border-white text-[#F26522]'
            : 'bg-transparent border-white/80 text-transparent'
          : checked
          ? 'bg-[#F26522] border-[#F26522] text-white'
          : 'bg-white border-[#9CA3AF] hover:border-[#F26522] text-transparent'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className="w-[10px] h-[10px]" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="2 6.5 4.8 9.2 10 3" />
        </svg>
      )}
    </button>
  );
};
