/*eslint-disable*/

import axios from 'axios'
import showAlert from './alert.js'

const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm
      }
    })
    if (res.data.status === 'success') {
      showAlert('success', 'Sign Up successfully!')
      window.setTimeout(() => {
        location.assign('/')
      }, 1500)
    }
  } catch (error) {
    showAlert('error', error.response.data.message)
  }
}

export default signup
