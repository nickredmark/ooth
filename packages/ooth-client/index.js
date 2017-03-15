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
        if (standalone) {
            this.apiLoginUrl = apiLoginUrl
            this.apiLogoutUrl = apiLogoutUrl
        }
    }
    start() {
        return new Promise((resolve, reject) => {
            if (!this.started) {
                this.started = true
                this.user()
                this.subscribeStatus()
                return this.status().then(resolve)
            } else {
                return resolve(this.user().getValue())
            }
        })
    }
    user() {
        if (!this.userSubject) {
            this.userSubject = new Rx.BehaviorSubject(null)
        }
        return this.userSubject
    }
    next(user) {
        if (this.userSubject) {
            this.userSubject.onNext(user)
        }
        return user
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
            return this.next(user)
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
            return this.next(null)
        })
    }
    status() {
        return fetch(`${this.oothUrl}/status`, {
            method: 'GET',
            credentials: 'include'
        }).then(response => {
            return response.json()
        }).then(({user}) => {
            return this.next(user)
        })
    }
    subscribeStatus() {
        if (typeof WebSocket !== 'undefined') {
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
                return this.next(user)
            }
        }
    }
}

module.exports = OothClient
