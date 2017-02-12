import OothClient from 'ooth-client'

const ooth = new OothClient({
    oothUrl: 'http://localhost:3001',
    apiLoginUrl: 'http://localhost:3002/login',
    apiLogoutUrl: 'http://localhost:3002/logout'
})

export default ooth