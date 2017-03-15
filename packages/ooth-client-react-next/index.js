const React = require('react')
const {addInitialProps, composeInitialProps} = require('compose-next')
const {OothProvider} = require('ooth-client-react')
const {defaultProps} = require('recompose')

module.exports = (oothClient) => {

    const OothProviderWithClient = defaultProps({
        client: oothClient
    })(OothProvider)

    const OothProviderWithInitialProps = addInitialProps(ctx => {
        return new Promise((resolve, reject) => {
            if (ctx.req) {
                return resolve({
                    initialUser: ctx.req.user
                })
            } else {
                oothClient.start().then(user => {
                    return resolve({
                        initialUser: user
                    })
                })
            }
        })
    })(OothProviderWithClient)

    return composeInitialProps(OothProviderWithInitialProps)
}