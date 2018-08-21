const React = require('react')
const { addInitialProps, composeInitialProps } = require('compose-next')
const { OothProvider } = require('ooth-client-react')

module.exports = oothClient => {
    class OothProviderWithInitialProps extends React.Component {
        static async getInitialProps(ctx) {
            return {
                initialUser: ctx.req
                    ? await oothClient.status(ctx.req.cookies)
                    : await oothClient.start()
            }
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
