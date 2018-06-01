import emailer from '.'

describe('ooth-local-emailer', () => {
    let sendMail = () => null;
    let emailerConfigs;
    let emailerCallbacks
    
    beforeEach(() => {
        sendMail = jest.fn()
        emailerConfigs = {
            from: 'noreply@example.com',
            siteName: 'Example Site',
            url: 'http://www.example.com',
            sendMail,
        };
        emailerCallbacks = emailer(emailerConfigs);
    })

    it('sends mails on register', () => {
        emailerCallbacks.onRegister({
            email: 'user@gmail.com',
            verificationToken: 'xxx',
            _id: '1',
        })
        expect(sendMail.mock.calls).toMatchSnapshot()
    })

    it('sends mail on verification token', () => {
        emailerCallbacks.onGenerateVerificationToken({
            email: 'user@gmail.com',
            verificationToken: 'xxx',
            _id: '1',
        })
        expect(sendMail.calls).toMatchSnapshot()
    })

    it('sends mail on set email', () => {
        emailerCallbacks.onSetEmail({
            email: 'user@gmail.com',
            verificationToken: 'xxx',
            _id: '1',
        })
        expect(sendMail.mock.calls).toMatchSnapshot()
    })

    it('sends mail on verify', () => {
        emailerCallbacks.onVerify({
            email: 'user@gmail.com',
        })
        expect(sendMail.mock.calls).toMatchSnapshot()
    })

    it('sends mail on forgot password', () => {
        emailerCallbacks.onForgotPassword({
            email: 'user@gmail.com',
            passwordResetToken: 'xxx',
            _id: '1',
        })
        expect(sendMail.mock.calls).toMatchSnapshot()
    })

    it('sends mail on reset password', () => {
        emailerCallbacks.onResetPassword({
            email: 'user@gmail.com',
        })
        expect(sendMail.mock.calls).toMatchSnapshot()
    })

    it('sends mail on change password', () => {
        emailerCallbacks.onChangePassword({
            email: 'user@gmail.com',
        })
        expect(sendMail.mock.calls).toMatchSnapshot()
    })
})
