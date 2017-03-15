import ApolloClient, {createNetworkInterface} from 'apollo-client'
import {ApolloProvider, getDataFromTree} from 'react-apollo'
import React from 'react'
import {defaultProps} from 'recompose'
import { createStore as createReduxStore, combineReducers, applyMiddleware } from 'redux'

let client = null
let store = null

const createClient = () => {
    return new ApolloClient({
        ssrMode: !process.browser,
        networkInterface: createNetworkInterface({
            uri: 'http://localhost:3002/graphql',
            opts: {
                credentials: 'include'
            }
        })
    })
}

const initClient = () => {
    if (!process.browser) {
        // on server, create a new client for each request
        return createClient()
    } else {
        // on client, create singleton
        if (!client) {
            client = createClient()
        }
        return client
    }
}

const createStore = (client, initialState) => {
    return createReduxStore(
        combineReducers({
            apollo: client.reducer()
        }),
        initialState,
        applyMiddleware(client.middleware())
    )
}

const initStore = (client, initialState) => {
    if (!process.browser) {
        // on server, create a new store for each request
        return createStore(client, initialState)
    } else {
        // on client, create singleton
        if (!store) {
            store = createStore(client, initialState)
        }
        return store
    }
}

export default (Component) => (
    class extends React.Component {
        static async getInitialProps (ctx) {
            const client = initClient()
            const store = initStore(client, client.initialState)

            const props = await (Component.getInitialProps ? Component.getInitialProps(ctx) : {})

            if (!process.browser) {
                const app = (
                    <ApolloProvider client={client} store={store}>
                        <Component {...props} />
                    </ApolloProvider>
                )
                await getDataFromTree(app)
            }

            const state = store.getState()

            return {
                initialState: {
                    ...state,
                    apollo: {
                        data: client.getInitialState().data
                    }
                },
                ...props
            }
        }

        constructor (props) {
            super(props)
            this.client = initClient()
            this.store = initStore(this.client, props.initialState)
        }

        render () {
            return (
                <ApolloProvider client={this.client} store={this.store}>
                    <Component {...this.props} />
                </ApolloProvider>
            )
        }
    }
)