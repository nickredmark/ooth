import React from 'react'

export const addInitialProps = (getInitialProps) => {
    return Component => (
        class extends React.Component {
            static getInitialProps(ctx) {
                return getInitialProps(ctx)
            }
            render() {
                return <Component {...this.props}/>
            }
        }
    )
}

export const composeInitialProps = (Parent) => (
    (Child) => (
        class extends React.Component {
            static getInitialProps(ctx) {
                return Promise.resolve()
                    .then(() => {
                        if (Parent.getInitialProps) {
                            return Parent.getInitialProps(ctx)
                        } else {
                            return {}
                        }
                    })
                    .then(parentProps => {
                        return Promise.resolve()
                            .then(() => {
                                if (Child.getInitialProps) {
                                    return Child.getInitialProps(ctx)
                                } else {
                                    return {}
                                }
                            })
                            .then(childProps => {
                                return childProps
                            })
                            .then(childProps => ({
                                parentProps,
                                childProps,
                            }))
                    })
            }
            render() {
                return <Parent
                    {...this.props}
                    {...this.props.parentProps}
                >
                    <Child
                        {...this.props}
                        {...this.props.childProps}
                    />
                </Parent>
            }
        }
    )
)
