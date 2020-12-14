import { logApi } from "../services/log-upload";
import {db} from "./db";
import Dexie from "dexie";
// eslint-disable
import LogWorker from 'worker-loader!./log.worker';
import { EduLogLevel } from "./interfaces/index.d";

const flat = (arr: any[]) => {
  return arr.reduce((arr, elem) => arr.concat(elem), []);
};

export class EduLogger {
  static logLevel: EduLogLevel = EduLogLevel.Debug

  private static get currentTime(): string {
    const date = new Date();
    return `${date.toTimeString().split(" ")[0] + ":" + date.getMilliseconds()}`;
  }

  static setLogLevel(level: EduLogLevel) {
    this.logLevel = level
  }

  static warn(...args: any[]) {
    this.log(`WARN`, ...args)
  }

  static debug(...args: any[]) {
    this.log(`DEBUG`, ...args)
  }

  static info(...args: any[]) {
    this.log(`INFO`, ...args)
  }

  static error(...args: any[]) {
    this.log(`ERROR`, ...args)
  }

  private static log(type: string, ...args: any[]) {
    if (this.logLevel === EduLogLevel.None) {
      return
    }
    const prefix = `${this.currentTime} %cAgoraEdu-SDK [${type}]: `

    let loggerArgs: any[] = [] 

    const pattern: {[key: string]: any} = {
      'WARN': {
        call: () => {
          loggerArgs = [prefix, "color: #9C640C;"].concat(args) as any
          (console as any).log.apply(console, loggerArgs)
        }
      },
      'DEBUG': {
        call: () => {
          loggerArgs = [prefix, "color: #99CC66;"].concat(args) as any
          (console as any).log.apply(console, loggerArgs)
        }
      },
      'INFO': {
        call: () => {
          loggerArgs = [prefix, "color: #99CC99; font-weight: bold;"].concat(args) as any
          (console as any).log.apply(console, loggerArgs)
        }
      },
      'ERROR': {
        call: () => {
          loggerArgs = [prefix, "color: #B22222; font-weight: bold;"].concat(args) as any
          (console as any).log.apply(console, loggerArgs)
        }
      }
    }
  
    if (pattern.hasOwnProperty(type)) {
      (pattern[type] as any).call()
    } else {
      loggerArgs = [prefix, "color: #64B5F6;"].concat(args) as any
      (console as any).log.apply(console, loggerArgs)
    }
  }

  static originConsole = window.console;

  static thread: LogWorker | null = null;

  static init() {
    if (!this.thread) {
      this.thread = new LogWorker()
      this.debugLog();
    }
  }

  private static debugLog() {
    const thread = this.thread as any;
    function proxy(context: any, method: any) {
      return function() {
        let args = [...arguments];
        flat(args).join('');
        thread.postMessage({
          type: 'log',
          data: JSON.stringify([flat(args).join('')])
        });
        method.apply(context, args);
      };
    }

    Object.keys(console)
      .filter(e => ['info', 'error', 'warn', 'log', 'debug'].indexOf(e) >= 0)
      .forEach((method: any, _) => {
        //@ts-ignore
        console[method] = proxy(console, console[method]);
      });
    //@ts-ignore
    window.console = console;
  }

  static async uploadElectronLog(roomId: any) {
    let file = await window.doGzip();
    const res = await logApi.uploadZipLogFile(
      roomId,
      file
    )
    return res;
  }

  // 当前时间戳
  static get ts(): number {
    return +Date.now()
  }

  static async enableUpload(roomUuid: string, isElectron: boolean) {
    const ids = [];
    // Upload Electron log
    if (isElectron) {
      ids.push(await this.uploadElectronLog(roomUuid))
    }
    // Web upload log
    ids.push(await this.uploadLog(roomUuid))
    return ids.join("#")
  }

  static async uploadLog(roomId: string) {
    console.log('[LOG] [upload] roomId: ', roomId)
    let logs: any[] = []
    db.logs.each((e: any) => logs.push(e))
    const logsStr = logs
      .map((e: any) => JSON.parse(e.content))
      .map((e: any) => (Array.isArray(e) ? e[0] : e))
      .join('\n');

    const now = this.ts

    window.logsStr = logsStr

    const file = await new File([logsStr], `${now}`)

    window.file = file
    
    let res: any = await logApi.uploadLogFile(
      roomId,
      file,
    )
    await db.readAndDeleteBy(now)
    EduLogger.info(`完成日志上传，文件名: ${file.name}, 上传时间: ${now}, 日志上传，res: ${JSON.stringify(res)}`)
    return res;
  }
}

window.EduLogger = EduLogger