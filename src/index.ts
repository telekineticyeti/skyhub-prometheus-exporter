import fetch from 'node-fetch';
import config, {SkyHubPages, xpaths} from './config';
import promiseRetry from 'promise-retry';
import jsdom from 'jsdom';
const {JSDOM} = jsdom;

const fetchSkyRouterPage = async (page: SkyHubPages): Promise<string> => {
  console.log(`Fetching: ${config.skyhub_baseUrl}/${page}`);
  try {
    const res = await fetch(`${config.skyhub_baseUrl}/${page}`, {
      headers: {
        Authorization: `Basic ${config.skyhub_authB64}`,
      },
    });

    if (res.status !== 200) {
      throw new Error(`${res.status}`);
    }

    return await res.text();
  } catch (error: any) {
    throw new Error(error);
  }
};

promiseRetry(
  (retry, number) => {
    console.log('attempt number', number);
    return fetchSkyRouterPage(SkyHubPages.system).catch(retry);
  },
  {retries: config.skyhub_retryAttempts},
).then(
  res => {
    scrape(res);
  },
  err => {
    throw new Error(err);
  },
);

/**
 * Create a dom object from provided dom string and iterate over provided
 * xpaths, returning a key value pair of each xpath's result.
 */
const iterateXpath = (domString: string, xpaths: {[key: string]: string}) => {
  const dom = new JSDOM(domString);
  const doc = dom.window.document;

  const xpathResults: XpathResults = {};

  Object.entries(xpaths).map(([name, path]) => {
    const result = doc.evaluate(
      path,
      doc,
      null,
      dom.window.XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null,
    );
    const xpathValue = result.iterateNext()?.textContent?.trim() || undefined;

    xpathResults[name] = xpathValue;
  });

  return xpathResults;
};

const serializeAttenuation = (
  prefix: string,
  attenuationString: string,
): {[name: string]: string} => {
  const result: {[name: string]: string} = {};

  const seperatedStreams = attenuationString.split(/\s+/).map(x => x.trim());

  seperatedStreams.forEach(x => {
    const stringArray = x.split(':');
    result[`${prefix}_${stringArray[0]}`] = stringArray[1];
  });

  return result;
};

const scrape = (body: string) => {
  const resolvedXPaths = iterateXpath(body, xpaths.status);

  if (resolvedXPaths.systemUptime) {
    resolvedXPaths.systemUptime = resolvedXPaths.systemUptime
      .split(`\n`)[1]
      .trim();
  }

  if (!resolvedXPaths.attenuationTable) {
    return;
  }

  const attenuationTable = resolvedXPaths.attenuationTable?.match(
    xpaths.attenuationTableRegex,
  );
  const tableDomString = `<table>${attenuationTable![1]}</table>`;
  let resolvedAttenuationTableXpaths = iterateXpath(
    tableDomString,
    xpaths.attenuationTable,
  );
  delete resolvedXPaths.attenuationTable;

  const serializeTargets = [
    'attenuationDown',
    'attenuationUp',
    'noiseMarginDown',
    'noiseMarginUp',
  ];

  serializeTargets.forEach(target => {
    const serialized = serializeAttenuation(
      target,
      resolvedAttenuationTableXpaths[`${target}`]!,
    );

    resolvedAttenuationTableXpaths = {
      ...resolvedAttenuationTableXpaths,
      ...serialized,
    };
    delete resolvedAttenuationTableXpaths[`${target}`];
  });

  console.log({
    ...resolvedXPaths,
    ...resolvedAttenuationTableXpaths,
  });
};

interface XpathResults {
  [key: string]: string | undefined;
}
