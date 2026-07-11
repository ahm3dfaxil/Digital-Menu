import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isTextArea?: boolean;
  rows?: number;
}

export const Input = forwardRef<HTMLInputElement & HTMLTextAreaElement, InputProps>(
  ({ label, error, helperText, isTextArea = false, className = "", id, type, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const [showPassword, setShowPassword] = useState(false);

    const baseInputStyles = `w-full px-4 py-2.5 bg-white dark:bg-slate-900 border ${
      hasError 
        ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
        : "border-slate-300 dark:border-slate-700 focus:ring-brand-500 focus:border-brand-500"
    } rounded-premium text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all shadow-sm`;

    const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <label 
            htmlFor={inputId} 
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        
        {isTextArea ? (
          <textarea
            id={inputId}
            ref={ref as any}
            className={`${baseInputStyles} resize-none`}
            {...(props as any)}
          />
        ) : (
          <div className="relative w-full">
            <input
              id={inputId}
              ref={ref as any}
              type={inputType}
              className={`${baseInputStyles} ${type === "password" ? "pr-11" : ""}`}
              {...props}
            />
            {type === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}

        {hasError ? (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
