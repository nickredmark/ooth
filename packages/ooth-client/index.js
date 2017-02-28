const fetch = require('isomorphic-fetch')

class OothClient {
    constructor({
        oothUrl,
        standalone,
        apiLoginUrl,
        apiLogoutUrl
    }) {
        this.oothUrl = oothUrl
        this.standalone = standalone
        if (standalone) {
            this.apiLoginUrl = apiLoginUrl
            this.apiLogoutUrl = apiLogoutUrl
        }
    }
    authenticate(strategy, method, body) {
        return fetch(`${this.oothUrl}/${strategy}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body && JSON.stringify(body),
            credentials: 'include'
        }).then(response => {
            if (this.standalone) {
                return response.json().then(({token}) => {
                    return fetch(this.apiLoginUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `JWT ${token}`
                        },
                        credentials: 'include'
                    })
                })
            }
        })
    }
    method(strategy, method, body) {
        return fetch(`${this.oothUrl}/${strategy}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            credentials: 'include'
        }).then(response => {
            return response.json()
        })
    }
    logout() {
        return fetch(`${this.oothUrl}/logout`, {
            method: 'POST',
            credentials: 'include'
        }).then(response => {
            if (this.standalone) {
                return fetch(this.apiLogoutUrl, {
                    method: 'POST',
                    credentials: 'include'
                })
            }
        })
    }
    status() {
        return fetch(`${this.oothUrl}/status`, {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            return response.json()
        })
    }
}

module.exports = OothClient