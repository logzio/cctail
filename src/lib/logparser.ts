import moment from 'moment';
import { LogLine } from './types';

const logparser = {
  process: async function (files: Promise<string>[]): Promise<LogLine[]> {
    return Promise.all(files).then((values) => {
      return values.map((data) => this.parseLog(data)).reduce((a, b) => a.concat(b));
    });
  },

  parseLog: function (data: string): LogLine[] {
    let linesobj: LogLine[] = [];
    let regexp = new RegExp((/\[([.0-9 .:-]* GMT)\] (DEBUG|INFO|WARN|ERROR|FATAL)? ?(.*)/g));
    regexp.lastIndex = 0;
    let lastmatchend = 0;
    let mmatch;
    // eslint-disable-next-line no-cond-assign
    while (mmatch = regexp.exec(data)) {
      let start = mmatch.index;
      let end = start + mmatch[0].length;
      if (start > 0 && linesobj.length === 0) {
        linesobj.push({
          message: data.substring(0, start - 1),
          timestamp: undefined,
          level: undefined
        });
      }
      else if (start > (lastmatchend + 1)) {
        // append extra lines to the previous log
        linesobj[linesobj.length - 1].message += `${data.substring(lastmatchend, start - 1)}`;
      }
      // 2019-07-15 11:00:07.235 GMT
      let timestamp = moment(mmatch[1], "YYYY-MM-DD HH:mm:ss.SSS zz");
      let level = mmatch[2] || 'INFO';
      let message = mmatch[3];
      lastmatchend = end;
      linesobj.push(
        {
          timestamp,
          level,
          message
        }
      );
    }
    if (linesobj.length > 0 && lastmatchend < data.length) {
      linesobj[linesobj.length - 1].message += `${data.substring(lastmatchend, data.length)}`;
    }
    if (lastmatchend === 0 && data && data.length > 0) { // no match
      linesobj.push({
        message: data,
        timestamp: undefined,
        level: undefined
      });
    }
    return linesobj;
  }
}

export default logparser;