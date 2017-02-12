import ApolloClient, {createNetworkInterface} from 'apollo-client'

const client = new ApolloClient({
    networkInterface: createNetworkInterface({
        uri: 'http://localhost:3001/graphql',
        opts: {
            credentials: 'include'
        }
    })
})

export default client