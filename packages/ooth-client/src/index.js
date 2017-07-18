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
            .then((response) => {
                if (response.status === 'error') {
                    throw new Error(response.message)
                }
                const { user, token } = response
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
            })
            .then((user) => {
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
        }).then(response => {
            if (response.status === 'error') {
                throw new Error(response.message)
            } else {
                if (response.user) {
                    this.next(response.user)
                }
                return response
            }
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
    status(cookies) {
        const opts = {
            method: 'GET',
        }
        if (cookies) {
            opts.headers = {
                'Cookie': Object.keys(cookies).map(key => `${key}=${cookies[key]}`).join('; ')
            }
        } else {
            opts.credentials = 'include'
        }
        return fetch(`${this.oothUrl}/status`, opts).then(response => {
            return response.json()
        }).then(({ user }) => {
            return this.next(user)
        })
    }
    subscribeStatus() {
        if (typeof WebSocket !== 'undefined') {
            const urlParts = url.parse(this.oothUrl)
            const protocol = urlParts.protocol === 'https:' ? 'wss' : 'ws'
            const wsUrl = `${protocol}://${urlParts.host}${urlParts.path}/status`
            const socket = new WebSocket(wsUrl)
            socket.onerror = (err) => {
                console.error(err)
            }
            socket.onopen = () => {}
            socket.onclose = () => {}
            socket.onmessage = ({ data }) => {
                const { user } = JSON.parse(data)
                return this.next(user)
            }
        }
    }
}

module.exports = OothClient