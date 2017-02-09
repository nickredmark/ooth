import OothClient from 'ooth-client'

const ooth = new OothClient({
    oothUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3001'
})

export default ooth