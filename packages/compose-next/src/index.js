import React from 'react'

export const addInitialProps = (getInitialProps) => {
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

export const composeInitialProps = (Parent) => (
    (Child) => (
        class extends React.Component {
            static getInitialProps(ctx) {
                if (Parent.getInitialProps) {
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
                } else if (Child.getInitialProps) {
                    return Child.getInitialProps(ctx).then(childProps => {
                        return {
                            parentProps: {},
                            childProps
                        }
                    })
                } else {
                    return new Promise(resolve => {
                        return resolve({
                            parentProps: {},
                            childProps: {}
                        })
                    });
                }
            }
            render() {
                return React.createElement(
                    Parent,
                    Object.assign({}, this.props, this.props.parentProps),
                    React.createElement(Child, Object.assign({}, this.props, this.props.childProps))
                )
            }
        }
    )
)