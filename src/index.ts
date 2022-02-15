import * as http from 'http';
import config, {xpaths} from './config';
import promiseRetry from 'promise-retry';
import PrometheusHelperClass from './lib/prometheus.helper.class';
import SkyHubHelperClass, {
  SkyHubPages,
  XpathResults,
} from './lib/skyhub.helper.class';
const prom = new PrometheusHelperClass();
const sky = new SkyHubHelperClass();

/**
 * Perform the scrape of the Sky hub page for data.
 * A dom is created from the fetch result, and queried with xPaths.
 */
const scrape = (systemPageStr: string, statusPageStr: string) => {
  const resolvedXPaths = sky.iterateXpath(systemPageStr, xpaths.status);
  const dslInfoString = sky.iterateXpath(statusPageStr, xpaths.system);

  // DSL Information is scraped from router status page and injected into
  // htmpl with JS. A regex is utilized to extract the string so
  // that it may be serialized.
  const resolvedDslInfo = sky.serializeDslStatusInfo(
    dslInfoString.script?.match(xpaths.dslInfoRegex)![0]!,
  );

  // Remove junk from system uptime string and
  // convert from hh:mm:ss format to seconds only.
  if (resolvedXPaths.uptime) {
    resolvedXPaths.uptime = sky.timeInSecs(
      resolvedXPaths.uptime.split(`\n`)[1].trim(),
    );
  }

  // Convert uptime stats from hh:mm:ss format to seconds only.
  Object.keys(resolvedXPaths)
    .filter(k => k.startsWith('uptime_'))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [`${key}`]: sky.timeInSecs(resolvedXPaths[key]!),
      });
    }, resolvedXPaths);

  // Attenuation/noise table is injected into page with JS and not
  // coded with HTML. This regex gets the table string from the script.
  const attenuationTable = resolvedXPaths.attenuationTable?.match(
    xpaths.attenuationTableRegex,
  );

  // Create a dom element from the string so that we can extract the
  // stats with defined xpaths.
  const tableDomString = `<table>${attenuationTable![1]}</table>`;
  let resolvedAttenuationTableXpaths = sky.iterateXpath(
    tableDomString,
    xpaths.attenuationTable,
  );
  delete resolvedXPaths.attenuationTable; // No longer required

  // For attenuation/margin stats, we must split the strings for
  // each of the three downstream/upstreams.
  [
    'attenuationDown',
    'attenuationUp',
    'noiseMarginDown',
    'noiseMarginUp',
  ].forEach(target => {
    const serialized = sky.serializeAttenuation(
      target,
      resolvedAttenuationTableXpaths[`${target}`]!,
    );

    resolvedAttenuationTableXpaths = {
      ...resolvedAttenuationTableXpaths,
      ...serialized,
    };
    delete resolvedAttenuationTableXpaths[`${target}`];
  });

  // Stat scraping is completed, generate the prometheus metric report.
  generatePromOutput(
    {
      ...resolvedXPaths,
      ...resolvedAttenuationTableXpaths,
    },
    resolvedDslInfo,
  );
};

/**
 * Groups stats by provided predicate matches
 * @param stats Stats object as key value pairs
 */
const groupedStats = (
  stats: XpathResults,
  predicate: (str: string) => boolean,
) => {
  return Object.keys(stats)
    .filter(k => predicate(k))
    .reduce((obj, key) => {
      return Object.assign(obj, {[`${key}`]: stats[key]});
    }, {} as KeyValuePair);
};

/**
 * Renders the Prometheus metrics report as a string.
 * @param stats Stats object as key value pairs
 */
const generatePromOutput = (stats: XpathResults, dslInfo: KeyValuePair) => {
  [
    {
      name: 'skyhub_network_stats_tx_packets',
      help: 'Number of transferred network packets',
      values: groupedStats(stats, v => v.startsWith('txPackets')),
    },
    {
      help: 'Number of recieved network packets',
      name: 'skyhub_network_stats_rx_packets',
      values: groupedStats(stats, v => v.startsWith('rxPackets')),
    },
    {
      help: 'Number of network packet collisions',
      name: 'skyhub_network_stats_collision_packets',
      values: groupedStats(stats, v => v.startsWith('collisionPackets')),
    },
    {
      help: 'Network transfer speed in bytes per second',
      name: 'skyhub_network_stats_tx_speed',
      values: groupedStats(stats, v => v.startsWith('txSpeed')),
    },
    {
      help: 'Network recieve speed in bytes per second',
      name: 'skyhub_network_stats_rx_speed',
      values: groupedStats(stats, v => v.startsWith('rxSpeed')),
    },
    {
      help: 'Network interface uptime',
      name: 'skyhub_network_uptime',
      values: groupedStats(stats, v => v.startsWith('uptime_')),
    },
    {
      help: 'Upstream attenuation in decibels',
      name: 'skyhub_attenuation_up_db',
      values: groupedStats(stats, v => v.startsWith('attenuationUp')),
    },
    {
      help: 'Downstream attenuation in decibels',
      name: 'skyhub_attenuation_down_db',
      values: groupedStats(stats, v => v.startsWith('attenuationDown')),
    },
    {
      help: 'Upstream noise margin in decibels',
      name: 'skyhub_noise_margin_up_db',
      values: groupedStats(stats, v => v.startsWith('noiseMarginUp')),
    },
    {
      help: 'Downstream noise margin in decibels',
      name: 'skyhub_noise_margin_down_db',
      values: groupedStats(stats, v => v.startsWith('noiseMarginDown')),
    },
  ].forEach(stats => {
    const type = 'gauge';
    prom.logMetric({help: stats.help, type, name: stats.name});
    Object.entries(stats.values).forEach(([key, value]) => {
      prom.logMetric({
        name: stats.name,
        value: prom.value(value),
        labels: [{interface: key.split('_')[1]}],
      });
    });
  });

  stats.uptime &&
    (() =>
      prom.logMetric({
        help: 'Total system uptime in seconds',
        name: 'skyhub_system_uptime',
        type: 'gauge',
        value: prom.value(stats.uptime!),
      }))();

  stats.speedDown &&
    (() =>
      prom.logMetric({
        help: 'Downstream Line Rate (Kbps)',
        name: 'skyhub_system_downstream_linerate',
        type: 'gauge',
        value: prom.value(stats.speedDown!),
      }))();

  stats.speedUp &&
    (() =>
      prom.logMetric({
        help: 'Upstream Line Rate (Kbps)',
        name: 'skyhub_system_upstream_linerate',
        type: 'gauge',
        value: prom.value(stats.speedUp!),
      }))();

  // Storing string values to Prometheus is not ideal, but we can achieve the same thing
  // with labels.
  prom.logMetric({
    help: 'Sky Broadband Connection Information',
    name: 'skyhub_connection_info',
    type: 'gauge',
    labels: Object.entries(dslInfo).map(([key, value]) => ({
      [`${key}`]: value,
    })),
    value: dslInfo.dsl_connected,
  });

  return prom.metricReport;
};

const server = http.createServer();
server.listen(config.httpPort);

server.on('request', async (req, res) => {
  if (req.url !== '/metrics') {
    res.writeHead(500);
    res.end();
    return;
  }

  prom.metricReport = '';

  try {
    /**
     * Retrieve the target Sky Hub router page as a string, scrape that
     * string result for usable stats and finally generate a prometheus
     * metric report.
     *
     * promiseRetry is used here because for some unknown reason the Sky
     * Hub periodically refuses a first-try connect attempt.
     */

    const systemResult = await promiseRetry(
      retry => sky.fetchSkyRouterPage(SkyHubPages.system).catch(retry),
      {retries: config.skyhub_retryAttempts},
    );

    const statusResult = await promiseRetry(
      retry => sky.fetchSkyRouterPage(SkyHubPages.status).catch(retry),
      {retries: config.skyhub_retryAttempts},
    );

    scrape(systemResult, statusResult);

    res.writeHead(200);
    res.end(`${prom.metricReport}`);
  } catch (error) {
    res.writeHead(400);
  }
});

interface KeyValuePair {
  [key: string]: string;
}
