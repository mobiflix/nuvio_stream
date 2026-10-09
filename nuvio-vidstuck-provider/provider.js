// provider.js — Nuvio Vidstuck Provider with Extractor
var https = require('https');

var manifest = {
  id: 'nuvio.vidstuck',
  version: '1.0.2',
  name: 'Vidstuck Provider',
  description: 'Streams movies and TV shows from Vidstuck embed source.',
  logo: 'https://cdn-icons-png.flaticon.com/512/2503/2503508.png',
  resources: ['stream'],
  types: ['movie', 'series'],
  idPrefixes: ['tt', 'tmdb:'],
  catalogs: [],
  behaviorHints: { configurable: false }
};

var VIDSTUCK_MOVIE = 'https://embed.vidstuck.xyz/embed/movie/';
var VIDSTUCK_TV = 'https://embed.vidstuck.xyz/embed/tv/';

// ===== Fetch HTML from URL =====
function fetchHtml(url, callback) {
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }, function(res) {
    var data = '';
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() { callback(data); });
  }).on('error', function() { callback(null); });
}

// ===== Get TMDB ID from IMDb =====
function getTmdbId(imdbId, type, callback) {
  if (imdbId.indexOf('tmdb:') === 0) {
    callback(imdbId.replace('tmdb:', ''));
    return;
  }
  var url = 'https://v3-cinemeta.strem.io/meta/' + type + '/' + imdbId + '.json';
  https.get(url, function(res) {
    var data = '';
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() {
      try {
        var json = JSON.parse(data);
        callback(json.meta.moviedb_id || json.meta.tmdb_id || null);
      } catch (e) { callback(null); }
    });
  }).on('error', function() { callback(null); });
}

// ===== Extract .m3u8 or .mp4 from HTML =====
function extractVideoUrl(html) {
  if (!html) return null;

  // Pattern 1: <source src="...m3u8">
  var match = html.match(/<source[^>]+src=["']([^"']+\.(m3u8|mp4)[^"']*)["']/i);
  if (match) return match[1];

  // Pattern 2: file: "...m3u8" or "file":"..."
  match = html.match(/["']file["']\s*:\s*["']([^"']+\.(m3u8|mp4)[^"']*)["']/i);
  if (match) return match[1];

  // Pattern 3: https://...m3u8 (generic)
  match = html.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/i);
  if (match) return match[1];

  // Pattern 4: https://...mp4
  match = html.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/i);
  if (match) return match[1];

  return null;
}

// ===== Get Streams =====
function getStreams(type, id, callback) {
  var imdbId = id.split(':')[0];
  var season = 1, episode = 1;

  if (id.indexOf(':') !== -1) {
    var parts = id.split(':');
    imdbId = parts[0];
    season = parts[1] || 1;
    episode = parts[2] || 1;
  }

  var contentType = (type === 'movie') ? 'movie' : 'series';

  getTmdbId(imdbId, contentType, function(tmdbId) {
    if (!tmdbId) {
      callback({ streams: [] });
      return;
    }

    var embedUrl;
    if (type === 'movie') {
      embedUrl = VIDSTUCK_MOVIE + tmdbId;
    } else {
      embedUrl = VIDSTUCK_TV + tmdbId + '/' + season + '/' + episode;
    }

    // Fetch embed page and extract direct video URL
    fetchHtml(embedUrl, function(html) {
      var videoUrl = extractVideoUrl(html);

      if (videoUrl) {
        callback({
          streams: [{
            name: 'Vidstuck',
            title: 'Vidstuck — HD',
            url: videoUrl,
            quality: 'HD',
            type: 'video'
          }]
        });
      } else {
        // Fallback: ibalik ang embed URL pero may note
        callback({ streams: [] });
      }
    });
  });
}

function getRouter() {
  return function(args) {
    if (args.resource === 'stream') {
      return new Promise(function(resolve) {
        getStreams(args.type, args.id, function(result) {
          resolve(result);
        });
      });
    }
    return Promise.resolve({});
  };
}

module.exports = {
  manifest: manifest,
  getRouter: getRouter
};
