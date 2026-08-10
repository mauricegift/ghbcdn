/*
· base : https://m.youtube.com/
· creator : phrzy
· channel : https://whatsapp.com/channel/0029VbD1zGq6mYPUbtVh6U0L/121
*/

const BASE = "https://m.youtube.com";
const API = "https://m.youtube.com/youtubei/v1";
const ANDROID_VR_KEY = "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w";
const UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

let config = null;

async function bootstrap(force = false) {
  if (config && !force) return config;
  const res = await fetch(`${BASE}/`, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
  });
  const html = await res.text();
  config = {
    key: html.match(/INNERTUBE_API_KEY":"([^"]+)"/)[1],
    version: html.match(/INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/)[1],
    visitorData: html.match(/visitorData":"([^"]+)"/)[1],
    gl: (html.match(/"GL":"([^"]+)"/) || [])[1] || "US",
  };
  return config;
}

async function youtubei(endpoint, payload) {
  const { key } = await bootstrap();
  const res = await fetch(`${API}/${endpoint}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA, Origin: BASE },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json;
}

function mweb() {
  return {
    clientName: "MWEB",
    clientVersion: config.version,
    visitorData: config.visitorData,
    hl: "en",
    gl: config.gl,
  };
}

function text(runs) {
  return (runs || []).map((r) => r.text).join("").trim();
}

function thumbnail(thumbnails) {
  if (!thumbnails || !thumbnails.length) return null;
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0].url;
}

function findAll(obj, key, out = []) {
  if (!obj || typeof obj !== "object") return out;
  if (Array.isArray(obj)) {
    for (const item of obj) findAll(item, key, out);
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === key) out.push(v);
    else findAll(v, key, out);
  }
  return out;
}

function collectItems(json) {
  const items = [];
  for (const section of findAll(json, "itemSectionRenderer")) {
    for (const item of section.contents || []) {
      const parsed = parseSearchItem(item);
      if (!parsed) continue;
      if (Array.isArray(parsed)) items.push(...parsed);
      else items.push(parsed);
    }
  }
  return items;
}

async function search(query, page = 1) {
  const payload = { context: { client: mweb() }, query };
  let json = await youtubei("search", payload);

  if (page > 1) {
    for (let i = 1; i < page; i++) {
      const token = findAll(json, "continuationCommand").map((c) => c.token).pop();
      if (!token) break;
      json = await youtubei("search", { context: { client: mweb() }, continuation: token });
    }
  }

  const items = collectItems(json);

  return {
    query,
    page,
    results: items,
    estimatedResults: json.estimatedResults,
    hasMore: findAll(json, "continuationCommand").length > 0,
  };
}

function parseSearchItem(item) {
  if (item.videoWithContextRenderer) {
    const v = item.videoWithContextRenderer;
    return {
      type: "video",
      id: v.videoId,
      title: text(v.headline && v.headline.runs),
      channel: text(v.shortBylineText && v.shortBylineText.runs),
      views: text(v.shortViewCountText && v.shortViewCountText.runs),
      thumbnail: thumbnail(v.thumbnail && v.thumbnail.thumbnails),
    };
  }
  if (item.compactRadioRenderer) {
    const v = item.compactRadioRenderer;
    return {
      type: "mix",
      id: v.playlistId,
      title: text(v.title && v.title.runs),
      videoCount: text(v.videoCountText && v.videoCountText.runs),
      thumbnail: thumbnail(v.thumbnail && v.thumbnail.thumbnails),
    };
  }
  if (item.compactPlaylistRenderer) {
    const v = item.compactPlaylistRenderer;
    return {
      type: "playlist",
      id: v.playlistId,
      title: text(v.title && v.title.runs),
      channel: text(v.shortBylineText && v.shortBylineText.runs),
      videoCount: text(v.videoCountText && v.videoCountText.runs),
      thumbnail: thumbnail(v.thumbnail && v.thumbnail.thumbnails),
    };
  }
  if (item.compactChannelRenderer) {
    const v = item.compactChannelRenderer;
    return {
      type: "channel",
      id: v.channelId,
      title: text(v.title && v.title.runs),
      subscribers: text(v.subscriberCountText && v.subscriberCountText.runs),
      videoCount: text(v.videoCountText && v.videoCountText.runs),
      thumbnail: thumbnail(v.thumbnail && v.thumbnail.thumbnails),
    };
  }
  if (item.gridShelfViewModel) {
    return findAll(item.gridShelfViewModel, "shortsLockupViewModel").map(parseShort);
  }
  return null;
}

function parseShort(s) {
  const reel = s.onTap && s.onTap.innertubeCommand && s.onTap.innertubeCommand.reelWatchEndpoint;
  return {
    type: "short",
    id: reel && reel.videoId,
    title: s.accessibilityText ? s.accessibilityText.split(", ")[0] : null,
    thumbnail: thumbnail(s.thumbnail && s.thumbnail.sources),
  };
}

function detectType(id) {
  if (!id || typeof id !== "string") return "unknown";
  if (/^UC[\w-]{22}$/.test(id)) return "channel";
  if (/^RDAM/.test(id)) return "mix";
  if (/^(PL|UU|FL|OLAK5uy_)/.test(id)) return "playlist";
  if (/^[\w-]{11}$/.test(id)) return "video";
  return "unknown";
}

async function info(id) {
  switch (detectType(id)) {
    case "channel":
      return infoChannel(id);
    case "playlist":
      return infoPlaylist(id);
    case "mix":
      return infoMix(id);
    case "video":
      return infoVideo(id);
    default:
      throw new Error(`Cannot determine content type for id: ${id}`);
  }
}

async function infoVideo(videoId) {
  const json = await youtubei("player", {
    context: { client: mweb() },
    videoId,
    contentCheckOk: true,
    racyCheckOk: true,
  });
  const vd = json.videoDetails || {};
  const mf = (json.microformat || {}).playerMicroformatRenderer || {};
  return {
    type: "video",
    id: vd.videoId,
    title: vd.title,
    description: vd.shortDescription,
    author: vd.author,
    channelId: vd.channelId,
    durationSeconds: Number(vd.lengthSeconds) || 0,
    viewCount: vd.viewCount,
    keywords: vd.keywords || [],
    isLive: vd.isLiveContent || false,
    isFamilySafe: mf.isFamilySafe,
    category: mf.category,
    publishDate: mf.publishDate,
    uploadDate: mf.uploadDate,
    thumbnail: thumbnail(vd.thumbnail && vd.thumbnail.thumbnails),
    playability: (json.playabilityStatus || {}).status,
  };
}

function parseLockup(v) {
  const md = (v.metadata && v.metadata.lockupMetadataViewModel) || {};
  const title = md.title && md.title.content;
  const img = (v.contentImage && v.contentImage.thumbnailViewModel && v.contentImage.thumbnailViewModel.image) || {};
  const badges = (img.overlays || [])
    .map((o) => (o.thumbnailBottomOverlayViewModel || {}).badges || [])
    .flat()
    .map((b) => (b.thumbnailBadgeViewModel || {}).text)
    .find(Boolean);
  const parts = findAll(md, "metadataParts").flat();
  const stats = parts.map((p) => p && p.text && viewModelText(p.text)).filter(Boolean);
  return {
    type: "video",
    id: v.contentId,
    title,
    channel: stats[0] || null,
    length: badges || null,
    views: stats[1] || null,
    published: stats[2] || null,
    thumbnail: thumbnail(img.sources),
  };
}

async function infoPlaylist(id) {
  const json = await youtubei("browse", {
    context: { client: mweb() },
    browseId: `VL${id}`,
  });
  const head = (json.header || {}).pageHeaderRenderer || {};
  const phvm = (head.content && head.content.pageHeaderViewModel) || head;
  const metaParts = findAll(phvm, "metadataParts").flat();
  const partsText = metaParts.map((m) => m && m.text && viewModelText(m.text)).filter(Boolean);
  const avatarStack = (findAll(phvm, "avatarStackViewModel")[0] || {});
  const ownerEndpoint = findAll(avatarStack, "browseEndpoint")[0] || {};
  const ownerAvatar = (findAll(avatarStack, "avatarViewModel")[0] || {}).image;
  const videos = findAll(json, "lockupViewModel").map(parseLockup);
  return {
    type: "playlist",
    id,
    title: viewModelText(phvm.title) || head.pageTitle || null,
    description: viewModelText(phvm.description) || null,
    videoCount: partsText.find((s) => /\d+\s*videos?/.test(s)) || null,
    views: partsText.find((s) => /\d[\d,]*\s*views?/.test(s)) || null,
    channel: viewModelText(avatarStack.text) || partsText[0] || null,
    channelId: ownerEndpoint.browseId || null,
    avatar: thumbnail(ownerAvatar && ownerAvatar.sources),
    thumbnail: thumbnail(((findAll(phvm, "thumbnailViewModel")[0] || {}).image || {}).sources),
    videos,
  };
}

function parsePanelVideo(v) {
  return {
    type: "video",
    id: v.videoId,
    title: text(v.title && v.title.runs),
    channel: text(v.longBylineText && v.longBylineText.runs),
    length: text(v.lengthText && v.lengthText.runs),
    selected: v.selected || false,
    thumbnail: thumbnail(v.thumbnail && v.thumbnail.thumbnails),
  };
}

async function infoMix(id) {
  let seed;
  if (id.startsWith("RDAMPL")) {
    const pl = await infoPlaylist(id.slice(6));
    seed = pl.videos[0] && pl.videos[0].id;
  } else {
    seed = id.slice(7);
  }
  if (!seed) throw new Error("Unable to resolve seed video for mix.");
  const json = await youtubei("next", {
    context: { client: mweb() },
    videoId: seed,
    playlistId: id,
  });
  const pl = ((json.contents || {}).singleColumnWatchNextResults || {}).playlist || {};
  const pls = pl.playlist || {};
  const videos = (pls.contents || [])
    .map((c) => c.playlistPanelVideoRenderer)
    .filter(Boolean)
    .map(parsePanelVideo);
  return {
    type: "mix",
    id,
    title: pls.title || "Mix",
    videos,
  };
}

function viewModelText(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v.runs) return text(v.runs);
  if (v.simpleText) return v.simpleText;
  if (v.content && typeof v.content === "string") return v.content;
  const dtv = v.dynamicTextViewModel;
  if (dtv && dtv.text) return viewModelText(dtv.text);
  return null;
}

async function infoChannel(id) {
  const json = await youtubei("browse", {
    context: { client: mweb() },
    browseId: id,
  });
  const meta = findAll(json, "channelMetadataRenderer")[0] || {};
  const header = findAll(json, "pageHeaderViewModel")[0] || findAll(json, "pageHeaderRenderer")[0] || {};
  const title =
    viewModelText(header.title) ||
    text(header.pageTitle && header.pageTitle.runs) ||
    viewModelText(meta.title) ||
    null;
  const metaRows = findAll(header, "metadataParts").flat();
  const handle = metaRows.map((m) => m && m.text && viewModelText(m.text)).find((s) => s && s.startsWith("@"));
  const stats = metaRows.map((m) => m && m.text && viewModelText(m.text)).filter(Boolean);
  const img = (header.image && header.image.thumbnailViewModel && header.image.thumbnailViewModel.image) || {};
  return {
    type: "channel",
    id,
    title,
    description: viewModelText(header.description) || meta.description || null,
    avatar: thumbnail(meta.avatar && meta.avatar.thumbnails) || thumbnail(img.sources),
    handle,
    stats,
    url: meta.vanityChannelUrl || (meta.ownerUrls && meta.ownerUrls[0]) || null,
    isFamilySafe: meta.isFamilySafe || null,
    keywords: (meta.keywords && meta.keywords.split(/,\s*/)) || null,
    country: meta.country || null,
  };
}

async function related(videoId) {
  const json = await youtubei("next", {
    context: { client: mweb() },
    videoId,
  });
  return { videoId, results: collectItems(json) };
}

async function download(videoId) {
  const payload = {
    context: {
      client: {
        clientName: "ANDROID_VR",
        clientVersion: "1.58.24",
        androidSdkVersion: 30,
        hl: "en",
        gl: config.gl,
      },
    },
    videoId,
    contentCheckOk: true,
    racyCheckOk: true,
  };
  const res = await fetch(`${API}/player?key=${ANDROID_VR_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": UA,
      Origin: BASE,
      "X-Goog-Visitor-Id": config.visitorData,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  if (!json.streamingData) {
    const ps = json.playabilityStatus || {};
    throw new Error(ps.reason || ps.status || "Streaming unavailable.");
  }

  const vd = json.videoDetails || {};
  const sd = json.streamingData;
  const label = (f) => {
    const codec = (f.mimeType || "").split(";")[0];
    const quality = f.width ? `${f.width}x${f.height}` : f.audioQuality || "";
    return `${codec}${quality ? " " + quality : ""}`;
  };
  const formats = [
    ...(sd.formats || []),
    ...(sd.adaptiveFormats || []),
  ]
    .filter((f) => f.url)
    .map((f) => ({
      itag: f.itag,
      container: (f.mimeType || "").split("/")[0],
      codecs: f.mimeType || null,
      label: label(f),
      bitrate: f.bitrate || null,
      width: f.width || null,
      height: f.height || null,
      audioQuality: f.audioQuality || null,
      url: f.url,
    }));

  return {
    id: vd.videoId,
    title: vd.title,
    author: vd.author,
    durationSeconds: Number(vd.lengthSeconds) || 0,
    expiresInSeconds: sd.expiresInSeconds,
    formats,
  };
}

const usage = {
  name: "m.youtube.com scraper",
  base: "https://m.youtube.com/",
  how: "node m.js <command> [args]",
  commands: {
    search: 'node m.js search "lofi hip hop" [page]  -> search videos',
    info: "node m.js info <id>                    -> details (video/playlist/channel/mix)",    related: "node m.js related <videoId>            -> related videos",
    download: "node m.js download <videoId>           -> available stream formats",
  },
};

(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd) return console.log(JSON.stringify(usage, null, 2));

  await bootstrap();

  let data;
  switch (cmd) {
    case "search":
      if (!args[0]) throw new Error("Usage: node m.js search <query> [page]");
      data = await search(args[0], Number(args[1]) || 1);
      break;
    case "info":
      if (!args[0]) throw new Error("Usage: node m.js info <id>  (video / playlist / channel / mix)");
      data = await info(args[0]);
      break;
    case "related":
      if (!args[0]) throw new Error("Usage: node m.js related <videoId>");
      data = await related(args[0]);
      break;
    case "download":
      if (!args[0]) throw new Error("Usage: node m.js download <videoId>");
      data = await download(args[0]);
      break;
    default:
      data = { error: `Unknown command: ${cmd}`, ...usage };
  }
  console.log(JSON.stringify(data, null, 2));
})().catch((err) => {
  console.log(JSON.stringify({ error: err.message }, null, 2));
  process.exit(1);
});
