import OothClient from '.'

describe('OothClient', () => {
    test('can construct', () => {
        const client = new OothClient({
            oothUrl: 'http://localhost:3000/auth',
        })
        expect(client).toMatchSnapshot()
    })

    test('can construct standalone', () => {
        const client = new OothClient({
            oothUrl: 'http://localhost:3000/auth',
            standalone: true,
            apiLoginUrl: 'http://localhost:3000/login',
            apiLogoutUrl: 'http://localhost:3000/logout',
        })
        expect(client).toMatchSnapshot()        
    })
})
