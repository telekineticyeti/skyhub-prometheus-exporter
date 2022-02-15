class PrometheusHelperClass {
  public metricReport: string = '';

  public logMetric(metric: IMetricModel): void {
    if (metric.help) {
      this.addLine(`# HELP ${metric.name} ${metric.help}`);
    }

    if (metric.type) {
      this.addLine(`# Type ${metric.name} ${metric.type}`);
    }

    const labels = metric.labels
      ? `{${metric.labels.map(l => this.labelStringFromObject(l))}}`
      : '';

    if (metric.value) {
      this.addLine(`${metric.name}${labels} ${metric.value}`);
    }
  }

  public value(val: string): string {
    return parseFloat(val).toExponential();
  }

  private addLine(str: string): void {
    this.metricReport += this.metricReport === '' ? `${str}` : `\n${str}`;
  }

  private labelStringFromObject(obj: {[name: string]: string}): string {
    const key = Object.keys(obj)[0];
    const val = obj[key];
    return `${key}="${val}"`;
  }
}

export default PrometheusHelperClass;

interface IMetricModel {
  name: string;
  help?: string;
  type?: 'gauge' | 'counter' | 'summary';
  labels?: {[name: string]: string}[];
  value?: string | number;
}
