const checklistService = require('../services/checklist.service');

/**
 * GET /api/checklist/custom
 */
async function getUserChecklists(req, res, next) {
  try {
    const userId = req.user.id;
    const items = await checklistService.getUserChecklists(userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/checklist/custom
 */
async function createChecklistItem(req, res, next) {
  try {
    const userId = req.user.id;
    const item = await checklistService.createChecklistItem(userId, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/checklist/custom/:id
 */
async function deleteChecklistItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const success = await checklistService.deleteChecklistItem(userId, id);
    
    if (!success) {
      return res.status(404).json({ success: false, error: 'Checklist item not found or unauthorized.' });
    }
    
    res.json({ success: true, message: 'Checklist item deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/item/:id
 */
async function updateChecklistItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    console.log(`[Checklist] PUT /item/${id} — userId: ${userId}, body:`, req.body);

    const updatedItem = await checklistService.updateChecklistItem(userId, id, req.body);
    
    if (!updatedItem) {
      console.warn(`[Checklist] Item ${id} not found for userId ${userId}`);
      return res.status(404).json({ success: false, error: 'Checklist item not found or unauthorized.' });
    }
    
    // Wrap in APIResponse format expected by iOS client
    res.json({ success: true, data: updatedItem });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUserChecklists,
  createChecklistItem,
  deleteChecklistItem,
  updateChecklistItem
};
