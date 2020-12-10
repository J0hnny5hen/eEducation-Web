import { MiddleClass } from './../pages/middle-class/middle-class';
import { AgoraFetchParams } from "@/sdk/education/interfaces/index.d";
import { EduRoomType } from "@/sdk/education/core/services/interface.d";
import { APP_ID, AUTHORIZATION } from "@/utils/config";
import { HttpClient } from "@/sdk/education/core/utils/http-client";
import { BizLogger } from "@/utils/biz-logger";

export interface QueryRoomResponseData {
  roomName: string
  roomUuid: string
  roleConfig: any
}

export interface EduClassroomConfig {
  roomName: string
  roomUuid: string
  roleConfig: {
    host?: {
      limit: number
    }
    audience?: {
      limit: number
    }
    broadcaster?: {
      limit: number
    }
    assistant?: {
      limit: number
    }
  }
}

export class RoomApi {
  constructor() {

  }

  get prefix(): string {
    return `${REACT_APP_AGORA_APP_SDK_DOMAIN}/scene/apps/%app_id`.replace("%app_id", APP_ID)
  }

  async fetch (params: AgoraFetchParams) {
    const {
      method,
      token,
      data,
      full_url,
      url,
      type
    } = params
    const opts: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${AUTHORIZATION!.replace(/basic\s+|basic/i, '')}`
      }
    }
    
    if (data) {
      opts.body = JSON.stringify(data);
    }

    if (token) {
      opts.headers['token'] = token
    }
  
    let resp: any;
    if (full_url) {
      resp = await HttpClient(`${full_url}`, opts);
    } else {
      resp = await HttpClient(`${this.prefix}${url}`, opts);
      // switch (type) {
      //   default: {
      //     fetchResponse = await fetch(`${this.prefix}${url}`, opts);
      //     break;
      //   }
      // }
    }
      
    // WARN: 需要约定状态码
    if (resp.code !== 0) {
      throw {msg: resp.msg}
    }

    return resp
  }
  
  async acquireRoomGroupBy(roomUuid: string, userToken: string) {
    const memberLimit = 4
    try {
      let data = await this.createGroup(roomUuid, memberLimit, userToken)
      return data
    } catch (err) {
      BizLogger.warn(`[room-api]#acquireRoomGroupBy code: ${err.code} msg: ${err.message}`)
    }
  }

  async fetchRoom(params: {roomName: string, roomType: number}) {
    const roomConfig: any = {
      roomUuid: `${params.roomName}${params.roomType}`,
      roomName: `${params.roomName}`,
      roleConfig: {
        host: {
          limit: 1
        },
        broadcaster: {
          limit: 1
        }
      }
    }
    try {
      if (params.roomType === EduRoomType.SceneType1v1) {
        roomConfig.roleConfig = {
          host: {
            limit: 1
          },
          broadcaster: {
            limit: 1
          }
        }
      }

      if (params.roomType === EduRoomType.SceneTypeSmallClass) {
        roomConfig.roleConfig = {
          host: {
            limit: 1
          },
          broadcaster: {
            limit: 16
          }
        }
      }

      if (params.roomType === EduRoomType.SceneTypeBigClass) {
        roomConfig.roleConfig = {
          host: {
            limit: 1
          },
          audience: {
            limit: -1
          },
          broadcaster: {
            limit: 1
          }
        }
      }

      if (params.roomType === EduRoomType.SceneTypeBreakoutClass) {
        roomConfig.roleConfig = {
          host: {
            limit: 1
          },
          audience: {
            limit: -1
          },
          assistant: {
            limit: 1
          }
        }
      }

      if (params.roomType === EduRoomType.SceneTypeMiddleClass) {
        roomConfig.roleConfig = {
          host: {
            limit: 1
          },
          audience: {
            limit: 100
          },
        }
        // roomConfig.roomProperties = {
        //   processUuid: roomConfig.roomUuid
        // }
      }
      
      await this.createRoom(roomConfig)
    } catch (err) {
      if (err.msg !== 'Room conflict!') {
        throw err
      }
    }
    return await this.queryRoom(roomConfig.roomUuid);
  }

  async createGroup(roomUuid: string, memberLimit: number, userToken: string) {
    let res = await this.fetch({
      full_url: `${REACT_APP_AGORA_APP_SDK_DOMAIN}/grouping/apps/${APP_ID}/v1/rooms/${roomUuid}/groups`,
      method: 'POST',
      data: {
        roleConfig: {
          broadcaster: {
            limit: 4
          },
          assistant: {
            limit: 1
          }
        },
        memberLimit: memberLimit
      },
      token: userToken
    })
    return res.data
  }

  async createRoom(params: EduClassroomConfig) {
    const {roomUuid, ...data} = params
    let res = await this.fetch({
      url: `/v1/rooms/${roomUuid}/config`,
      method: 'POST',
      data: data
    })
    return res
  }

  async queryRoom(roomUuid: string): Promise<QueryRoomResponseData> {
    let {data} = await this.fetch({
      url: `/v1/rooms/${roomUuid}/config`,
      method: 'GET',
    })
    return {
      roomName: data.roomName,
      roomUuid: data.roomUuid,
      roleConfig: data.roleConfig
    }
  }

  async queryScreenShare(roomUuid: string): Promise<any> {
    let {data} = await this.fetch({
      url: `/v1/rooms/${roomUuid}/config`,
      method: 'POST'
    })
    return {
      uid: data.uid,
      channel: data.channel,
      token: data.token
    }
  }
}