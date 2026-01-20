import { motion } from 'framer-motion';
import { skeletonPulse } from '../utils/animations';

export function SkeletonCard({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={skeletonPulse}
          animate="animate"
          className="bg-gray-900 rounded-lg p-4 border border-gray-800"
        >
          <div className="h-5 bg-gray-800 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-800 rounded w-2/3"></div>
        </motion.div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          variants={skeletonPulse}
          animate="animate"
          className="h-4 bg-gray-800 rounded"
          style={{ width: `${100 - i * 10}%` }}
        ></motion.div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <motion.div
        variants={skeletonPulse}
        animate="animate"
        className="grid grid-cols-4 gap-4 pb-3 border-b border-gray-800"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-800 rounded w-3/4"></div>
        ))}
      </motion.div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <motion.div
          key={rowIdx}
          variants={skeletonPulse}
          animate="animate"
          className="grid grid-cols-4 gap-4 py-2"
        >
          {Array.from({ length: 4 }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-4 bg-gray-800 rounded"
              style={{ width: `${80 - colIdx * 10}%` }}
            ></div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <motion.div
      variants={skeletonPulse}
      animate="animate"
      className={`${sizes[size]} bg-gray-800 rounded-full`}
    ></motion.div>
  );
}

export function SkeletonButton() {
  return (
    <motion.div
      variants={skeletonPulse}
      animate="animate"
      className="h-10 bg-gray-800 rounded-lg w-32"
    ></motion.div>
  );
}
