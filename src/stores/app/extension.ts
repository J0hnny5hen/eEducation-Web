import { InvitationEnum } from './../../services/middle-room-api';
import { EduAudioSourceType, EduUser, EduVideoSourceType } from '@/sdk/education/interfaces/index.d';
import { AppStore } from '@/stores/app/index';
import { observable, computed, action } from 'mobx';
import { get } from 'lodash';
import { t } from '@/i18n';
import { MiddleRoomPropertiesChangeCause } from './middle-room';

export type SetInterval = ReturnType<typeof setInterval>

type ApplyUser = {
  userName: string
  userUuid: string
  streamUuid: string
  userState: boolean
}

// 控制管理扩展工具的状态显示
export class ExtensionStore {
  appStore!: AppStore

  @observable
  applyUsers: ApplyUser[] = []

  constructor(appStore: AppStore) {
    this.appStore = appStore
  }

  get sceneStore() {
    return this.appStore.sceneStore
  }

  @observable
  controlGrouping: boolean = false

  @action 
  showGrouping() {
    this.controlGrouping = true
  }

  @observable
  controlSpread: boolean = false

  @action 
  showspread() {
    this.controlSpread = true
  }
  
  @action 
  hiddenGrouping() {
    this.controlGrouping = false
  }

  @observable
  controlCreate: boolean = false

  @action 
  showCreate() {
    this.controlCreate = true
  }

  @action
  hiddenCreate() {
    this.controlCreate = false
  }

  @observable
  handVisible: boolean = false

  @action
  showHand() {
    this.handVisible = true
  }
  
  @action
  hiddenHand() {
    this.handVisible = false
  }

  @computed
  get enableAutoHandUpCoVideo(): boolean {
    return !!get(this.appStore.middleRoomStore,'roomProperties.handUpStates.apply', 0)
  }

  @computed
  get enableCoVideo(): boolean {
    return !!get(this.appStore.middleRoomStore,'roomProperties.handUpStates.state', 0)
  }

  @action
  async updateHandUpState(enableCoVideo: boolean, enableAutoHandUpCoVideo: boolean) {
    await this.appStore.middleRoomStore.roomManager?.userService?.updateRoomBatchProperties(
      {
        properties: {
          "handUpStates": {
            "state": +enableCoVideo,
            "autoCoVideo": +enableAutoHandUpCoVideo
          }
        },
        cause: {
          cmd: `${MiddleRoomPropertiesChangeCause.handUpStateChanged}`
        }
      }
    )
  }

  @observable
  visibleCard: boolean = false

  @action
  toggleCard() {
    this.visibleCard = !this.visibleCard
  }

  hideCard() {
    this.visibleCard = false
  }

  async acceptApply(userUuid: string, streamUuid: string) {
    await this.answerAcceptInvitationApply(userUuid, streamUuid);
  }

  @computed
  get userRole(): string {
    return this.appStore.sceneStore.localUser.userRole
  }

  @computed
  get showStudentHandsTool(): boolean {
    if (this.userRole === 'student' && this.enableCoVideo) {
      return true
    }
    return false
  }

  @computed
  get showTeacherHandsTool(): boolean {
    if (this.userRole === 'teacher' && this.enableCoVideo) {
      return true
    }
    return false
  }

  @observable
  tick: number = 3000

  interval?: SetInterval

  @observable
  inTick: boolean = false

  @computed
  get roomManager() {
    return this.appStore.middleRoomStore.roomManager
  }

  @computed
  get middleRoomApi() {
    return this.appStore.middleRoomStore.middleRoomApi
  }

  @computed
  get teacherUuid() {
    return this.appStore.sceneStore.teacherUuid
  }

  @action
  async startInvitationApply () {
    try {
      const teacherUuid = this.teacherUuid
      await this.middleRoomApi.setInvitation()
      await this.middleRoomApi.handInvitationStart(
        InvitationEnum.Apply,
        teacherUuid,
      )
      const localStream = this.roomManager.userService.localStream
      if (localStream.state === 0 && this.enableAutoHandUpCoVideo) {
        const localStreamData = this.roomManager.data.localStreamData
        await this.roomManager.userService.publishStream({
          videoSourceType: EduVideoSourceType.camera,
          audioSourceType: EduAudioSourceType.mic,
          streamName: '',
          streamUuid: localStream.stream.streamUuid,
          hasVideo: true,
          hasAudio: true,
          userInfo: {} as EduUser
        })
      }
    } catch (err) {
      console.warn(err)
      this.appStore.uiStore.addToast(t(`invitation.apply_failed`))
    }
  }

  @action
  async answerAcceptInvitationApply (userUuid: string, streamUuid: string) {
    try {
      await this.middleRoomApi.handInvitationEnd(
        InvitationEnum.Accept,
        userUuid,
      )
      if (this.enableCoVideo) {
        await this.roomManager?.userService.inviteStreamBy({
          roomUuid: this.sceneStore.roomUuid,
          streamUuid: streamUuid,
          userUuid: userUuid
        })
      }
    } catch (err) {
      console.warn(err)
      this.appStore.uiStore.addToast(t(`invitation.apply_failed`))
    }
  }
  
  @action
  startTick() {
    if (this.interval !== undefined) {
      this.stopTick()
    }
    this.tick = 3000
    this.inTick = true
    this.interval = setInterval(async () => {
      if (this.tick === 1000) {
        if (this.interval) {
          clearInterval(this.interval)
          this.interval = undefined
        }
        this.inTick = false
        await this.startInvitationApply()
        return
      }
      this.tick -= 1000
    }, 1000)
  }

  @action
  stopTick() {
    this.interval && clearInterval(this.interval)
    this.interval = undefined
    this.inTick = false
  }

  @action
  async raiseHands() {

  }

  @action
  async acceptRaiseHands(userUuid: string) {
    // await this.appStore.middleRoomStore.middleRoomApi.handInvitationStart()
  }

  @observable
  visibleUserList: boolean = false

  @action
  toggleApplyUserList() {
    this.visibleUserList = !this.visibleUserList
  }

  @action
  hideApplyUserList() {
    this.visibleUserList = false
  }
}