const EventEmitter = require('events')
const request = require('request-promise');
const leven = require('leven')

const lapseDefault = 10000


function activeInterval(opt ,webPage, page,control, lapse) {
    return setInterval(() => {
        request(opt)
            .then((body) => {
                webPage.emit('check',page,body)
                if (!control(page,body)) webPage.emit('alert',opt.uri, body)
                webPage.page = body
            })
            .catch((err) => webPage.emit('error', err))

    }, lapse)
}

class WebPage extends EventEmitter {
    constructor(uri, options) {
        super()
        this.opt = {
            uri: uri,
            headers: {
                'User-Agent': 'Request-Promise'
            }
        }
        this.control = (options.whileControl && typeof options.whileControl === 'function')
            ? options.whileControl
            : (oldPage, newPage) => (leven(oldPage, newPage)/oldPage.length) <= options.percentualDiff
        this.lapse = (options.lapse && typeof options.lapse === 'number')
            ? options.lapse
            : lapseDefault
        this.numberInterval = undefined
        if (typeof options === 'function') this.control = options
        this.page = undefined

    }

    start() {
        request(this.opt)
            .then((body) => {
                if (this.numberInterval) return console.warn('Warning: You called the start function twice')
                this.emit('start', this.opt.uri)
                this.page = body
                this.numberInterval = activeInterval(this.opt, this, this.page,
                                                        this.control,this.lapse)
            })
            .catch((error) => this.emit('error', error))
        return this
    }

    stop() {
        if (!this.numberInterval) return
        clearInterval(this.numberInterval)
        this.numberInterval = undefined
        return this
    }
}

module.exports = WebPage