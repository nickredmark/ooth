import {UserProvider, withUser} from '.'

describe('user-subscription', () => {
    test('UserProvider exists', () => {
        expect(UserProvider).toBeTruthy()
    })

    test('withUser exists', () => {
        expect(withUser).toBeTruthy()
    })
})
