const React = require('react')

const addInitialProps = (getInitialProps) => {
    return Component => (
        class extends React.Component {
            static getInitialProps(ctx) {
                return getInitialProps(ctx)
            }
            render() {
                return React.createElement(Component, this.props)
            }
        }
    )
}

const composeInitialProps = (Parent) => (
    (Child) => (
        class extends React.Component {
            static getInitialProps(ctx) {
                return Parent.getInitialProps(ctx).then(parentProps => {
                    if (Child.getInitialProps) {
                        return Child.getInitialProps(ctx).then(childProps => {
                            return {
                                parentProps,
                                childProps
                            }
                        })
                    } else {
                        return {
                            parentProps,
                            childProps: {}
                        }
                    }
                })
            }
            render() {
                return React.createElement(
                    Parent,
                    this.props.parentProps,
                    React.createElement(Child, this.props.childProps)
                )
            }
        }
    )
)

module.exports = {
    addInitialProps,
    composeInitialProps
}