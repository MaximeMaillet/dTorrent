require('dotenv').config();
'use strict';

const debug = require('debug');
const workerList = require('./src/workers/list');
const torrentHandler = require('./src/handlers/torrent-handler');
const listenerHandler = require('./src/handlers/listener-handler');

const lDebug = debug('dTorrent:app:debug');
const lError = debug('dTorrent:app:error');

/**
 * Start app
 * @param config
 * @return {Promise.<void>}
 */
module.exports.start = async(config) => {

	try {
		lDebug('Start app');
		addConfig(config);
		await workerList.start({listenerHandler, torrentHandler});
	} catch(e) {
		lError(`Exception app ${e}`);
	}
};

/**
 * @return {Promise.<exports>}
 */
module.exports.manager = async() => {
	return require('./src/manager')({listenerHandler, torrentHandler});
};

/**
 * Add config
 * @param config
 */
function addConfig(config) {
	lDebug('Check configuration');
	const configs = [
		{name: 'rtorrent_host', default: '127.0.0.1'},
		{name: 'rtorrent_port', default: '8080'},
		{name: 'rtorrent_path', default: '/RPC2'},
		{name: 'interval_check', default: 1500}
	];

	for(const i in configs) {
		if(config && config[configs[i].name]) {
			process.env[configs[i].name.toUpperCase()] = config[configs[i]];
		} else if(!process.env[configs[i].name.toUpperCase()]) {
			process.env[configs[i].name.toUpperCase()] = configs[i].default;
		}
	}
}