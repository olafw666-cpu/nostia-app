import { motion } from 'framer-motion';
import { fadeIn } from '../utils/animations';

export default function EmptyState({ icon: Icon, title, message, action, className = '' }) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className={`bg-gray-900 p-12 rounded-lg border border-gray-800 text-center ${className}`}
    >
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon size={64} className="text-gray-600" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">{message}</p>
      {action && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
