import pool from '../config/db.js';

const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get total dataset count
        const datasetsCountResult = await pool.query(
            'SELECT COUNT(*) FROM datasets WHERE user_id = $1', 
            [userId]
        );
        const datasetsCount = parseInt(datasetsCountResult.rows[0].count, 10);

        // 2. Get total insights count
        const insightsCountResult = await pool.query(
            'SELECT COUNT(*) FROM insights WHERE user_id = $1', 
            [userId]
        );
        const insightsCount = parseInt(insightsCountResult.rows[0].count, 10);

        // 3. Get total anomalies count
        // Each row in the anomalies table represents one detected anomaly column.
        // anomaly_value stores the count of anomalous rows as a string.
        const anomaliesCountResult = await pool.query(
            'SELECT COUNT(*) as total_anomalies FROM anomalies WHERE user_id = $1', 
            [userId]
        );
        const anomaliesCount = parseInt(anomaliesCountResult.rows[0].total_anomalies || 0, 10);

        // 4. Get recent datasets
        const recentDatasetsResult = await pool.query(
            'SELECT id, name, status, file_type, file_size, created_at FROM datasets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', 
            [userId]
        );
        
        // 5. Get recent insights
        const recentInsightsResult = await pool.query(
            'SELECT id, dataset_id, title, summary, created_at FROM insights WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
            [userId]
        );

        return res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalDatasets: datasetsCount,
                    totalInsights: insightsCount,
                    totalAnomalies: anomaliesCount,
                },
                recentActivity: {
                    datasets: recentDatasetsResult.rows,
                    insights: recentInsightsResult.rows,
                }
            }
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
        });
    }
};

export default {
    getDashboardStats
};
