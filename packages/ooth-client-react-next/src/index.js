const React = require('react')
const { addInitialProps, composeInitialProps } = require('compose-next')
const { OothProvider } = require('ooth-client-react')

module.exports = oothClient => {
    class OothProviderWithInitialProps extends React.Component {
        static getInitialProps(ctx) {
            return Promise.resolve()
                .then(() => {
                    if (ctx.req) {
                        return oothClient.status(ctx.req.cookies)
                    } else {
                        return oothClient.start()
                    }
                })
                .then(initialUser => ({
                    initialUser,
                }))
        }

        render() {
            const {initialUser, children} = this.props

            return <OothProvider client={oothClient} initialUser={initialUser}>
                {children}
            </OothProvider>
        }
    }    

    return composeInitialProps(OothProviderWithInitialProps)
}
