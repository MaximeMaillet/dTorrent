const hh = require('http-https');
const url = require('url');

class ListenerHandler {
  constructor() {
    this.listeners = [];
    this.webhooks = [];
  }

  on(event, torrent, extra) {
    for(const i in this.listeners) {
      switch(event) {
        case module.exports.EVENT.ADDED:
          if(this.listeners[i].onAdded) {
            this.listeners[i].onAdded(torrent.toString());
          }
          this.sendWebHook(event, torrent.toString());
          break;
        case module.exports.EVENT.REMOVED:
          if(this.listeners[i].onRemoved) {
            this.listeners[i].onRemoved(torrent.toString());
          }
          this.sendWebHook(event, torrent.toString());
          break;
        case module.exports.EVENT.UPDATED:
          if(this.listeners[i].onUpdated) {
            this.listeners[i].onUpdated(torrent.toString(), extra);
          }
          break;
        case module.exports.EVENT.PAUSED:
          if(this.listeners[i].onPaused) {
            this.listeners[i].onPaused(torrent.toString());
          }
          this.sendWebHook(event, torrent.toString());
          break;
        case module.exports.EVENT.RESUMED:
          if(this.listeners[i].onResumed) {
            this.listeners[i].onResumed(torrent.toString());
          }
          this.sendWebHook(event, torrent.toString());
          break;
        case module.exports.EVENT.FINISHED:
          if(this.listeners[i].onFinished) {
            this.listeners[i].onFinished(torrent.toString());
          }
          this.sendWebHook(event, torrent.toString());
          break;
        case module.exports.EVENT.ERROR:
          if(this.listeners[i].onError) {
            this.listeners[i].onError(extra);
          }
          break;
      }
    }
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    this.listeners.splice(this.listeners.indexOf(listener), 1);
  }

  addWebHook(url, callback) {
    if (this.webhooks.indexOf(url) === -1) {
      this.webhooks.push({
        url: url.parse(url),
        callback
      });
    }
  }

  removeWebHook(url) {
    if(this.webhooks.indexOf(url) !== -1) {
      this.webhooks.splice(this.webhooks.indexOf(url), 1);
    }
  }

  /**
   * Send request to web hooks
   * @param event
   * @param torrent
   */
  sendWebHook(event, torrent) {
    for (const i in this.webhooks) {
      const req = hh.request({
        method: 'POST',
        port: this.webhooks[i].url.port,
        protocol: this.webhooks[i].url.protocol,
        hostname: this.webhooks[i].url.hostname,
        path: this.webhooks[i].url.path,
        headers: {
          'Content-Type': 'application/json'
        },
      }, (res) => {
        if(res.statusCode < 200 || res.statusCode > 299) {
          res.on('data', (body) => {
            this.webhooks[i].callback.onFailed(this.webhooks[i].url, res.statusCode, body.toString(), res.headers);
          });
        }
      });
      req.on('error', (e) => {
        this.webhooks[i].callback.onError(this.webhooks[i].url, e);
      });
      req.write(JSON.stringify({
        entity: 'torrent',
        event,
        torrent
      }));
      req.end();
    }
  }
}

module.exports.ListenerHandler = ListenerHandler;

module.exports.EVENT = {
	ADDED: 'added',
	REMOVED: 'removed',
	UPDATED: 'updated',
	FINISHED: 'finished',
	RESUMED: 'resumed',
	PAUSED: 'paused',
  ERROR: 'error',
};