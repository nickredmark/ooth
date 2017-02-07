import React from 'react'
import OothClient from 'ooth-client'
import oothGuest from 'ooth-guest'
import oothLocal from 'ooth-local-client'

const ooth = new OothClient()
ooth.use('local', oothLocal())

export default class App extends React.Component {
    getInitialProps() {
        console.log("hi there")
    }
    render() {
        return <div>bla blup</div>
    }
}