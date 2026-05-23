const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')

exports.verifyTurnstile = catchAsync(async (req, res, next) => {
  const { captchaToken } = req.body

  if (!captchaToken)
    return next(new AppError('Se requiere verificación de seguridad', 400))

  const form = new URLSearchParams()
  form.append('secret', process.env.TURNSTILE_SECRET_KEY)
  form.append('response', captchaToken)
  form.append('remoteip', req.ip)

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })

  const data = await response.json()

  if (!data.success)
    return next(new AppError('Verificación de seguridad fallida. Intenta de nuevo.', 400))

  next()
})
