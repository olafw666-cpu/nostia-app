import { useState } from "react";
import { X, MapPin, Database, Shield, FileText } from "lucide-react";

export default function ConsentModal({ onConsent, onDecline, onViewPolicy }) {
  const [locationConsent, setLocationConsent] = useState(false);
  const [dataCollectionConsent, setDataCollectionConsent] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const canProceed = locationConsent && dataCollectionConsent;

  if (showPolicy) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
            <button onClick={() => setShowPolicy(false)}>
              <X className="text-gray-400" />
            </button>
          </div>

          <div className="space-y-4 text-sm text-gray-300">
            <section>
              <h3 className="text-white font-semibold mb-1">Data We Collect</h3>
              <p>Nostia collects GPS coordinates during active sessions, feature interaction events (clicks, duration), session metrics (length, frequency), conversion funnel milestones, error and performance metrics, and regional trend data aggregated by city or region.</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-1">How We Use Your Data</h3>
              <p>Your data powers core location-based features and is used to generate anonymized, aggregated insights such as trends and heatmaps. Raw data is never shared directly. All monetizable outputs are derived from aggregated and anonymized datasets.</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-1">Data Anonymization</h3>
              <p>GPS data is rounded or bucketed by region. User identifiers are removed prior to analysis. Metrics are aggregated over time windows. No personally identifiable information is included in analytical outputs.</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-1">Location Access</h3>
              <p>Location sharing is a mandatory requirement to use Nostia. If you decline or revoke location access, your account access will be restricted until permission is restored.</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-1">Data Retention</h3>
              <p>Raw location data is retained for a limited period (90 days by default). After this period, raw data is purged while anonymized aggregates are preserved.</p>
            </section>

            <section>
              <h3 className="text-white font-semibold mb-1">Your Rights</h3>
              <p>You have the right to request export of your data, request deletion of your data, revoke consent at any time, and opt out of data collection. These rights are supported under GDPR and CCPA regulations.</p>
            </section>
          </div>

          <button
            onClick={() => setShowPolicy(false)}
            className="w-full mt-4 bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
          >
            Back to Consent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Before You Continue</h2>
            <p className="text-xs text-gray-400">Consent required to use Nostia</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-4 text-sm text-gray-300">
          <p className="mb-2">
            Nostia is a location-powered application. To provide our core features and generate anonymized insights,
            we need your explicit consent for the following:
          </p>
        </div>

        {/* Location Consent */}
        <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg mb-3 cursor-pointer hover:bg-gray-750">
          <input
            type="checkbox"
            checked={locationConsent}
            onChange={(e) => setLocationConsent(e.target.checked)}
            className="mt-1 w-4 h-4 accent-blue-500"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-white">Location Access</span>
              <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded">Required</span>
            </div>
            <p className="text-xs text-gray-400">
              I grant Nostia permission to access my GPS location during active sessions.
              Location data is used for core features and anonymized regional analytics.
            </p>
          </div>
        </label>

        {/* Data Collection Consent */}
        <label className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg mb-4 cursor-pointer hover:bg-gray-750">
          <input
            type="checkbox"
            checked={dataCollectionConsent}
            onChange={(e) => setDataCollectionConsent(e.target.checked)}
            className="mt-1 w-4 h-4 accent-blue-500"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database size={16} className="text-purple-400" />
              <span className="text-sm font-medium text-white">Usage Data Collection</span>
              <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded">Required</span>
            </div>
            <p className="text-xs text-gray-400">
              I agree to the collection of usage data including feature interactions, session metrics,
              and performance data. All data is anonymized before analysis.
            </p>
          </div>
        </label>

        {/* Privacy Policy Link */}
        <button
          onClick={() => setShowPolicy(true)}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-4"
        >
          <FileText size={14} />
          View Privacy Policy
        </button>

        {/* Action Buttons */}
        <button
          onClick={() => onConsent({ locationConsent, dataCollectionConsent })}
          disabled={!canProceed}
          className={`w-full p-3 rounded font-medium mb-2 ${
            canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Agree & Continue
        </button>

        <button
          onClick={onDecline}
          className="w-full p-3 rounded text-gray-400 hover:text-gray-300 text-sm"
        >
          Decline
        </button>

        {!canProceed && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Both consents are required to create an account
          </p>
        )}
      </div>
    </div>
  );
}
