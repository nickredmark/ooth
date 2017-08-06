import provideApollo, {clear} from '.'
import React from 'react'
import withApollo, { IntrospectionFragmentMatcher } from 'react-apollo'
import ShallowRenderer from 'react-test-renderer/shallow';

const C = provideApollo(() => {
    return <p></p>
})

describe('provideApollo', () => {
    beforeEach(() => {
        delete(process.browser)
        clear()
    })

    test('only with url', async () => {
        process.browser = true
        const hoc = provideApollo({
            url: 'http://localhost:8080',
        })
        const NC = hoc(C)
        const initialProps = await NC.getInitialProps({})
        const renderer = new ShallowRenderer()
        renderer.render(<NC />)
        const result = renderer.getRenderOutput()
        expect(result.props.client.networkInterface._uri).toBe('http://localhost:8080')
    })

    test('only with url - ssr', async () => {
        const hoc = provideApollo({
            url: 'http://localhost:8080',
        })
        const NC = hoc(C)
        const initialProps = await NC.getInitialProps({})
        const renderer = new ShallowRenderer()
        renderer.render(<NC />)
        const result = renderer.getRenderOutput()
        expect(result.props.client.networkInterface._uri).toBe('http://localhost:8080')
    })

    test('with fragment matcher', async () => {
        process.browser = true
        const fragmentMatcher = new IntrospectionFragmentMatcher({
            introspectionQueryResultData: {
                __schema: {
                    types: [
                        {
                            kind: "INTERFACE",
                            name: "Character",
                            possibleTypes: [
                                { name: "Jedi" },
                                { name: "Droid" },
                            ],
                        },
                    ],
                },
            },
        })
        const hoc = provideApollo({
            url: 'http://localhost:8080',
            opts: {
                fragmentMatcher,
            },
        })
        const NC = hoc(C)
        const initialProps = await NC.getInitialProps({})
        const renderer = new ShallowRenderer()
        renderer.render(<NC />)
        const result = renderer.getRenderOutput()
        expect(result.props.client.fragmentMatcher).toBe(fragmentMatcher)
    })

    test('with fragment matcher - ssr', async () => {
        const fragmentMatcher = new IntrospectionFragmentMatcher({
            introspectionQueryResultData: {
                __schema: {
                    types: [
                        {
                            kind: "INTERFACE",
                            name: "Character",
                            possibleTypes: [
                                { name: "Jedi" },
                                { name: "Droid" },
                            ],
                        },
                    ],
                },
            },
        })
        const hoc = provideApollo({
            url: 'http://localhost:8080',
            opts: {
                fragmentMatcher,
            },
        })
        const NC = hoc(C)
        const initialProps = await NC.getInitialProps({})
        const renderer = new ShallowRenderer()
        renderer.render(<NC />)
        const result = renderer.getRenderOutput()
        expect(result.props.client.fragmentMatcher).toBe(fragmentMatcher)
    })
})