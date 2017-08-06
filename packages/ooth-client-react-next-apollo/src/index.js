import ApolloClient, {createNetworkInterface} from 'apollo-client'
import {ApolloProvider, getDataFromTree} from 'react-apollo'
import React from 'react'
import {defaultProps} from 'recompose'
import { createStore as createReduxStore, combineReducers, applyMiddleware } from 'redux'

let client = null
let store = null

const createClient = (uri, opts) => {
    const networkInterface = createNetworkInterface({
        uri,
        opts: {
            credentials: 'include'
        }
    })
    return new ApolloClient(Object.assign({}, opts, {
        networkInterface
    }))
}

const createSSRClient = (uri, cookies, opts) => {
    const networkInterface = createNetworkInterface({
        uri
    })
    networkInterface.use([{
        applyMiddleware(req, next) {
            if (!req.options.headers) {
                req.options.headers = {}
            }
            req.options.headers['Cookie'] = Object.keys(cookies).map(key => `${key}=${cookies[key]}`).join('; ')
            next()
        }
    }])
    return new ApolloClient(Object.assign({}, opts, {
        ssrMode: true,
        networkInterface
    }))
}

const initClient = (uri, cookies, opts) => {
    if (!process.browser) {
        // on server, create a new client for each request
        return createSSRClient(uri, cookies, opts)
    } else {
        // on client, create singleton
        if (!client) {
            client = createClient(uri, opts)
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

module.exports = ({url, opts}) => {
    return (Component) => (
        class extends React.Component {
            static getInitialProps (ctx) {
                const cookies = ctx.req && ctx.req.cookies
                const client = initClient(url, cookies, opts)
                const store = initStore(client, client.initialState)

                return Promise.resolve(Component.getInitialProps ? Component.getInitialProps(ctx) : {})
                    .then(props => {
                        return Promise.resolve()
                            .then(() => {
                                if (!process.browser) {
                                    const url = {
                                        query: ctx.query,
                                        pathname: ctx.pathname,
                                        asPath: ctx.asPath
                                    }
                                    const app = (
                                        <ApolloProvider client={client} store={store}>
                                            <Component url={url} {...props} />
                                        </ApolloProvider>
                                    )
                                    return getDataFromTree(app)
                                }
                            })
                            .then(() => {
                                const state = store.getState()

                                return Object.assign({
                                    initialState: Object.assign(
                                        {},
                                        state,
                                        {
                                            apollo: {
                                                data: client.getInitialState().data
                                            }
                                        }
                                    )
                                }, props)
                            })
                    })
            }

            constructor (props) {
                super(props)
                // On server, this client won't be doing any work, because all work has been done in getInitialProps
                this.client = initClient(url, {}, opts)
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
}

module.exports.clear = () => client = null