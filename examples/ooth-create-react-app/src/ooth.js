import OothClient from 'ooth-client'

const ooth = new OothClient({
    oothUrl: 'http://localhost:3000',
    apiLoginUrl: 'http://localhost:3001/login',
    apiLogoutUrl: 'http://localhost:3001/logout'
})

export default ooth