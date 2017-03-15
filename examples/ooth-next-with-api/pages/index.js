import React, {Component} from 'react'
import withOothNext from '../ooth-client'
import {withOoth, withUser} from 'ooth-client-react'
import {compose} from 'recompose'
import Link from 'next/link'

export default withOothNext(() => {
  return <div>
    <Link href="/other"><a>other</a></Link>
    <h1>Welcome to Ooth's Next.js example</h1>
    <LoginStatus/>    
  </div>
})

class LoginStatusComponent extends Component {
  render() {
    const {oothClient, user} = this.props
    if (user) {
      return <div>
        Your user id is {user._id}
        <button onClick={() => {
          oothClient.logout()
        }}>Log out</button>
      </div>
    } else {
      return <div>
        Click on the button to create a guest session.<br/>
        <button onClick={() => {
          oothClient.authenticate('guest', 'register')
            .catch(err => {
              console.error(err)
            })
        }}>Log in</button>
      </div>
    }
  }
}
const LoginStatus = compose(
  withOoth,
  withUser
)(LoginStatusComponent)
