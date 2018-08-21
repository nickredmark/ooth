import provideApollo, {clear} from '../src'
import React from 'react'
import withApollo from 'react-apollo'
import ShallowRenderer from 'react-test-renderer/shallow';
import { IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';

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

        const NC2 = hoc(C)
        const initialProps2 = await NC2.getInitialProps({})
        const renderer2 = new ShallowRenderer()
        renderer2.render(<NC2 />)
        const result2 = renderer2.getRenderOutput()
        result2.props.client.x = true

        expect(result.props.client).toBe(result2.props.client)
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

        const NC2 = hoc(C)
        const initialProps2 = await NC2.getInitialProps({})
        const renderer2 = new ShallowRenderer()
        renderer2.render(<NC2 />)
        const result2 = renderer2.getRenderOutput()
        result2.props.client.x = true

        expect(result.props.client).not.toBe(result2.props.client)
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
    })
})