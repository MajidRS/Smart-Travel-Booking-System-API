/*eslint-disable*/
import axios from 'axios'
import showAlert from './alert.js'

const bookBtn = document.getElementById('book-tour')
const stripe = Stripe(
  'pk_test_51TT4I4LzPKiemolVlGYe9dvaiqdhKuZIDneLhtuho0MiwozRRhMMUVK9ra10KDQQ9QJNFCNZHZokqcy2tAyvTDt4008C0eYt9c'
)

const bookTour = async (tourId) => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
  } catch (error) {
    showAlert('error', error.response.data.message)
  }
}

export default bookTour
