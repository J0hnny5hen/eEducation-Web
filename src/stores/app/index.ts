import { EduRecordService } from './../../sdk/record/edu-record-service';
import { EduBoardService } from './../../sdk/board/edu-board-service';
import { DeviceStore } from './device';
import { UIStore } from './ui';
import { EduManager } from '@/sdk/education/manager';
import { EduUserService } from '@/sdk/education/user/edu-user-service';
import { BoardStore } from './board';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { RoomStore } from './room';
import { RecordingStore } from './recording';
import AgoraRTM from 'agora-rtm-sdk';
import { ReplayStore } from './replay';
import { BreakoutRoomStore } from './breakout-room';
import { MiddleRoomStore } from './middle-room';
import { ExtensionStore } from './extension'
import { get } from 'lodash';
import { GlobalStorage } from '@/utils/custom-storage';
import { autorun, toJS, observable, action, computed, runInAction } from 'mobx';
import { MediaStore } from './media';
import { EduClassroomManager } from '@/sdk/education/room/edu-classroom-manager';
import { t } from '@/i18n';
import { EduStream } from '@/sdk/education/interfaces/index';
import { LocalUserRenderer } from '@/sdk/education/core/media-service/renderer';
import { PrepareScreenShareParams } from '@/sdk/education/core/media-service/interfaces/index';
import { AgoraWebRtcWrapper } from '@/sdk/education/core/media-service/web';
import { AgoraElectronRTCWrapper } from '@/sdk/education/core/media-service/electron';
import { BizLogger } from '@/utils/biz-logger';
import { platform } from '@/utils/platform';
import { SceneStore } from './scene';

const APP_ID: string = process.env.REACT_APP_AGORA_APP_ID as string;
BizLogger.info("APP_ID ", APP_ID)
const CUSTOMER_ID: string = process.env.REACT_APP_AGORA_CUSTOMER_ID as string;
const CUSTOMER_CERTIFICATE: string = process.env.REACT_APP_AGORA_CUSTOMER_CERTIFICATE as string;
export class AppStore {

  uiStore!: UIStore;
  boardStore!: BoardStore;
  roomStore!: RoomStore;
  deviceStore!: DeviceStore;
  recordingStore!: RecordingStore;
  breakoutRoomStore!: BreakoutRoomStore;
  middleRoomStore!: MiddleRoomStore;
  extensionStore!: ExtensionStore;
  replayStore!: ReplayStore;
  mediaStore!: MediaStore;
  sceneStore!: SceneStore;

  eduManager!: EduManager;

  userService?: EduUserService;

  _boardService?: EduBoardService;
  _recordService?: EduRecordService;

  get boardService() {
    return this._boardService as EduBoardService;
  }

  get recordService() {
    return this._recordService as EduRecordService;
  }

  get mediaService() {
    return this.eduManager.mediaService
  }

  get isWeb(): boolean {
    return this.mediaService.sdkWrapper instanceof AgoraWebRtcWrapper
  }

  get isElectron(): boolean {
    return this.mediaService.sdkWrapper instanceof AgoraElectronRTCWrapper
  }

  @observable
  roomInfo: Record<string, string> = {}

  private load() {
    EduManager.enableDebugLog(true);
    const storage = GlobalStorage.read("room")
    if (storage) {
      this.roomInfo = storage.roomInfo
    }
  }

  constructor() {
    this.load()
    autorun(() => {
      const data = toJS(this)
      GlobalStorage.save("room", {
        roomInfo: data.roomInfo,
      })
    })
    if (platform === 'electron') {
      this.eduManager = new EduManager({
        appId: APP_ID,
        customerId: CUSTOMER_ID,
        platform: 'electron',
        customerCertificate: CUSTOMER_CERTIFICATE,
        logLevel: '' as any,
        logDirectoryPath: '',
        // @ts-ignore
        agoraRtc: window.rtcEngine,
        agoraRtm: AgoraRTM,
      })
    } else {
      this.eduManager = new EduManager({
        appId: APP_ID,
        customerId: CUSTOMER_ID,
        platform: 'web',
        customerCertificate: CUSTOMER_CERTIFICATE,
        logLevel: '' as any,
        logDirectoryPath: '',
        agoraRtc: AgoraRTC,
        agoraRtm: AgoraRTM,
        codec: 'vp8'
      })
    }

    this.mediaStore = new MediaStore(this)
    this.uiStore = new UIStore(this)
    this.boardStore = new BoardStore(this)
    this.recordingStore = new RecordingStore(this)
    this.roomStore = new RoomStore(this)
    this.sceneStore = new SceneStore(this)
    this.middleRoomStore = new MiddleRoomStore(this)
    this.deviceStore = new DeviceStore(this)
    this.replayStore = new ReplayStore(this)
    this.breakoutRoomStore = new BreakoutRoomStore(this)
    this.extensionStore = new ExtensionStore(this)
    this._screenVideoRenderer = undefined
  }

  get userRole (): string {
    return get(this, 'roomInfo.userRole')
  }

  get roomType (): number {
    return +get(this, 'roomInfo.roomType', -1)
  }

  @action
  resetRoomInfo() {
    this.roomInfo = {}
  }

  get userUuid(): string {
    return `${this.roomInfo.userName}${this.roomInfo.userRole}`
  }

  roomManager?: EduClassroomManager = undefined

  groupClassroomManager?: EduClassroomManager = undefined

  @observable
  delay: number = 0

  @observable
  time: number = 0

  @observable
  cpuRate: number = 0

  @action
  updateCpuRate(rate: number) {
    this.cpuRate = rate
  }

  updateTime(startTime: number) {
    if (startTime) {
      const preState = Math.abs(Date.now() - startTime)
      this.time = preState
    }
  }
  

  resetTime() {
    this.time = 0
  }

  @action
  setRoomInfo(payload: any) {
    this.roomInfo = ({
      roomName: payload.roomName,
      roomType: payload.roomType,
      userName: payload.userName,
      userRole: payload.role,
      userUuid: `${payload.userName}${payload.role}`
    })
  }

  @observable
  waitingShare: boolean = false

  @observable
  _screenVideoRenderer?: LocalUserRenderer = undefined;

  @observable
  _screenEduStream?: EduStream = undefined

  @observable
  sharing: boolean = false

  @observable
  customScreenShareWindowVisible: boolean = false
  
  @observable
  customScreenShareItems: any[] = []

  @action
  async stopWebSharing() {
    try {
      this.waitingShare = true
      if (this._screenVideoRenderer) {
        await this.mediaService.stopScreenShare()
        this.mediaService.screenRenderer && this.mediaService.screenRenderer.stop()
        this._screenVideoRenderer = undefined
      }
      if (this._screenEduStream) {
        await this.roomManager?.userService.stopShareScreen()
        this._screenEduStream = undefined
      }
      this.sharing = false
    } catch(err) {
      this.uiStore.addToast(t('toast.failed_to_end_screen_sharing') + `${err.msg}`)
    } finally {
      this.waitingShare = false
    }
  }

  @action
  async startWebSharing() {
    try {
      this.waitingShare = true
      await this.mediaService.prepareScreenShare({
        shareAudio: 'auto',
        encoderConfig: '720p'
      })
      await this.roomManager?.userService.startShareScreen()
      const streamUuid = this.roomManager!.userService.screenStream.stream.streamUuid
      const params: any = {
        channel: this.roomManager?.roomUuid,
        uid: +streamUuid,
        token: this.roomManager?.userService.screenStream.token,
      }
      BizLogger.info("screenStreamData params ", JSON.stringify(params))
      BizLogger.info("screenStreamData ", JSON.stringify(this.roomManager?.userService.screenStream))

      await this.mediaService.startScreenShare({
        params
      })
      this._screenEduStream = this.roomManager?.userService.screenStream.stream
      this._screenVideoRenderer = this.mediaService.screenRenderer
      this.sharing = true
    } catch (err) {
      if (this.mediaService.screenRenderer) {
        this.mediaService.screenRenderer.stop()
        this.mediaService.screenRenderer = undefined
        this._screenVideoRenderer = undefined
        this.uiStore.addToast(t('toast.failed_to_initiate_screen_sharing_to_remote') + `${err.msg}`)
      } else {
        this.uiStore.addToast(t('toast.failed_to_enable_screen_sharing') + `${err.msg}`)
      }
      BizLogger.info('SCREEN-SHARE ERROR ', err)
      BizLogger.error(err)
    } finally {
      this.waitingShare = false
    }
  }

  async startOrStopSharing() {
    if (this.isWeb) {
      if (this.sharing) {
        await this.stopWebSharing()
      } else {
        await this.startWebSharing()
      }
    }

    if (this.isElectron) {
      if (this.sharing) {
        await this.stopNativeSharing()
      } else {
        await this.showScreenShareWindowWithItems()
      }
    }
  }

  @action
  showScreenShareWindowWithItems () {
    if (this.isElectron) {
      this.mediaService.prepareScreenShare().then((items: any) => {
        runInAction(() => {
          this.customScreenShareWindowVisible = true
          this.customScreenShareItems = items
        })
      }).catch(err => {
        BizLogger.warn('show screen share window with items', err)
      })
    }
  }

  @action
  async resetWebPrepareScreen() {
    if (this.mediaService.screenRenderer) {
      this._screenVideoRenderer = undefined
    }
  }


  @action
  async prepareScreenShare(params: PrepareScreenShareParams = {}) {
    const res = await this.mediaService.prepareScreenShare(params)
    if (this.mediaService.screenRenderer) {
      this._screenVideoRenderer = this.mediaService.screenRenderer
    }
  }

  @computed
  get screenEduStream(): EduStream {
    return this._screenEduStream as EduStream
  }

  @action
  async stopNativeSharing() {
    if (this.screenEduStream) {
      await this.roomManager?.userService.stopShareScreen()
      this._screenEduStream = undefined
    }
    if (this._screenVideoRenderer) {
      await this.mediaService.stopScreenShare()
      this._screenVideoRenderer && this._screenVideoRenderer.stop()
      this._screenVideoRenderer = undefined
    }
    if (this.customScreenShareWindowVisible) {
      this.customScreenShareWindowVisible = false
    }
    this.customScreenShareItems = []
    this.sharing = false
  }

  @action
  async startNativeScreenShareBy(windowId: number) {
    try {
      this.waitingShare = true
      await this.roomManager?.userService.startShareScreen()
      const streamUuid = this.roomManager!.userService.screenStream.stream.streamUuid
      const params: any = {
        channel: this.roomManager?.roomUuid,
        uid: +streamUuid,
        token: this.roomManager?.userService.screenStream.token,
      }
      await this.mediaService.startScreenShare({
        windowId: windowId as number,
        params
      })
      if (!this.mediaService.screenRenderer) {
        this.uiStore.addToast(t('create_screen_share_failed'))
        return
      } else {
        this._screenVideoRenderer = this.mediaService.screenRenderer
      }
      this.removeScreenShareWindow()
      this.sharing = true
    } catch (err) {
      BizLogger.warn(err)
      // if (!this.mediaService.screenRenderer) {
      //   await this.mediaService.stopScreenShare()
      // }
      this.waitingShare = false
      this.uiStore.addToast(t('toast.failed_to_initiate_screen_sharing') + `${err.msg}`)
      // throw err
    }
  }

  @action
  removeScreenShareWindow () {
    if (this.isElectron) {
      this.customScreenShareWindowVisible = false
      this.customScreenShareItems = []
    }
  }

  @action
  reset() {
    this._boardService = undefined
    this._recordService = undefined
    // this.roomInfo = {}
    this.resetWebPrepareScreen()
    this.removeScreenShareWindow()
  }
}

export { UIStore } from './ui';
export { BoardStore } from './board';
export { RoomStore } from './room';
export { DeviceStore } from './device';
export { BreakoutRoomStore } from './breakout-room';
export { MiddleRoomStore } from './middle-room';
export { ExtensionStore } from './extension';
export { ReplayStore } from './replay';
export { RecordingStore } from './recording';