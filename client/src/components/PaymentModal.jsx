import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Loader, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../api';
import Button from './Button';
import { scaleIn } from '../utils/animations';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// Log Stripe key status for debugging (not the actual key)
if (!stripeKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

function PaymentForm({ vaultSplitId, amount, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
      } else {
        toast.success('Payment successful!');
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Test Card Hint */}
      <div className="bg-blue-900/30 border border-blue-700 p-3 rounded-lg">
        <p className="text-xs text-blue-300 font-medium mb-1">Test Mode - Use Test Card</p>
        <p className="text-xs text-blue-200/80">
          Card: <span className="font-mono bg-blue-900/50 px-1 rounded">4242 4242 4242 4242</span>
        </p>
        <p className="text-xs text-blue-200/80">
          Exp: Any future date | CVC: Any 3 digits
        </p>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: '',
                email: '',
              },
            },
          }}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onClose}
          variant="secondary"
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="success"
          className="flex-1"
          disabled={!stripe || loading}
          loading={loading}
        >
          {!loading && `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentModal({
  isOpen,
  onClose,
  vaultSplitId,
  amount,
  recipientName,
  tripTitle,
  onSuccess,
}) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && vaultSplitId) {
      setLoadingIntent(true);
      setClientSecret(null);
      setError(null);

      paymentsAPI
        .createIntent(vaultSplitId)
        .then((data) => {
          console.log('Payment intent created:', { hasClientSecret: !!data.clientSecret });
          setClientSecret(data.clientSecret);
          setLoadingIntent(false);
        })
        .catch((err) => {
          console.error('Error creating payment intent:', err);
          setError(err.message || 'Failed to initialize payment');
          toast.error(err.message || 'Failed to initialize payment');
          setLoadingIntent(false);
        });
    }
  }, [isOpen, vaultSplitId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <CreditCard className="text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">Pay with Stripe</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="text-gray-400" size={20} />
            </button>
          </div>

          {/* Payment Details */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-xl mb-6 shadow-lg">
            <p className="text-sm text-green-100 mb-1">Paying to</p>
            <p className="text-white font-semibold text-lg mb-1">{recipientName}</p>
            {tripTitle && <p className="text-sm text-green-100 mb-3">for {tripTitle}</p>}
            <p className="text-4xl font-bold text-white">${amount.toFixed(2)}</p>
          </div>

          {/* Payment Form */}
          {!stripePromise ? (
            <div className="text-center py-8">
              <AlertCircle className="text-yellow-400 mx-auto mb-4" size={40} />
              <p className="text-yellow-400 font-medium mb-2">Stripe Not Configured</p>
              <p className="text-gray-400 text-sm mb-4">
                The Stripe publishable key is not set. Please configure VITE_STRIPE_PUBLISHABLE_KEY in your environment.
              </p>
              <Button onClick={onClose} variant="secondary">
                Close
              </Button>
            </div>
          ) : loadingIntent ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader className="animate-spin text-blue-400 mb-4" size={40} />
              <p className="text-gray-400">Initializing payment...</p>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#3B82F6',
                    colorBackground: '#1F2937',
                    colorText: '#FFFFFF',
                    colorDanger: '#EF4444',
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <PaymentForm
                vaultSplitId={vaultSplitId}
                amount={amount}
                onSuccess={onSuccess}
                onClose={onClose}
              />
            </Elements>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="text-red-400 mx-auto mb-4" size={40} />
              <p className="text-red-400 font-medium mb-2">Failed to load payment form</p>
              <p className="text-gray-400 text-sm mb-4">
                {error || 'Could not initialize Stripe payment. Please try again.'}
              </p>
              <Button onClick={onClose} variant="secondary">
                Close
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
