// provider.js — Nuvio Vidstuck Provider
// Compatible sa Nuvio 0.5.x+ format
// Hermes-compatible: walang async/await, arrow functions, o const/let

// ===== PRIMARY ENDPOINTS (Vidstuck) =====
var VIDSTUCK_MOVIE = 'https://embed.vidstuck.xyz/embed/movie/';
var VIDSTUCK_TV = 'https://embed.vidstuck.xyz/embed/tv/';

// ===== FALLBACK ENDPOINTS (kung mag-fail ang Vidstuck) =====
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

function buildMovieUrl(endpoint, tmdbId) {
  // Vidstuck: https://embed.vidstuck.xyz/embed/movie/{tmdbId}
  return endpoint + tmdbId;
}

function buildTvUrl(endpoint, tmdbId, season, episode) {
  // Vidstuck: https://embed.vidstuck.xyz/embed/tv/{tmdbId}/{season}/{episode}
  return endpoint + tmdbId + '/' + season + '/' + episode;
}

function getStreams(params) {
  var tmdbId = params.tmdbId;
  var mediaType = params.mediaType;
  var season = params.season || 1;
  var episode = params.episode || 1;
  var streams = [];
  var i;

  if (mediaType === 'movie') {
    // Primary: Vidstuck
    streams.push({
      name: 'Vidstuck',
      title: 'Vidstuck — HD',
      url: buildMovieUrl(VIDSTUCK_MOVIE, tmdbId),
      quality: 'HD',
      type: 'iframe',
      provider: 'Vidstuck'
    });

    // Fallbacks (para may backup kung hindi gumana ang Vidstuck)
    for (i = 1; i < MOVIE_FALLBACKS.length; i++) {
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
  } else if (mediaType === 'tv') {
    // Primary: Vidstuck
    streams.push({
      name: 'Vidstuck',
      title: 'Vidstuck — HD',
      url: buildTvUrl(VIDSTUCK_TV, tmdbId, season, episode),
      quality: 'HD',
      type: 'iframe',
      provider: 'Vidstuck'
    });

    // Fallbacks
    for (i = 1; i < TV_FALLBACKS.length; i++) {
      var t = TV_FALLBACKS[i];
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

module.exports = {
  getStreams: getStreams
};
