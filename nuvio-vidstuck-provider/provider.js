// provider.js — Nuvio Vidstuck Provider (Stremio Addon Format)
// May IMDb to TMDB converter para gumana ang Vidstuck

var https = require('https');

// ===== MANIFEST =====
var manifest = {
  id: 'nuvio.vidstuck',
  version: '1.0.1',
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

// ===== HELPER: Fetch TMDB ID from IMDb ID using Cinemeta =====
function getTmdbId(imdbId, type, callback) {
  // Kung TMDB ID na agad, ibalik na lang
  if (imdbId.indexOf('tmdb:') === 0) {
    callback(imdbId.replace('tmdb:', ''));
    return;
  }

  // Kung IMDb ID, i-convert gamit ang Cinemeta API
  var url = 'https://v3-cinemeta.strem.io/meta/' + type + '/' + imdbId + '.json';
  
  https.get(url, function(res) {
    var data = '';
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() {
      try {
        var json = JSON.parse(data);
        // Ang Cinemeta ay may "moviedb_id" o "tmdb_id" sa meta
        var tmdbId = json.meta.moviedb_id || json.meta.tmdb_id || null;
        callback(tmdbId);
      } catch (e) {
        callback(null);
      }
    });
  }).on('error', function() {
    callback(null);
  });
}

// ===== STREAM HANDLER =====
function getStreams(type, id, callback) {
  var imdbId = id.split(':')[0]; // Kunin lang yung IMDb ID part
  var season = 1;
  var episode = 1;

  if (id.indexOf(':') !== -1) {
    var parts = id.split(':');
    imdbId = parts[0];
    season = parts[1] || 1;
    episode = parts[2] || 1;
  }

  // I-convert ang IMDb ID sa TMDB ID
  var contentType = (type === 'movie') ? 'movie' : 'series';
  
  getTmdbId(imdbId, contentType, function(tmdbId) {
    if (!tmdbId) {
      // Kung walang TMDB ID, ibalik ang empty streams
      callback({ streams: [] });
      return;
    }

    var streams = [];

    if (type === 'movie') {
      streams.push({
        name: 'Vidstuck',
        title: 'Vidstuck — HD',
        url: VIDSTUCK_MOVIE + tmdbId,
        quality: 'HD',
        type: 'iframe',
        provider: 'Vidstuck'
      });
    } else if (type === 'series') {
      streams.push({
        name: 'Vidstuck',
        title: 'Vidstuck — HD',
        url: VIDSTUCK_TV + tmdbId + '/' + season + '/' + episode,
        quality: 'HD',
        type: 'iframe',
        provider: 'Vidstuck'
      });
    }

    callback({ streams: streams });
  });
}

// ===== ROUTER =====
function getRouter() {
  return function (args) {
    var resource = args.resource;
    var type = args.type;
    var id = args.id;

    if (resource === 'stream') {
      return new Promise(function(resolve) {
        getStreams(type, id, function(result) {
          resolve(result);
        });
      });
    }

    return Promise.resolve({});
  };
}

// ===== EXPORTS =====
module.exports = {
  manifest: manifest,
  getRouter: getRouter
};
