import 'isomorphic-unfetch'
import ApolloClient from 'apollo-client'
import {HttpLink} from 'apollo-link-http'
import {ApolloLink} from 'apollo-link'
import {InMemoryCache} from 'apollo-cache-inmemory'
import {ApolloProvider, getDataFromTree} from 'react-apollo'
import React from 'react'

let client = null

const getBrowserClient = (uri, cacheOpts, initialData) => {
    const link = new HttpLink({
        uri,
        credentials: 'include'
    })
    const cache = new InMemoryCache(cacheOpts)
    if (initialData) {
        cache.restore(initialData)
    }
    return new ApolloClient({
        link,
        cache,
    })
}

const getServerClient = (uri, cookies, cacheOpts, initialData) => {
    let link = new HttpLink({
        uri
    })
    if (cookies && Object.keys(cookies).length) {
        const middlewareLink = new ApolloLink((operation, forward) => {
            operation.setContext({
                headers: {
                    Cookie: Object.keys(cookies).map(key => `${key}=${cookies[key]}`).join('; '),
                },
            })
            return forward(operation)
        })
        link = middlewareLink.concat(link);
    }

    const cache = new InMemoryCache(cacheOpts)
    if (initialData) {
        cache.restore(initialData)
    }

    return new ApolloClient({
        ssrMode: true,
        link,
        cache,
    })
}

const getClient = (uri, cookies, cacheOpts, initialData) => {
    if (!process.browser) {
        // on server, create a new client for each request
        return getServerClient(uri, cookies, cacheOpts, initialData)
    } else {
        // on client, create singleton
        if (!client) {
            client = getBrowserClient(uri, cacheOpts, initialData)
        }
        return client
    }
}

module.exports = ({url, opts}) => {
    return (Component) => (
        class extends React.Component {
            static getInitialProps (ctx) {
                const cookies = ctx.req && ctx.req.cookies
                const client = getClient(url, cookies, opts)

                return Promise.resolve(Component.getInitialProps ? Component.getInitialProps(ctx) : {})
                    .then(childProps => {
                        return Promise.resolve()
                            .then(() => {
                                if (!process.browser) {
                                    const url = {
                                        query: ctx.query,
                                        pathname: ctx.pathname,
                                        asPath: ctx.asPath
                                    }
                                    const app = (
                                        <ApolloProvider client={client}>
                                            <Component url={url} {...childProps} />
                                        </ApolloProvider>
                                    )
                                    return getDataFromTree(app)
                                }
                            })
                            .then(() => {
                                return {
                                    initialData: client.cache.extract(),
                                    childProps,
                                }
                            })
                    })
            }

            constructor (props) {
                super(props)
                // On server, this client won't be doing any work, because all work has been done in getInitialProps
                this.client = getClient(url, {}, opts, props.initialData)
            }

            render () {
                return (
                    <ApolloProvider client={this.client}>
                        <Component {...this.props} {...this.props.childProps} />
                    </ApolloProvider>
                )
            }
        }
    )
}

module.exports.clear = () => client = null
