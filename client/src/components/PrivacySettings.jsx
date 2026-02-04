import { useEffect, useState } from "react";
import { consentAPI, privacyAPI } from "../api";
import {
  Shield,
  FileText,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PrivacySettings({ onClose }) {
  const [consentStatus, setConsentStatus] = useState(null);
  const [consentHistory, setConsentHistory] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [status, history, policyData] = await Promise.all([
        consentAPI.getStatus().catch(() => null),
        consentAPI.getHistory().catch(() => []),
        privacyAPI.getPolicy().catch(() => null),
      ]);
      setConsentStatus(status);
      setConsentHistory(history);
      setPolicy(policyData);
    } catch (err) {
      console.error("Failed to load privacy data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async () => {
    if (!window.confirm(
      "Revoking consent will restrict your app access. You will need to re-consent to continue using Nostia. Are you sure?"
    )) {
      return;
    }

    try {
      await consentAPI.revoke();
      toast.success("Consent revoked. Your access has been restricted.");
      await loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReGrantConsent = async () => {
    try {
      await consentAPI.grant({
        locationConsent: true,
        dataCollectionConsent: true,
      });
      toast.success("Consent granted. Full access restored.");
      await loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDataExport = async () => {
    try {
      const result = await privacyAPI.requestDataExport();
      toast.success("Data export generated");

      // Download the export
      const exportData = await privacyAPI.downloadExport(result.exportId);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nostia-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || "Failed to export data");
    }
  };

  const handleDeleteData = async () => {
    try {
      await privacyAPI.requestDataDeletion();
      toast.success("All personal data has been deleted. You will be logged out.");
      setShowDeleteConfirm(false);
      // Force logout after deletion
      setTimeout(() => {
        localStorage.clear();
        window.location.reload();
      }, 2000);
    } catch (err) {
      toast.error(err.message || "Failed to delete data");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Privacy & Settings</h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-blue-400" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield size={20} className="text-blue-400" />
          Privacy & Settings
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Consent Status */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="font-semibold text-white mb-3">Consent Status</h3>
        <div className="flex items-center gap-3 mb-3">
          {consentStatus?.isValid ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={18} />
              <span className="text-sm">Active consent (v{consentStatus.consent?.consentVersion})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-400">
              <XCircle size={18} />
              <span className="text-sm">No active consent</span>
            </div>
          )}
        </div>

        {consentStatus?.consent && (
          <div className="text-xs text-gray-400 space-y-1 mb-3">
            <p>Location consent: {consentStatus.consent.locationConsent ? "Granted" : "Denied"}</p>
            <p>Data collection: {consentStatus.consent.dataCollectionConsent ? "Granted" : "Denied"}</p>
            <p>Granted: {new Date(consentStatus.consent.grantedAt).toLocaleDateString()}</p>
          </div>
        )}

        {consentStatus?.isValid ? (
          <button
            onClick={handleRevokeConsent}
            className="w-full bg-red-900/50 border border-red-700 text-red-300 p-2 rounded text-sm hover:bg-red-900"
          >
            Revoke Consent
          </button>
        ) : (
          <button
            onClick={handleReGrantConsent}
            className="w-full bg-green-600 text-white p-2 rounded text-sm hover:bg-green-700"
          >
            Grant Consent
          </button>
        )}
      </div>

      {/* Privacy Policy */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="font-semibold text-white mb-2">Privacy Policy</h3>
        <p className="text-xs text-gray-400 mb-3">
          Version {policy?.version || "1.0"} - Last updated {policy?.lastUpdated || "N/A"}
        </p>
        <button
          onClick={() => setShowPolicy(!showPolicy)}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <FileText size={14} />
          {showPolicy ? "Hide Policy" : "View Full Policy"}
        </button>

        {showPolicy && policy?.sections && (
          <div className="mt-3 space-y-3 text-sm text-gray-300 border-t border-gray-700 pt-3">
            {policy.sections.map((section, i) => (
              <div key={i}>
                <h4 className="text-white font-medium text-xs mb-1">{section.title}</h4>
                <p className="text-xs text-gray-400">{section.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="font-semibold text-white mb-3">Your Data</h3>

        <button
          onClick={handleDataExport}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded mb-2 hover:bg-blue-700"
        >
          <Download size={16} />
          Export My Data (GDPR)
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 bg-red-900/50 border border-red-700 text-red-300 p-3 rounded hover:bg-red-900"
        >
          <Trash2 size={16} />
          Delete All My Data
        </button>
      </div>

      {/* Consent History */}
      {consentHistory.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            Consent History
          </h3>
          <div className="space-y-2">
            {consentHistory.map((consent) => (
              <div key={consent.id} className="bg-gray-800 p-2 rounded text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-300">v{consent.consentVersion}</span>
                  <span className={consent.revokedAt ? "text-red-400" : "text-green-400"}>
                    {consent.revokedAt ? "Revoked" : "Active"}
                  </span>
                </div>
                <p className="text-gray-500">
                  Granted: {new Date(consent.grantedAt).toLocaleString()}
                </p>
                {consent.revokedAt && (
                  <p className="text-gray-500">
                    Revoked: {new Date(consent.revokedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-500" />
              <h3 className="text-lg font-bold text-white">Delete All Data?</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              This will permanently delete your account and all associated data including trips,
              friends, messages, posts, and analytics. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-700 text-white p-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                className="flex-1 bg-red-600 text-white p-2 rounded hover:bg-red-700"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
