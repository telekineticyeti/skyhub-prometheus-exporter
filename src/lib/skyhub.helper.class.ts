import fetch from 'node-fetch';
import config from '../config';
import jsdom from 'jsdom';

const {JSDOM} = jsdom;

export enum SkyHubPages {
  system = 'sky_system.html',
  status = 'sky_router_status.html',
}

class SkyHubHelperClass {
  /**
   * Retrieve the target page from the Sky Hub router
   * @param page enum SkyHubPages.<target>
   * @returns string wrapped in a Promise
   */
  public async fetchSkyRouterPage(page: SkyHubPages): Promise<string> {
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
  }

  /**
   * Splits and serializes attenuation (db) / margin (db) stat strings
   * @param prefix
   * @param attenuationString
   * @returns
   */
  public serializeAttenuation(prefix: string, attenuationString: string) {
    const result: {[name: string]: string} = {};
    const seperatedStreams = attenuationString.split(/\s+/).map(x => x.trim());

    seperatedStreams.forEach(x => {
      const stringArray = x.split(':');
      result[`${prefix}_${stringArray[0]}`] = stringArray[1];
    });

    return result;
  }

  public serializeDslStatusInfo(infoString: string) {
    const stringSegments = infoString.split('_');
    const [dns_server_1, dns_server_2] = stringSegments[10].split(', ');

    return {
      dsl_interface_type: stringSegments[9].substring(0, 3),
      dsl_connected: stringSegments[0],
      ipv4_address: stringSegments[5],
      ipv4_subnet_mask: stringSegments[7],
      ipv6_address: stringSegments[12],
      ipv6_gateway_address: stringSegments[13],
      ipv6_link_local_address: stringSegments[17],
      ipv6_delegated_prefix: stringSegments[16],
      dns_server_1,
      dns_server_2,
    };
  }

  public timeInSecs(timeStr: string): string {
    const [hours, mins, secs] = timeStr.split(':');
    const total = +hours * 60 * 60 + +mins * 60 + +secs;
    return total.toString();
  }

  /**
   * Create a dom object from provided dom string and iterate over provided
   * xpaths, returning a key value pair of each xpath's result.
   */
  public iterateXpath = (
    domString: string,
    xpaths: {[key: string]: string},
  ) => {
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
}

export default SkyHubHelperClass;

export interface XpathResults {
  [key: string]: string | undefined;
}
