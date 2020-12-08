import { AgoraRecordApi } from './../education/core/services/record-api';

export class EduRecordService {

  apiService: AgoraRecordApi;

  constructor(userToken: string) {
    this.apiService = new AgoraRecordApi(userToken)
  }

  async getCourseRecordBy(roomUuid: string) {
    return await this.apiService.queryRoomRecordBy(roomUuid)
  }
  
  async startRecording(roomUuid: string) {
    return await this.apiService.startRecording(roomUuid)
  }

  async stopRecording(roomUuid: string, recordId: string) {
    return await this.apiService.stopRecording(roomUuid, recordId)
  }
}