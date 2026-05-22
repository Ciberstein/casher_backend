const catchAsync = require('../utils/catchAsync');
const DocumentType = require('../models/document_type.model');

exports.getDocumentTypes = catchAsync(async (req, res) => {
  const { country = 'CO' } = req.query;
  const types = await DocumentType.findAll({ where: { country }, order: [['name', 'ASC']] });
  return res.status(200).json(types);
});
