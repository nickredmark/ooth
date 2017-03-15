import OothClient from 'ooth-client'
import withOothNext from 'ooth-client-react-next'
const Rx = require('rx')

const oothClient = new OothClient({
    oothUrl: 'http://localhost:3002/auth',
})

export default withOothNext(oothClient)
