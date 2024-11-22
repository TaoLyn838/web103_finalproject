// Updated base URL with /api prefix
export const registerUser = async (user) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      }
    )
    if (!response.ok) {
      throw new Error(`Error registering user: ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error registering user:', error)
    throw error
  }
}

// Testing username: drakedo
// Testing password: drakenevadie19
export const loginUser = async (user) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      }
    )
    if (!response.ok) {
      throw new Error(`Error logging in: ${response.statusText}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}
