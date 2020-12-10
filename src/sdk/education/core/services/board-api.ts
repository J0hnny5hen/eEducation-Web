import { AgoraFetchParams } from "../../interfaces";
import { get } from "lodash";
import { BoardInfoResponse } from "./interface";
import { APP_ID, AUTHORIZATION } from "@/utils/config";
import { HttpClient } from "../utils/http-client";

export class AgoraBoardApi {

  private _board_prefix: string = `${REACT_APP_AGORA_APP_SDK_DOMAIN}/board/apps/%app_id`.replace('%app_id', APP_ID)
  // private _board_prefix: string = `${REACT_APP_AGORA_APP_SDK_DOMAIN}/scenario/board/apps/%app_id`

  private userToken: string
  private roomUuid: string

  constructor(
    userToken: string,
    roomUuid: string
  ) {
    this.userToken = userToken
    this.roomUuid = roomUuid
  }

  get board_prefix() {
    return this._board_prefix
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

    if (this.userToken) {
      opts.headers['token'] = this.userToken;
    }
    
    if (data) {
      opts.body = JSON.stringify(data);
    }

    const resp = await HttpClient(`${this.board_prefix}${url}`, opts);
  
    // WARN: 需要约定状态码
    if (resp.code !== 0) {
      throw {msg: resp.msg}
    }

    return resp
  }

  async getBoardInfo(roomUuid: string): Promise<BoardInfoResponse> {
    let boardRoom = await this.getBoardRoomInfo(roomUuid)
    return {
      info: {
        boardId: get(boardRoom, 'info.boardId'),
        boardToken: get(boardRoom, 'info.boardToken'),
      },
      state: {
        follow: get(boardRoom, 'state.follow'),
        grantUsers: get(boardRoom, 'state.grantUsers', [])
      }
    }
  }

  async getCurrentBoardInfo() {
    let info = await this.getBoardInfo(this.roomUuid);
    return info;
  }
  
  async getBoardRoomInfo(roomUuid: string): Promise<any> {
    let res = await this.fetch({
      type: 'board',
      url: `/v1/rooms/${roomUuid}`,
      method: 'GET',
    })
    return res.data
  }

  async updateBoardUserState(roomUuid: string, userUuid: string, grantPermission: number) {
    let res = await this.fetch({
      type: 'board',
      url: `/v1/rooms/${roomUuid}/users/${userUuid}`,
      method: 'PUT',
      data: {
        grantPermission
      }
    })
    return res
  }

  async updateBoardRoomState(roomUuid: string, follow: number) {
    let res = await this.fetch({
      type: 'board',
      url: `/v1/rooms/${roomUuid}/state`,
      method: 'PUT',
      data: {
        follow
      }
    })
    return res
  }

  async updateCurrentBoardUserState(userUuid: string, grantPermission: number) {
    return await this.updateBoardUserState(this.roomUuid, userUuid, grantPermission)
  }

  async updateCurrentBoardState(follow: number) {
    return await this.updateBoardRoomState(this.roomUuid, follow)
  }
}
