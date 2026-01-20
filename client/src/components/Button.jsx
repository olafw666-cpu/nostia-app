import { motion } from 'framer-motion';
import { buttonPress } from '../utils/animations';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all relative overflow-hidden flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg shadow-red-500/30',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-400 hover:bg-blue-600/10'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <motion.button
      variants={buttonPress}
      initial="rest"
      whileHover={disabled || loading ? undefined : 'hover'}
      whileTap={disabled || loading ? undefined : 'pressed'}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      className={`${baseClasses} ${variants[variant]} ${disabled || loading ? disabledClasses : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
