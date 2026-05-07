import app from './app.js'
import { env } from './config/env.js'
import { refreshQuizBank } from './services/learningService.js'

refreshQuizBank()

app.listen(env.port, () => {
  console.log(`Backend running on http://localhost:${env.port}`)
})
