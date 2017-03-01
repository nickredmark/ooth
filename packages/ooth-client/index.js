const fetch = require('isomorphic-fetch')
const Rx = require('rx')
const url = require('url')

class OothClient {
    constructor({
        oothUrl,
        standalone,
        apiLoginUrl,
        apiLogoutUrl
    }) {
        this.oothUrl = oothUrl
        this.standalone = standalone
        this.userSubject = new Rx.Subject()
        if (standalone) {
            this.apiLoginUrl = apiLoginUrl
            this.apiLogoutUrl = apiLogoutUrl
        }
        this.status()
        this.subscribeStatus()
    }
    user() {
        return this.userSubject
    }
    authenticate(strategy, method, body) {
        return fetch(`${this.oothUrl}/${strategy}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body && JSON.stringify(body),
            credentials: 'include'
        })
        .then((response) => {
            return response.json()
        })
        .then(({user, token}) => {
            if (this.standalone) {
                return fetch(this.apiLoginUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `JWT ${token}`
                    },
                    credentials: 'include'
                }).then(() => {
                    return user
                })
            } else {
                return user
            }
        }).then((user) => {
            this.userSubject.onNext(user)
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
        }).then(() => {
            this.userSubject.onNext(null)
        })
    }
    status() {
        return fetch(`${this.oothUrl}/status`, {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            return response.json()
        }).then(({user}) => {
            this.userSubject.onNext(user)
            return user
        })
    }
    subscribeStatus() {
        const urlParts = url.parse(this.oothUrl)
        const wsUrl = `ws://${urlParts.host}${urlParts.path}/status`
        const socket = new WebSocket(wsUrl)
        socket.onerror = (err) => {
            console.error(err)
        }
        socket.onopen = () => {
        }
        socket.onclose = () => {
        }
        socket.onmessage = ({data}) => {
            const {user} = JSON.parse(data)
            this.userSubject.onNext(user)
        }
    }
}

module.exports = OothClient
