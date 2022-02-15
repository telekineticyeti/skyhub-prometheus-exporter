const skyhub_ip = process.env.skyhub_ip ? process.env.skyhub_ip : '192.168.0.1';
const skyhub_user = process.env.user ? process.env.user : 'admin';
const skyhub_password = process.env.skyhub_password
  ? process.env.skyhub_password
  : '';
const skyhub_baseUrl = `http://${skyhub_ip}`;
const skyhub_authB64 = Buffer.from(
  `${skyhub_user}:${skyhub_password}`,
).toString('base64');
const skyhub_retryAttempts = 3;

const httpPort =
  process.env.port && !isNaN(parseInt(process.env.port))
    ? parseInt(process.env.port)
    : 8080;

const config = {
  httpPort,
  skyhub_ip,
  skyhub_user,
  skyhub_password,
  skyhub_baseUrl,
  skyhub_authB64,
  skyhub_retryAttempts,
};

export default config;

const xpaths_status = '/html/body/div';
const xpaths_status_table1 = `${xpaths_status}/table`;
const xpaths_status_table2 = `${xpaths_status}/div[3]/table`;

export const xpaths = {
  status: {
    uptime: `${xpaths_status}/div[2]`,
    // wan
    status_wan: `${xpaths_status_table1}/tbody/tr[2]/td[2]`,
    txPackets_wan: `${xpaths_status_table1}/tbody/tr[2]/td[3]`,
    rxPackets_wan: `${xpaths_status_table1}/tbody/tr[2]/td[4]`,
    collisionPackets_wan: `${xpaths_status_table1}/tbody/tr[2]/td[5]`,
    txSpeed_wan: `${xpaths_status_table1}/tbody/tr[2]/td[6]`,
    rxSpeed_wan: `${xpaths_status_table1}/tbody/tr[2]/td[7]`,
    uptime_wan: `${xpaths_status_table1}/tbody/tr[2]/td[8]`,
    // lan
    status_lan: `${xpaths_status_table1}/tbody/tr[3]/td[2]`,
    txPackets_lan: `${xpaths_status_table1}/tbody/tr[3]/td[3]`,
    rxPackets_lan: `${xpaths_status_table1}/tbody/tr[3]/td[4]`,
    collisionPackets_lan: `${xpaths_status_table1}/tbody/tr[3]/td[5]`,
    txSpeed_lan: `${xpaths_status_table1}/tbody/tr[3]/td[6]`,
    rxSpeed_lan: `${xpaths_status_table1}/tbody/tr[3]/td[7]`,
    uptime_lan: `${xpaths_status_table1}/tbody/tr[3]/td[8]`,
    // wlan
    status_wlan: `${xpaths_status_table1}/tbody/tr[4]/td[2]`,
    txPackets_wlan: `${xpaths_status_table1}/tbody/tr[4]/td[3]`,
    rxPackets_wlan: `${xpaths_status_table1}/tbody/tr[4]/td[4]`,
    collisionPackets_wlan: `${xpaths_status_table1}/tbody/tr[4]/td[5]`,
    txSpeed_wlan: `${xpaths_status_table1}/tbody/tr[4]/td[6]`,
    rxSpeed_wlan: `${xpaths_status_table1}/tbody/tr[4]/td[7]`,
    uptime_wlan: `${xpaths_status_table1}/tbody/tr[4]/td[8]`,
    // attenuation / noise margin
    attenuationTable: `${xpaths_status_table2}/tbody/script`,
  },
  system: {
    script: `/html/head/script[9]`,
  },
  attenuationTableRegex: /<tr>(.+)<\/tr>/gm,
  dslInfoRegex: /[\d\w_.:&;/,\s]{200,}/m,
  attenuationTable: {
    speedDown: `/html/body/table/tbody/tr[1]/td[2]`,
    speedUp: `/html/body/table/tbody/tr[1]/td[3]`,
    attenuationDown: `/html/body/table/tbody/tr[2]/td[2]`,
    attenuationUp: `/html/body/table/tbody/tr[2]/td[3]`,
    noiseMarginDown: `/html/body/table/tbody/tr[3]/td[2]`,
    noiseMarginUp: `/html/body/table/tbody/tr[3]/td[3]`,
  },
};
