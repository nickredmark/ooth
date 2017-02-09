const fetch = require('isomorphic-fetch')

class OothClient {
    constructor({
        oothUrl,
        apiUrl
    }) {
        this.oothUrl = oothUrl
        this.apiUrl = apiUrl
    }
    use(name, strategy) {
        strategy({
        })
    }
    authenticate(strategy, method, body) {
        console.log("trying to auth?")
        return fetch(`${this.url}/${strategy}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(response => {
            return response.json()
        }).then(({token}) => {
            return fetch(`${this.apiUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authentication: `JWT${token}`
                },
                body: JSON.stringify({
                    token
                })
            })
        })
    }
    method(strategy, method, body) {
        return fetch(`${this.url}/${strategy}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(response => {
            return response.json()
        })
    }
}

module.exports = OothClient