import OothClient from 'ooth-client'

const ooth = new OothClient({
    oothUrl: 'http://localhost:3002/auth',
    standalone: false,
})

export default ooth