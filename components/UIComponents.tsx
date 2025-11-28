import React from 'react';
import clsx from 'clsx';
import { ProjectStatus, Priority } from '../types';
import { UploadCloud } from 'lucide-react';

// --- BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', isLoading, className, disabled, ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 border border-transparent",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 focus:ring-indigo-500",
    outline: "bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button 
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

// --- CARD ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={clsx("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)}>
    {children}
  </div>
);

// --- BADGE ---
export const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const styles: Record<ProjectStatus, string> = {
    new: "bg-blue-100 text-blue-800",
    awaiting_assignment: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-purple-100 text-purple-800",
    revision_requested: "bg-orange-100 text-orange-800",
    awaiting_client_review: "bg-teal-100 text-teal-800",
    approved: "bg-green-100 text-green-800",
    on_hold: "bg-slate-100 text-slate-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const labels: Record<ProjectStatus, string> = {
    new: "New",
    awaiting_assignment: "Unassigned",
    in_progress: "In Progress",
    revision_requested: "Revision Requested",
    awaiting_client_review: "Review Ready",
    approved: "Approved",
    on_hold: "On Hold",
    cancelled: "Cancelled",
  };

  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide", styles[status])}>
      {labels[status]}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const styles = {
        normal: "bg-slate-100 text-slate-600",
        high: "bg-orange-50 text-orange-600 border border-orange-200",
        urgent: "bg-red-50 text-red-600 border border-red-200 font-bold",
    };
    return (
        <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs uppercase", styles[priority])}>
            {priority}
        </span>
    );
}

// --- INPUTS ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => (
  <div className="mb-4">
    {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <input 
      id={id}
      className={clsx(
        "block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border transition-all",
        error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "",
        className
      )}
      {...props} 
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const TextArea: React.FC<TextAreaProps> = ({ label, error, className, id, rows = 3, ...props }) => (
  <div className="mb-4">
    {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <textarea 
      id={id}
      rows={rows}
      className={clsx(
        "block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border transition-all",
        error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "",
        className
      )}
      {...props} 
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, error, className, id, options, ...props }) => (
  <div className="mb-4">
    {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <select 
      id={id}
      className={clsx(
        "block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white transition-all",
        error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "",
        className
      )}
      {...props} 
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export const FileUploadZone: React.FC<{
  onFileSelect: (files: FileList | null) => void;
  label?: string;
  accept?: string;
}> = ({ onFileSelect, label = "Upload files", accept }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div 
      className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer"
      onClick={() => inputRef.current?.click()}
    >
      <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
      <p className="mt-2 text-sm font-medium text-slate-900">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Click to select files</p>
      <input 
        type="file" 
        multiple 
        className="hidden" 
        ref={inputRef}
        onChange={(e) => onFileSelect(e.target.files)}
        accept={accept}
      />
    </div>
  );
};