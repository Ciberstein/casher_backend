const admin = require('../firebase/config');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

exports.uploadFile = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file provided', 400));

  const { folder = 'uploads' } = req.body;
  const ext = req.file.originalname.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const file = bucket.file(filename);

  await file.save(req.file.buffer, {
    contentType: req.file.mimetype,
    public: true,
  });

  const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;

  return res.status(200).json({ url });
});
