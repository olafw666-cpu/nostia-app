class ConsentService {
  static getCurrentConsentVersion() {
    return process.env.CONSENT_VERSION || '1.0';
  }

  static getPrivacyPolicyVersion() {
    return process.env.PRIVACY_POLICY_VERSION || '1.0';
  }

  static validateConsentPayload(body) {
    const { locationConsent, dataCollectionConsent } = body;

    if (locationConsent !== true) {
      return { valid: false, error: 'Location consent is required to use Nostia' };
    }

    if (dataCollectionConsent !== true) {
      return { valid: false, error: 'Data collection consent is required to use Nostia' };
    }

    return { valid: true };
  }

  static checkConsentRequired(userId) {
    const Consent = require('../models/Consent');
    const currentVersion = this.getCurrentConsentVersion();
    const consent = Consent.getCurrentConsent(userId);

    if (!consent) return true;
    if (consent.consentVersion !== currentVersion) return true;
    if (!consent.locationConsent) return true;

    return false;
  }

  static getPrivacyPolicyText() {
    return {
      version: this.getPrivacyPolicyVersion(),
      lastUpdated: '2026-01-01',
      sections: [
        {
          title: 'Data We Collect',
          content: 'Nostia collects GPS coordinates during active sessions, feature interaction events (clicks, duration), session metrics (length, frequency), conversion funnel milestones, error and performance metrics, and regional trend data aggregated by city or region.'
        },
        {
          title: 'How We Use Your Data',
          content: 'Your data powers core location-based features and is used to generate anonymized, aggregated insights such as trends and heatmaps. Raw data is never shared directly. All monetizable outputs are derived from aggregated and anonymized datasets.'
        },
        {
          title: 'Data Anonymization',
          content: 'GPS data is rounded or bucketed by region. User identifiers are removed prior to analysis. Metrics are aggregated over time windows. No personally identifiable information is included in analytical outputs.'
        },
        {
          title: 'Location Access',
          content: 'Location sharing is a mandatory requirement to use Nostia. If you decline or revoke location access, your account access will be restricted until permission is restored.'
        },
        {
          title: 'Data Retention',
          content: 'Raw location data is retained for a limited period as specified in our retention policy. After this period, raw data is purged while anonymized aggregates are preserved.'
        },
        {
          title: 'Your Rights',
          content: 'You have the right to request export of your data, request deletion of your data, revoke consent at any time, and opt out of data collection. These rights are supported under GDPR and CCPA regulations.'
        }
      ]
    };
  }
}

module.exports = ConsentService;
