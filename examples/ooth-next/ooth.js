import OothClient from 'ooth-client'
import oothGuest from 'ooth-guest-client'
import oothLocal from 'ooth-local-client'
// import oothFacebook from 'ooth-facebook-client'
// import oothGoogle from 'ooth-google-client'

const ooth = new OothClient({
    url: 'http://localhost:3000'
})
ooth.use('guest', oothGuest())
ooth.use('local', oothLocal())

export default ooth