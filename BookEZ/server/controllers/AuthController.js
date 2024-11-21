import passport from 'passport'
import { Strategy as GitHubStrategy } from 'passport-github2'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { pool } from '../config/database.js'

dotenv.config()

// Helper function to hash passwords
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// Helper function to compare passwords
async function comparePasswords(password, hashedPassword) {
  // console.log("Password to compare:", password);
  // console.log("Hashed password:", hashedPassword);
  return bcrypt.compare(password, hashedPassword)
}

// Register a new user
export async function register(req, res) {
  const { username, password, email, full_name, phone_number } = req.body

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hashedPassword = await hashPassword(password)
    const newUser = await pool.query(
      'INSERT INTO users (username, password, email, full_name, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, hashedPassword, email, full_name, phone_number]
    )

    res.status(201).json({
      message: 'User registered successfully',
      userId: newUser.rows[0].id,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}

// Login an existing user
export async function login(req, res) {
  const { email, password } = req.body

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = userResult.rows[0]
    // console.log(user);
    const validPassword = await comparePasswords(password, user.password)
    // console.log("Password validation result:", validPassword);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password credentials' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    })
    res.json({ message: 'Login successful', token, user_id: user.id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create the user in your database
        const userResult = await pool.query(
          'SELECT * FROM users WHERE github_id = $1',
          [profile.id]
        )

        let user
        if (userResult.rows.length === 0) {
          // If the user does not exist, create them
          const newUser = await pool.query(
            'INSERT INTO users (github_id, username, email, full_name) VALUES ($1, $2, $3, $4) RETURNING *',
            [
              profile.id,
              profile.username,
              profile.emails?.[0]?.value || null,
              profile.displayName || profile.username,
            ]
          )
          user = newUser.rows[0]
        } else {
          user = userResult.rows[0]
        }

        return done(null, user)
      } catch (error) {
        console.error('Error in GitHub OAuth:', error)
        return done(error)
      }
    }
  )
)

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async (id, done) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [
      id,
    ])
    done(null, userResult.rows[0])
  } catch (error) {
    done(error)
  }
})

// GitHub login route
export function githubLogin(req, res, next) {
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next)
}

// GitHub callback route
export function githubCallback(req, res, next) {
  passport.authenticate('github', async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Authentication failed' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    })

    res.json({ message: 'GitHub login successful', token, user_id: user.id })
  })(req, res, next)
}
