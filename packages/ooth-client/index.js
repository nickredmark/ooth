const fetch = require('isomorphic-fetch')

class OothClient {
    constructor({
        oothUrl,
        apiLoginUrl,
        apiLogoutUrl
    }) {
        this.oothUrl = oothUrl
        this.apiLoginUrl = apiLoginUrl
        this.apiLogoutUrl = apiLogoutUrl
    }
    authenticate(strategy, method, body) {
        return fetch(`${this.oothUrl}/${strategy}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body && JSON.stringify(body)
        }).then(response => {
            return response.json()
        }).then(({token}) => {
            return fetch(this.apiLoginUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `JWT ${token}`
                },
                credentials: 'include'
            })
        })
    }
    method(strategy, method, body) {
        return fetch(`${this.oothUrl}/${strategy}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(response => {
            return response.json()
        })
    }
    logout() {
        return fetch(this.apiLogoutUrl, {
            method: 'POST',
            credentials: 'include'
        })
    }
}

module.exports = OothClient