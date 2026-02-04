import { useEffect, useState } from "react";
import { analyticsAPI } from "../api";
import {
  BarChart2,
  Users,
  Activity,
  MapPin,
  Clock,
  TrendingUp,
  Download,
  Loader
} from "lucide-react";

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [dashboard, setDashboard] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [featureUsage, setFeatureUsage] = useState([]);
  const [sessions, setSessions] = useState(null);
  const [funnels, setFunnels] = useState([]);
  const [retention, setRetention] = useState([]);

  const getDateRange = () => {
    const end = new Date().toISOString();
    const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[range] || 30;
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return { startDate: start, endDate: end };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = getDateRange();
      const [dashData, heatData, featureData, sessionData, funnelData, retentionData] =
        await Promise.all([
          analyticsAPI.getDashboard(params).catch(() => null),
          analyticsAPI.getHeatmap(params).catch(() => []),
          analyticsAPI.getFeatureUsage(params).catch(() => []),
          analyticsAPI.getSessions(params).catch(() => null),
          analyticsAPI.getFunnels(params).catch(() => []),
          analyticsAPI.getRetention(params).catch(() => []),
        ]);

      setDashboard(dashData);
      setHeatmap(heatData);
      setFeatureUsage(featureData);
      setSessions(sessionData);
      setFunnels(funnelData);
      setRetention(retentionData);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [range]);

  const handlePurchaseReport = async (reportType) => {
    try {
      const params = getDateRange();
      const result = await analyticsAPI.purchaseReport({
        reportType,
        ...params,
      });
      // Download as JSON
      const blob = new Blob([JSON.stringify(result.report, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nostia-${reportType}-report.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to purchase report", err);
    }
  };

  const maxFeatureCount = featureUsage.length > 0
    ? Math.max(...featureUsage.map((f) => f.count || f.totalUsage || 0))
    : 1;

  const maxHeatmapCount = heatmap.length > 0
    ? Math.max(...heatmap.map((h) => h.eventCount || 0))
    : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-blue-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 size={22} className="text-blue-400" />
          Analytics Dashboard
        </h2>
        <div className="flex gap-1">
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-xs font-medium ${
                range === r
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-lg">
            <Users size={18} className="text-blue-200 mb-1" />
            <p className="text-2xl font-bold text-white">{dashboard.totalUsers}</p>
            <p className="text-xs text-blue-200">Total Users</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-4 rounded-lg">
            <Activity size={18} className="text-green-200 mb-1" />
            <p className="text-2xl font-bold text-white">{dashboard.activeUsers}</p>
            <p className="text-xs text-green-200">Active Users</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-4 rounded-lg">
            <TrendingUp size={18} className="text-purple-200 mb-1" />
            <p className="text-2xl font-bold text-white">{dashboard.totalEvents}</p>
            <p className="text-xs text-purple-200">Total Events</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-4 rounded-lg">
            <Clock size={18} className="text-orange-200 mb-1" />
            <p className="text-2xl font-bold text-white">
              {dashboard.avgSessionLengthSeconds
                ? `${Math.round(dashboard.avgSessionLengthSeconds / 60)}m`
                : "N/A"}
            </p>
            <p className="text-xs text-orange-200">Avg Session</p>
          </div>
        </div>
      )}

      {/* Region Heatmap */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <MapPin size={16} className="text-red-400" />
            Location Heatmap
          </h3>
          <button
            onClick={() => handlePurchaseReport("daily_region")}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Download size={12} /> Export
          </button>
        </div>
        {heatmap.length === 0 ? (
          <p className="text-sm text-gray-500">No location data yet</p>
        ) : (
          <div className="space-y-2">
            {heatmap.slice(0, 10).map((region, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-32 truncate">
                  {region.regionBucket}
                </span>
                <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"
                    style={{
                      width: `${((region.eventCount || 0) / maxHeatmapCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-16 text-right">
                  {region.eventCount || 0} events
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature Usage */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            Feature Usage Trends
          </h3>
          <button
            onClick={() => handlePurchaseReport("feature_usage")}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Download size={12} /> Export
          </button>
        </div>
        {featureUsage.length === 0 ? (
          <p className="text-sm text-gray-500">No feature usage data yet</p>
        ) : (
          <div className="space-y-2">
            {featureUsage.slice(0, 10).map((feature, i) => {
              const count = feature.count || feature.totalUsage || 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-32 truncate">
                    {feature.eventName || feature.featureName}
                  </span>
                  <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{
                        width: `${(count / maxFeatureCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Metrics */}
      {sessions && (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Clock size={16} className="text-yellow-400" />
            Session Metrics
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-lg font-bold text-white">
                {sessions.totalSessions || 0}
              </p>
              <p className="text-xs text-gray-400">Sessions</p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-lg font-bold text-white">
                {sessions.avgDurationSeconds
                  ? `${Math.round(sessions.avgDurationSeconds / 60)}m`
                  : "N/A"}
              </p>
              <p className="text-xs text-gray-400">Avg Length</p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-lg font-bold text-white">
                {sessions.avgEventsPerSession
                  ? Math.round(sessions.avgEventsPerSession)
                  : 0}
              </p>
              <p className="text-xs text-gray-400">Events/Session</p>
            </div>
          </div>

          {/* Platform breakdown */}
          {sessions.byPlatform && sessions.byPlatform.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">By Platform</p>
              <div className="flex gap-2">
                {sessions.byPlatform.map((p, i) => (
                  <div key={i} className="bg-gray-800 px-3 py-1.5 rounded text-xs">
                    <span className="text-white font-medium">{p.platform}</span>
                    <span className="text-gray-400 ml-2">{p.sessions} sessions</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conversion Funnel */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Conversion Funnel</h3>
          <button
            onClick={() => handlePurchaseReport("funnel")}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Download size={12} /> Export
          </button>
        </div>
        {funnels.length === 0 ? (
          <p className="text-sm text-gray-500">No funnel data yet. Run aggregation first.</p>
        ) : (
          <div className="space-y-2">
            {funnels.map((step, i) => {
              const maxCount = funnels[0]?.count || 1;
              const pct = maxCount > 0 ? ((step.count / maxCount) * 100).toFixed(1) : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 capitalize">
                      {(step.step || step.metricName || "").replace(/_/g, " ")}
                    </span>
                    <span className="text-white">
                      {step.count} ({pct}%)
                    </span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Retention Cohorts */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Retention Cohorts</h3>
          <button
            onClick={() => handlePurchaseReport("retention")}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Download size={12} /> Export
          </button>
        </div>
        {retention.length === 0 ? (
          <p className="text-sm text-gray-500">
            No retention data yet. Run aggregation first.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-left p-2">Metric</th>
                  <th className="text-right p-2">Rate</th>
                  <th className="text-right p-2">Cohort</th>
                </tr>
              </thead>
              <tbody>
                {retention.slice(0, 12).map((row, i) => {
                  const meta = row.metadata ? JSON.parse(row.metadata) : {};
                  return (
                    <tr key={i} className="border-t border-gray-800">
                      <td className="p-2 text-gray-300">
                        {(row.metricName || "").replace(/_/g, " ")}
                      </td>
                      <td className="p-2 text-right text-white">
                        {(row.retentionRate || row.metricValue || 0).toFixed(1)}%
                      </td>
                      <td className="p-2 text-right text-gray-400">
                        {meta.cohortWeek || "-"} ({row.cohortSize || row.sampleSize || 0})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
