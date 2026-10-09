// provider.js — Nuvio Vidstuck Provider (Stremio Addon Format)
// Compatible sa Nuvio Mobile 0.5.x+

var http = require('http');

// ===== MANIFEST =====
var manifest = {
  id: 'nuvio.vidstuck',
  version: '1.0.0',
  name: 'Vidstuck Provider',
  description: 'Streams movies and TV shows from Vidstuck embed source.',
  logo: 'https://cdn-icons-png.flaticon.com/512/2503/2503508.png',
  resources: ['stream'],
  types: ['movie', 'series'],
  idPrefixes: ['tt', 'tmdb:'],
  catalogs: [],
  behaviorHints: {
    configurable: false
  }
};

// ===== ENDPOINTS =====
var VIDSTUCK_MOVIE = 'https://embed.vidstuck.xyz/embed/movie/';
var VIDSTUCK_TV = 'https://embed.vidstuck.xyz/embed/tv/';

var MOVIE_FALLBACKS = [
  { name: 'Vidstuck', url: VIDSTUCK_MOVIE },
  { name: 'Zxcstream', url: 'https://zxcstream.icu/watch/movie/' },
  { name: 'VidLink', url: 'https://vidlink.pro/movie/' },
  { name: '111Movies', url: 'https://111movies.com/movie/' },
  { name: '2Embed', url: 'https://www.2embed.cc/embed/' }
];

var TV_FALLBACKS = [
  { name: 'Vidstuck', url: VIDSTUCK_TV },
  { name: 'Zxcstream', url: 'https://zxcstream.icu/watch/tv/' },
  { name: 'VidSrc.me', url: 'https://vidsrc.me/embed/tv/' }
];

// ===== HELPERS =====
function buildMovieUrl(endpoint, tmdbId) {
  return endpoint + tmdbId;
}

function buildTvUrl(endpoint, tmdbId, season, episode) {
  return endpoint + tmdbId + '/' + season + '/' + episode;
}

// ===== STREAM HANDLER =====
function getStreams(type, id) {
  var streams = [];
  var tmdbId = id.replace('tmdb:', '').replace('tt', ''); // Basic ID cleaning
  var season = 1;
  var episode = 1;

  // Check if may season/episode sa ID (format: tt1234:1:1)
  if (id.indexOf(':') !== -1) {
    var parts = id.split(':');
    tmdbId = parts[0].replace('tmdb:', '').replace('tt', '');
    season = parts[1] || 1;
    episode = parts[2] || 1;
  }

  if (type === 'movie') {
    for (var i = 0; i < MOVIE_FALLBACKS.length; i++) {
      var m = MOVIE_FALLBACKS[i];
      streams.push({
        name: m.name,
        title: m.name + ' — HD',
        url: buildMovieUrl(m.url, tmdbId),
        quality: 'HD',
        type: 'iframe',
        provider: m.name
      });
    }
  } else if (type === 'series') {
    for (var j = 0; j < TV_FALLBACKS.length; j++) {
      var t = TV_FALLBACKS[j];
      streams.push({
        name: t.name,
        title: t.name + ' — HD',
        url: buildTvUrl(t.url, tmdbId, season, episode),
        quality: 'HD',
        type: 'iframe',
        provider: t.name
      });
    }
  }

  return streams;
}

// ===== ROUTER (Standard Stremio Addon SDK format) =====
function getRouter() {
  return function (args) {
    // args: { type, id, resource, ... }
    var resource = args.resource;
    var type = args.type;
    var id = args.id;

    if (resource === 'stream') {
      var streams = getStreams(type, id);
      return Promise.resolve({ streams: streams });
    }

    return Promise.resolve({});
  };
}

// ===== EXPORTS (Ito ang hinahanap ng Nuvio) =====
module.exports = {
  manifest: manifest,
  getRouter: getRouter
};
