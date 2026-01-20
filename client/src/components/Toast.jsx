import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1F2937',
          color: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #374151',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '500px',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFFFFF',
          },
          style: {
            borderLeftWidth: '4px',
            borderLeftColor: '#10B981',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#FFFFFF',
          },
          style: {
            borderLeftWidth: '4px',
            borderLeftColor: '#EF4444',
          },
        },
        loading: {
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#FFFFFF',
          },
        },
      }}
    />
  );
}
