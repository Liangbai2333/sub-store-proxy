/*!
 * powerfullz Substore 订阅转换脚本 (中括号命名适配版)
 * 适配格式：[供应商]节点名称
 */

const NODE_SUFFIX = "节点";
function parseBool(e) {
  return "boolean" == typeof e
    ? e
    : "string" == typeof e && ("true" === e.toLowerCase() || "1" === e);
}
function parseNumber(e, t = 0) {
  if (null == e) return t;
  const o = parseInt(e, 10);
  return isNaN(o) ? t : o;
}
function buildFeatureFlags(e) {
  const t = Object.entries({
    loadbalance: "loadBalance",
    landing: "landing",
    ipv6: "ipv6Enabled",
    full: "fullConfig",
    keepalive: "keepAliveEnabled",
    fakeip: "fakeIPEnabled",
    quic: "quicEnabled",
  }).reduce((t, [o, r]) => ((t[r] = parseBool(e[o]) || !1), t), {});
  return ((t.countryThreshold = parseNumber(e.threshold, 0)), t);
}
const rawArgs = "undefined" != typeof $arguments ? $arguments : {},
  {
    loadBalance: loadBalance,
    landing: landing,
    ipv6Enabled: ipv6Enabled,
    fullConfig: fullConfig,
    keepAliveEnabled: keepAliveEnabled,
    fakeIPEnabled: fakeIPEnabled,
    quicEnabled: quicEnabled,
    countryThreshold: countryThreshold,
  } = buildFeatureFlags(rawArgs);

// --- [修改点 1: 解析逻辑改为匹配中括号] ---
function parseProviders(proxies) {
  const providers = new Set();
  proxies.forEach((p) => {
    const name = p.name || "";
    // 匹配第一个 [ ] 里的内容
    const match = name.match(/\[(.*?)\]/);
    if (match && match[1]) {
      providers.add(match[1].trim());
    }
  });
  return Array.from(providers);
}

const HOME_REGEX = "(家宽|家庭|家庭宽带|Home|Broadband)";

const PROXY_GROUPS = {
  SELECT: "选择代理",
  AUTO_SELECT: "自动选择",
  MANUAL: "手动选择",
  FALLBACK: "故障转移",
  DIRECT: "直连",
  LANDING: "落地节点",
  LOW_COST: "低倍率节点",
  ALL_HOME: "所有家宽",
  ALL_NORMAL: "所有普通节点",
};

// 基础列表构建逻辑
function buildBaseLists({ dynamicGroups: o, lowCost: t }) {
  const coreProxies = [
    PROXY_GROUPS.AUTO_SELECT,
    PROXY_GROUPS.ALL_NORMAL,
    PROXY_GROUPS.ALL_HOME,
    ...o,
    t ? PROXY_GROUPS.LOW_COST : null,
    PROXY_GROUPS.MANUAL,
    "DIRECT",
  ].filter(Boolean);

  return {
    defaultProxies: [PROXY_GROUPS.SELECT, ...coreProxies],
    defaultProxiesDirect: ["DIRECT", ...coreProxies],
    defaultSelector: [PROXY_GROUPS.FALLBACK, ...coreProxies],
    defaultFallback: coreProxies,
  };
}

// 原始 Rule Providers
const ruleProviders = {
  ADBlock: {
    type: "http",
    behavior: "domain",
    format: "mrs",
    interval: 86400,
    url: "https://adrules.top/adrules-mihomo.mrs",
    path: "./ruleset/ADBlock.mrs",
  },
  SogouInput: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://ruleset.skk.moe/Clash/non_ip/sogouinput.txt",
    path: "./ruleset/SogouInput.txt",
  },
  StaticResources: {
    type: "http",
    behavior: "domain",
    format: "text",
    interval: 86400,
    url: "https://ruleset.skk.moe/Clash/domainset/cdn.txt",
    path: "./ruleset/StaticResources.txt",
  },
  CDNResources: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://ruleset.skk.moe/Clash/non_ip/cdn.txt",
    path: "./ruleset/CDNResources.txt",
  },
  TikTok: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/TikTok.list",
    path: "./ruleset/TikTok.list",
  },
  EHentai: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/EHentai.list",
    path: "./ruleset/EHentai.list",
  },
  SteamFix: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/SteamFix.list",
    path: "./ruleset/SteamFix.list",
  },
  GoogleFCM: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/FirebaseCloudMessaging.list",
    path: "./ruleset/FirebaseCloudMessaging.list",
  },
  AdditionalFilter: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/AdditionalFilter.list",
    path: "./ruleset/AdditionalFilter.list",
  },
  AdditionalCDNResources: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/AdditionalCDNResources.list",
    path: "./ruleset/AdditionalCDNResources.list",
  },
  Crypto: {
    type: "http",
    behavior: "classical",
    format: "text",
    interval: 86400,
    url: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/ruleset/Crypto.list",
    path: "./ruleset/Crypto.list",
  },
};

// 原始分流规则
const baseRules = [
  "RULE-SET,ADBlock,广告拦截",
  "RULE-SET,AdditionalFilter,广告拦截",
  "RULE-SET,SogouInput,搜狗输入法",
  "DOMAIN-SUFFIX,truthsocial.com,Truth Social",
  "RULE-SET,StaticResources,静态资源",
  "RULE-SET,CDNResources,静态资源",
  "RULE-SET,AdditionalCDNResources,静态资源",
  "RULE-SET,Crypto,Crypto",
  "RULE-SET,EHentai,E-Hentai",
  "RULE-SET,TikTok,TikTok",
  `RULE-SET,SteamFix,${PROXY_GROUPS.DIRECT}`,
  `RULE-SET,GoogleFCM,${PROXY_GROUPS.DIRECT}`,
  `DOMAIN,services.googleapis.cn,${PROXY_GROUPS.SELECT}`,
  "GEOSITE,CATEGORY-AI-!CN,AI",
  `GEOSITE,GOOGLE-PLAY@CN,${PROXY_GROUPS.DIRECT}`,
  `GEOSITE,MICROSOFT@CN,${PROXY_GROUPS.DIRECT}`,
  "GEOSITE,ONEDRIVE,OneDrive",
  "GEOSITE,MICROSOFT,Microsoft",
  "GEOSITE,TELEGRAM,Telegram",
  "GEOSITE,YOUTUBE,YouTube",
  "GEOSITE,GOOGLE,Google",
  "GEOSITE,NETFLIX,Netflix",
  "GEOSITE,SPOTIFY,Spotify",
  "GEOSITE,BAHAMUT,Bahamut",
  "GEOSITE,BILIBILI,Bilibili",
  "GEOSITE,PIKPAK,PikPak",
  `GEOSITE,GFW,${PROXY_GROUPS.SELECT}`,
  `GEOSITE,CN,${PROXY_GROUPS.DIRECT}`,
  `GEOSITE,PRIVATE,${PROXY_GROUPS.DIRECT}`,
  "GEOIP,NETFLIX,Netflix,no-resolve",
  "GEOIP,TELEGRAM,Telegram,no-resolve",
  `GEOIP,CN,${PROXY_GROUPS.DIRECT}`,
  `GEOIP,PRIVATE,${PROXY_GROUPS.DIRECT}`,
  "DST-PORT,22,SSH(22端口)",
  `MATCH,${PROXY_GROUPS.SELECT}`,
];

function buildRules({ quicEnabled: e }) {
  const t = [...baseRules];
  return (e || t.unshift("AND,((DST-PORT,443),(NETWORK,UDP)),REJECT"), t);
}

const snifferConfig = {
  sniff: {
    TLS: { ports: [443, 8443] },
    HTTP: { ports: [80, 8080, 8880] },
    QUIC: { ports: [443, 8443] },
  },
  "override-destination": !1,
  enable: !0,
  "force-dns-mapping": !0,
  "skip-domain": ["Mijia Cloud", "dlg.io.mi.com", "+.push.apple.com"],
};

function buildDnsConfig({ mode: e, fakeIpFilter: t }) {
  const o = {
    enable: !0,
    ipv6: ipv6Enabled,
    "prefer-h3": !0,
    "enhanced-mode": e,
    "default-nameserver": ["119.29.29.29", "223.5.5.5"],
    nameserver: ["system", "223.5.5.5", "119.29.29.29", "180.184.1.1"],
    fallback: [
      "quic://dns0.eu",
      "https://dns.cloudflare.com/dns-query",
      "https://dns.sb/dns-query",
      "tcp://208.67.222.222",
      "tcp://8.26.56.2",
    ],
    "proxy-server-nameserver": [
      "https://dns.alidns.com/dns-query",
      "tls://dot.pub",
    ],
  };
  if (t) o["fake-ip-filter"] = t;
  return o;
}

const dnsConfig = buildDnsConfig({ mode: "redir-host" }),
  dnsConfigFakeIp = buildDnsConfig({
    mode: "fake-ip",
    fakeIpFilter: [
      "geosite:private",
      "geosite:connectivity-check",
      "geosite:cn",
      "Mijia Cloud",
      "dig.io.mi.com",
      "localhost.ptlogin2.qq.com",
      "*.icloud.com",
      "*.stun.*.*",
      "*.stun.*.*.*",
    ],
  }),
  geoxURL = {
    geoip:
      "https://gcore.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geoip.dat",
    geosite:
      "https://gcore.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat",
    mmdb: "https://gcore.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb",
    asn: "https://gcore.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb",
  };

// --- [修改点 2: 过滤规则适配中括号匹配] ---
function buildProxyGroups({
  dynamicGroups: o,
  lowCost: r,
  defaultProxies: n,
  defaultProxiesDirect: s,
  defaultSelector: l,
  defaultFallback: i,
}) {
  const type = loadBalance ? "load-balance" : "url-test";
  const commonSet = {
    type: type,
    "include-all": true,
    url: "https://cp.cloudflare.com/generate_204",
    interval: 60,
    tolerance: 20,
  };

  return [
    {
      name: PROXY_GROUPS.SELECT,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png",
      type: "select",
      proxies: l,
    },
    {
      name: PROXY_GROUPS.AUTO_SELECT,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png",
      ...commonSet,
    },
    {
      name: PROXY_GROUPS.ALL_HOME,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Airport.png",
      ...commonSet,
      filter: `(?i)${HOME_REGEX}`,
    },
    {
      name: PROXY_GROUPS.ALL_NORMAL,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png",
      ...commonSet,
      filter: `^(?i)(?!.*${HOME_REGEX})`,
    },
    {
      name: PROXY_GROUPS.MANUAL,
      icon: "https://gcore.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/select.png",
      type: "select",
      "include-all": true,
    },
    {
      name: PROXY_GROUPS.FALLBACK,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bypass.png",
      type: "fallback",
      url: "https://cp.cloudflare.com/generate_204",
      proxies: i,
      interval: 180,
    },
    {
      name: "静态资源",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Cloudflare.png",
      type: "select",
      proxies: n,
    },
    {
      name: "AI",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/chatgpt.png",
      type: "select",
      proxies: n,
    },
    {
      name: "Crypto",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Cryptocurrency_3.png",
      type: "select",
      proxies: n,
    },
    {
      name: "Google",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Google.png",
      type: "select",
      proxies: n,
    },
    {
      name: "Microsoft",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Microsoft_Copilot.png",
      type: "select",
      proxies: n,
    },
    {
      name: "YouTube",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/YouTube.png",
      type: "select",
      proxies: n,
    },
    {
      name: "Bilibili",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/bilibili.png",
      type: "select",
      proxies: s,
    },
    {
      name: "Bahamut",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bahamut.png",
      type: "select",
      proxies: n,
    },
    {
      name: "Netflix",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png",
      type: "select",
      proxies: n,
    },
    {
      name: "TikTok",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png",
      type: "select",
      proxies: n,
    },
    {
      name: "Spotify",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png",
      type: "select",
      proxies: n,
    },
    {
      name: "E-Hentai",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Ehentai.png",
      type: "select",
      proxies: n,
    },
    {
      name: "Telegram",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png",
      type: "select",
      proxies: n,
    },
    {
      name: "Truth Social",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/TruthSocial.png",
      type: "select",
      proxies: n,
    },
    {
      name: "OneDrive",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Onedrive.png",
      type: "select",
      proxies: n,
    },
    {
      name: "PikPak",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/PikPak.png",
      type: "select",
      proxies: n,
    },
    {
      name: "SSH(22端口)",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Server.png",
      type: "select",
      proxies: n,
    },
    {
      name: "搜狗输入法",
      icon: "https://gcore.jsdelivr.net/gh/powerfullz/override-rules@master/icons/Sougou.png",
      type: "select",
      proxies: [PROXY_GROUPS.DIRECT, "REJECT"],
    },
    {
      name: PROXY_GROUPS.DIRECT,
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png",
      type: "select",
      proxies: ["DIRECT", PROXY_GROUPS.SELECT],
    },
    {
      name: "广告拦截",
      icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/AdBlack.png",
      type: "select",
      proxies: ["REJECT", "REJECT-DROP", PROXY_GROUPS.DIRECT],
    },
    r
      ? {
          name: PROXY_GROUPS.LOW_COST,
          icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Lab.png",
          ...commonSet,
          filter: "(?i)0.[0-5]|低倍率|省流|大流量|实验性",
        }
      : null,
    ...o.flatMap((p) => [
      // 1. [供应商] 节点：包含该供应商下所有节点 (不带过滤)
      {
        name: `${p} 节点`,
        icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png",
        ...commonSet,
        filter: `^(?i)\\[${p}\\]`,
      },
      // 2. [供应商] 非家宽：该供应商下排除家宽后的节点
      {
        name: `${p} 非家宽`,
        icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png",
        ...commonSet,
        filter: `^(?i)\\[${p}\\](?!.*${HOME_REGEX})`,
      },
      // 3. [供应商] 家宽：该供应商下仅限家宽的节点
      {
        name: `${p} 家宽`,
        icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Airport.png",
        ...commonSet,
        filter: `^(?i)\\[${p}\\].*${HOME_REGEX}`,
      },
    ]),
  ].filter(Boolean);
}

function main(e) {
  const t = { proxies: e.proxies };
  const hasLow = /0\.[0-5]|低倍率|省流|大流量|实验性/i.test(
    JSON.stringify(e.proxies),
  );
  const providers = parseProviders(t.proxies);

  const groupNames = providers.flatMap((p) => [
    `${p} 节点`,
    `${p} 非家宽`,
    `${p} 家宽`,
  ]);

  const {
    defaultProxies: l,
    defaultProxiesDirect: i,
    defaultSelector: a,
    defaultFallback: c,
  } = buildBaseLists({ dynamicGroups: groupNames, lowCost: hasLow });

  const u = buildProxyGroups({
    dynamicGroups: providers,
    lowCost: hasLow,
    defaultProxies: l,
    defaultProxiesDirect: i,
    defaultSelector: a,
    defaultFallback: c,
  });

  u.push({
    name: "GLOBAL",
    icon: "https://gcore.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
    type: "select",
    "include-all": true,
    proxies: u.map((g) => g.name),
  });

  if (fullConfig) {
    Object.assign(t, {
      "mixed-port": 7890,
      "redir-port": 7892,
      "tproxy-port": 7893,
      "allow-lan": true,
      ipv6: ipv6Enabled,
      mode: "rule",
      "log-level": "info",
      "geodata-loader": "standard",
      profile: { "store-selected": true },
    });
  }

  return Object.assign(t, {
    "proxy-groups": u,
    "rule-providers": ruleProviders,
    rules: buildRules({ quicEnabled: quicEnabled }),
    sniffer: snifferConfig,
    dns: fakeIPEnabled ? dnsConfigFakeIp : dnsConfig,
    "geodata-mode": true,
    "geox-url": geoxURL,
  });
}
