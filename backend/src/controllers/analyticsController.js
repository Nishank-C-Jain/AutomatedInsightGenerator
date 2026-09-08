import analyticServices from '../services/analyticServices.js';

/**
 * POST /api/analytics/:datasetId/run
 *
 * Trigger a full analysis on an already-uploaded dataset.
 * Node → Python (all 9 analyzers in one call) → PostgreSQL
 */
const runAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { datasetId } = req.params;

    const analysis = await analyticServices.runAnalysis(datasetId, userId);

    return res.status(200).json({
      success: true,
      message: 'Analysis completed successfully',
      dataset_id: datasetId,
      analysis,
    });

  } catch (error) {
    console.error('\n========== RUN ANALYSIS ERROR ==========');
    console.error('Message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Python response:', error.response?.data);
    console.error('Full error:', error);
    console.error('========================================\n');

    const status =
      error.response?.status ||
      error.statusCode ||
      500;

    const pythonError =
      error.response?.data?.detail ||
      error.response?.data?.message;

    return res.status(status).json({
      success: false,
      message:
        pythonError ||
        error.message ||
        'Analysis failed',
    });
  }
};

/**
 * GET /api/analytics/:datasetId
 *
 * Fetch the stored analysis result for a dataset from the DB.
 * Returns the cached JSONB without calling Python again.
 */
const getAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { datasetId } = req.params;

    const result = await analyticServices.getAnalysisResult(datasetId, userId);

    if (!result.analysis) {
      return res.status(202).json({
        success: true,
        message: `Dataset status is '${result.status}'. Analysis not yet available.`,
        status: result.status,
        analysis: null,
      });
    }

    return res.status(200).json({
      success: true,
      status: result.status,
      dataset_id: datasetId,
      analysis: result.analysis,
    });

  } catch (error) {
    console.error('[analyticsController] getAnalysis error:', error.message);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch analysis',
    });
  }
};

export default { runAnalysis, getAnalysis };
