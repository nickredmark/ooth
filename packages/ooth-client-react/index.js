const React = require('react')
const {withContext, getContext} = require('recompose')

const ID = ({children}) => React.Children.only(children)

const OothProvider = withContext({
    oothClient: React.PropTypes.object.isRequired
}, ({client: oothClient}) => ({oothClient}))(ID)

const withOoth = getContext({
    oothClient: React.PropTypes.object.isRequired
})

module.exports = {
    OothProvider,
    withOoth
}