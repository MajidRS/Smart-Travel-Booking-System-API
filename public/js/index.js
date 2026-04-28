/* eslint-disable */

import displayMap from './mapBox.js'
import { login, logout } from './login.js'
import updateSettings from './updateSettings.js'

const mapBox = document.getElementById('map')
const loginForm = document.querySelector('.form--login')
const logOutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-settings')

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations)
  const token = mapBox.dataset.mapboxToken
  displayMap(locations, token)
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    login(email, password)
  })
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout)
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const name = document.getElementById('name').value
    const email = document.getElementById('email').value
    updateSettings({ name, email }, 'data')
  })
}

if (userPasswordForm) {
  console.log('first')
  userPasswordForm.addEventListener('submit', async (e) => {
    console.log('seconde')
    e.preventDefault()
    document.querySelector('.btn--save-password').textContent = 'Updating...'
    const currentPassword = document.getElementById('password-current').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('password-confirm').value
    await updateSettings(
      { currentPassword, password, passwordConfirm },
      'password'
    )
    document.querySelector('.btn--save-password').textContent = 'Save password'
    document.getElementById('password-current').value = ''
    document.getElementById('password').value = ''
    document.getElementById('password-confirm').value = ''
  })
}
