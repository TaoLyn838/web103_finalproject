import express from 'express'
import {
  register,
  login,
  githubLogin,
  githubCallback,
} from '../controllers/AuthController.js'
import { authenticateToken } from '../middleware/AuthMiddleware.js'

const router = express.Router()

// Test route if user is authenticated
function authenticate(req, res) {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  res.json({ message: `Welcome, user ${req.user.userId}` })
}

router.post('/register', register)
router.post('/login', login)
router.get('/protected', authenticateToken, authenticate)
// router.get('/github', githubLogin)
// router.get('/github/callback', githubCallback)

export default router
