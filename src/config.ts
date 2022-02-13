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

const config = {
  skyhub_ip,
  skyhub_user,
  skyhub_password,
  skyhub_baseUrl,
  skyhub_authB64,
  skyhub_retryAttempts,
};

export enum SkyHubPages {
  system = 'sky_system.html',
  status = 'sky_router_status.html',
}

export default config;

const xpaths_status = '/html/body/div';
const xpaths_status_table1 = `${xpaths_status}/table`;
const xpaths_status_table2 = `${xpaths_status}/div[3]/table`;

export const xpaths = {
  status: {
    systemUptime: `${xpaths_status}/div[2]`,
    wanStatus: `${xpaths_status_table1}/tbody/tr[2]/td[2]`,
    wanTxPackets: `${xpaths_status_table1}/tbody/tr[2]/td[3]`,
    wanRxPackets: `${xpaths_status_table1}/tbody/tr[2]/td[4]`,
    wanCollisionPackets: `${xpaths_status_table1}/tbody/tr[2]/td[5]`,
    wanTxBytesSec: `${xpaths_status_table1}/tbody/tr[2]/td[6]`,
    wanRxBytesSec: `${xpaths_status_table1}/tbody/tr[2]/td[7]`,
    wanUptime: `${xpaths_status_table1}/tbody/tr[2]/td[8]`,
    lanStatus: `${xpaths_status_table1}/tbody/tr[3]/td[2]`,
    lanTxPackets: `${xpaths_status_table1}/tbody/tr[3]/td[3]`,
    lanRxPackets: `${xpaths_status_table1}/tbody/tr[3]/td[4]`,
    lanCollisionPackets: `${xpaths_status_table1}/tbody/tr[3]/td[5]`,
    lanTxBytesSec: `${xpaths_status_table1}/tbody/tr[3]/td[6]`,
    lanRxBytesSec: `${xpaths_status_table1}/tbody/tr[3]/td[7]`,
    lanUptime: `${xpaths_status_table1}/tbody/tr[3]/td[8]`,
    wlanStatus: `${xpaths_status_table1}/tbody/tr[4]/td[2]`,
    wlanTxPackets: `${xpaths_status_table1}/tbody/tr[4]/td[3]`,
    wlanRxPackets: `${xpaths_status_table1}/tbody/tr[4]/td[4]`,
    wlanCollisionPackets: `${xpaths_status_table1}/tbody/tr[4]/td[5]`,
    wlanTxBytesSec: `${xpaths_status_table1}/tbody/tr[4]/td[6]`,
    wlanRxBytesSec: `${xpaths_status_table1}/tbody/tr[4]/td[7]`,
    wlanUptime: `${xpaths_status_table1}/tbody/tr[4]/td[8]`,
    attenuationTable: `${xpaths_status_table2}/tbody/script`,
  },
  attenuationTableRegex: /<tr>(.+)<\/tr>/gm,
  attenuationTable: {
    speedDown: `/html/body/table/tbody/tr[1]/td[2]`,
    speedUp: `/html/body/table/tbody/tr[1]/td[3]`,
    attenuationDown: `/html/body/table/tbody/tr[2]/td[2]`,
    attenuationUp: `/html/body/table/tbody/tr[2]/td[3]`,
    noiseMarginDown: `/html/body/table/tbody/tr[3]/td[2]`,
    noiseMarginUp: `/html/body/table/tbody/tr[3]/td[3]`,
  },
};
