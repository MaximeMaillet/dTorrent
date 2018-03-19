require('dotenv').config();
const get = require('lodash.get');
const path = require('path');
const {getDataTorrentFromFile} = require('../utils/torrent');
const servers = require('../../index');

class Torrent {
  constructor(hash) {
    this.watchedKeys = [
      'downloaded', 'uploaded', 'active'
    ];

    this.hash = hash;
    this.name = 'N/A';
    this.length = 0;
    this.active = false;
    this.downloaded = 0;
    this.uploaded = 0;
    this.extra = {};
    this.path = '';

    this.ratio = 0;
    this.finished = false;
    this.progress = 0;
    this.files = [];
  }

  /**
   * @param pid
   */
  addPid(pid) {
    this.pid = parseInt(pid);
  }

  /**
   * @param torrent
   * @param shouldUpdate
   * @return {Torrent}
   */
  merge(torrent, shouldUpdate) {
    this.hash = get(torrent, 'hash', this.hash);
    this.name = get(torrent, 'name', this.name);
    this.length = get(torrent, 'length', this.length);
    this.path = get(torrent, 'path', this.path);
    this.downloaded = get(torrent, 'downloaded', this.downloaded);
    this.uploaded = get(torrent, 'uploaded', this.uploaded);
    this.extra = get(torrent, 'extra', this.extra);
    this.active = get(torrent, 'active', this.active);

    torrent = null;
    if(shouldUpdate) {
      this.update();
    }
    return this;
  }

  /**
   * Update volatile attributes
   */
  update() {
    const dataFiles = getDataTorrentFromFile(path.resolve(process.env.DIR_TORRENT+this.path));
    this.files = this.getFiles(dataFiles.files);

    this.progress = Math.round((this.downloaded*100) / this.length);
    this.finished = this.progress === 100;

    this.ratio = (this.uploaded / this.downloaded).toFixed(4);
  }

  /**
   * @param buffer
   * @return {Array}
   */
  getFiles(buffer) {
    const arrayReturn = [];
    for(const i in buffer) {
      arrayReturn.push({
        name: buffer[i].name,
        path: buffer[i].path,
        length: buffer[i].length,
      });
    }

    return arrayReturn;
  }

  /**
   * @param torrent
   * @return {Array}
   */
  getDiff(torrent) {
    const diff = [];
    for(const i in this.watchedKeys) {
      if(this[this.watchedKeys[i]] !== torrent[this.watchedKeys[i]]) {
        diff.push(this.watchedKeys[i]);
      }
    }
    return diff;
  }

  /**
   * Formated displaying
   * @return {{hash: *, name: (string|*), active: (boolean|*), downloaded: (number|*), uploaded: (number|*), length: (number|*), path: (string|*), extra: *, ratio: (number|*), finished: (boolean|*), files: (Array|*), progress: (number|*), pid: (Number|*), total: (number|*)}}
   */
  toString() {
    const server = servers.getServer(this.pid);
    return {
      server: server.config.name,
      hash: this.hash,
      name: this.name,
      active: this.active,
      downloaded: this.downloaded,
      uploaded: this.uploaded,
      length: this.length,
      path: this.path,
      extra: this.extra,
      progress: this.progress,
      ratio: this.ratio,
      finished: this.finished,
      files: this.files,
    };
  }
}

module.exports = Torrent;