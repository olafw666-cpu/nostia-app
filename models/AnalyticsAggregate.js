const db = require('../database/db');

class AnalyticsAggregate {
  static store(reportData) {
    const {
      reportType,
      periodStart,
      periodEnd,
      regionBucket,
      metricName,
      metricValue,
      sampleSize,
      metadata
    } = reportData;

    const stmt = db.prepare(`
      INSERT INTO analytics_aggregates (reportType, periodStart, periodEnd, regionBucket, metricName, metricValue, sampleSize, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      reportType,
      periodStart,
      periodEnd,
      regionBucket || null,
      metricName,
      metricValue,
      sampleSize || null,
      metadata || null
    );

    return { id: result.lastInsertRowid, reportType, metricName, metricValue };
  }

  static getByType(reportType, startDate, endDate) {
    return db.prepare(`
      SELECT * FROM analytics_aggregates
      WHERE reportType = ? AND periodStart >= ? AND periodEnd <= ?
      ORDER BY periodStart, metricName
    `).all(reportType, startDate, endDate);
  }

  static getRegionHeatmap(startDate, endDate) {
    return db.prepare(`
      SELECT regionBucket, metricName, SUM(metricValue) as totalValue, SUM(sampleSize) as totalSamples
      FROM analytics_aggregates
      WHERE reportType = 'daily_region' AND periodStart >= ? AND periodEnd <= ? AND regionBucket IS NOT NULL
      GROUP BY regionBucket, metricName
      ORDER BY totalValue DESC
    `).all(startDate, endDate);
  }

  static getFeatureUsage(startDate, endDate) {
    return db.prepare(`
      SELECT metricName as featureName, SUM(metricValue) as totalUsage, SUM(sampleSize) as uniqueUsers
      FROM analytics_aggregates
      WHERE reportType = 'feature_usage' AND periodStart >= ? AND periodEnd <= ?
      GROUP BY metricName
      ORDER BY totalUsage DESC
    `).all(startDate, endDate);
  }

  static getRetentionData(startDate, endDate) {
    return db.prepare(`
      SELECT metricName, metricValue as retentionRate, sampleSize as cohortSize, metadata
      FROM analytics_aggregates
      WHERE reportType = 'retention' AND periodStart >= ? AND periodEnd <= ?
      ORDER BY createdAt DESC
    `).all(startDate, endDate);
  }

  static getFunnelData(startDate, endDate) {
    return db.prepare(`
      SELECT metricName as step, metricValue as count
      FROM analytics_aggregates
      WHERE reportType = 'funnel' AND periodStart >= ? AND periodEnd <= ?
      ORDER BY createdAt DESC
      LIMIT 4
    `).all(startDate, endDate);
  }
}

module.exports = AnalyticsAggregate;
