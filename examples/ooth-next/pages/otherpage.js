import React from 'react'
import ooth from '../ooth'

export default class App extends React.Component {
    static async getInitialProps({req}) {
        let userId = ooth.getUserId()
        if (!userId) {
            userId = await ooth.authMethod('guest', 'register')
        }
        return {
            userId,
        }
    }
    render() {
        const {userId} = this.props
        return <div>The user id is {userId}.</div>
    }
}