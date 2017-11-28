const React = require('react')
const gql = require('graphql-tag')
const {graphql, withApollo} = require('react-apollo')
const {withContext, getContext, compose} = require('recompose')
const cloneDeep = require('lodash.clonedeep')
const PropTypes = require('prop-types')

const UserQuery = gql`
  query {
    me {
      _id
    }
  }
`

const UserSubscriptionQuery = gql`
  subscription {
    meChanged {
      _id
    }
  }
`
class UserProviderComponent extends React.Component {
  componentWillReceiveProps(newProps) {
    if (!newProps.data.loading) {
      if (this.subscription) {
        if (newProps.data.feed !== this.props.data.feed) {
          this.subscription.unsubscribe()
        } else {
          return
        }
      }
      this.subscription = newProps.data.subscribeToMore({
        document: UserSubscriptionQuery,
        variables: null,
        updateQuery: (previousResult, {subscriptionData}) => {
          const nextResult = cloneDeep(previousResult)
          nextResult.me = subscriptionData.data.meChanged
          return nextResult
        },
        onError: (err) => {
          console.error(err)
        }
      })
    }
  }
  render() {
    return React.Children.only(this.props.children)
  }
  getChildContext() {
    const {data: {loading: userLoading, me: user}} = this.props
    return {
      user,
      userLoading
    }
  }
}
UserProviderComponent.childContextTypes = {
  user: PropTypes.object,
  userLoading: PropTypes.bool,
}
const UserProvider = graphql(UserQuery)(UserProviderComponent)

const withUser = getContext({
  user: PropTypes.object,
  refetchUser: PropTypes.func,
})

module.exports = {
    UserProvider,
    withUser
}