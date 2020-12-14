import React, {useState, useEffect, useCallback} from 'react';
import {VideoPlayer} from '@/components/video-player';
import { ControlItem } from '@/components/control-item';
import './middle-class.scss';
import { NetlessBoard } from '@/components/netless-board';
import { ScreenSharing } from '@/components/screen-sharing';
import { observer } from 'mobx-react';
import { CustomCard } from '@/components/cards';
import { VideoMarquee } from '@/components/video-marquee';
import { useMiddleRoomStore, useBoardStore, useExtensionStore, useUIStore, useSceneStore} from '@/hooks';
import { MiddleGroupCard, MiddleGrouping } from '@/components/middle-grouping';
import {ChatPanel} from '@/components/chat/panel';
import { t } from '@/i18n';
import { UserGroup } from '@/sdk/education/interfaces/index.d';
import {StudentList} from '@/components/student-list';
import { EduMediaStream } from '@/stores/app/room';

interface StreamsProps {
  othersStreams: any[]
  mainStream: any
}

const GroupVideoMarquee: React.FC<StreamsProps> = observer(
  ({othersStreams, mainStream}) => { 
  return <VideoMarquee
    className="group first-group"
    canHover={true}
    mainStream={mainStream}
    othersStreams={othersStreams}
  />
})

// const FirstGroupVideoMarquee = observer(() => {
//   const store = useMiddleRoomStore()
//   return <VideoMarquee
//     className="group first-group"
//     canHover={true}
//     mainStream={store.groups[0].mainStream}
//     othersStreams={store.groups[0].studentStreams}
//   />
// })

const SecondGroupVideoMarquee = observer(() => {
  const store = useMiddleRoomStore()
  return <VideoMarquee
    className="group second-group"
    canHover={true}
    mainStream={store.groups[1].mainStream}
    othersStreams={store.groups[1].studentStreams}
  />
})

export const MiddleClass = observer(() => {

  const middleRoomStore = useMiddleRoomStore()

  const extensionStore = useExtensionStore()

  const sceneStore = useSceneStore()

  const uiStore = useUIStore()

  const {
    roomProperties,
    userGroups,
    roomStudentUserList,
    studentUserList,
    studentsList,
    studentTotal
  } = middleRoomStore

  const {
    mutedChat,
    muteControl,
    teacherStream: teacher,
    studentStreams,
  } = sceneStore

  const [chat, setChat] = useState<string>('')
  // const [showGroupCard, setShowGroupCard] = useState<boolean>(false)
  const [alreadyPlatform, setAlreadyPlatform] = useState<boolean>(false)
  const [starGroup, setStarGroup] = useState<number>(0)
  
  const userRole = middleRoomStore.roomInfo.userRole
  const boardStore = useBoardStore()
  const {grantUsers} = boardStore

  const sendMessage = async () => {
    await middleRoomStore.sendMessage(chat)
    setChat('')
  }

  const handleClick = useCallback(async (evt: any, id: string, type: string) => {
    const isLocal = (userUuid: string) => sceneStore.roomInfo.userUuid === userUuid
    if (sceneStore.roomInfo.userRole === 'teacher' 
    // || isLocal(id)
    )  {
      const target = studentsList.find((it) => it.userUuid === id)
      if (!target) return
      switch(type) {
        case 'kick': {
          await middleRoomStore.roomManager.userService.kickUser(id)
          break
        }
        case 'grantBoard': {
          if (boardStore.checkUserPermission(id)) {
            await boardStore.revokeBoardPermission(id)
          } else {
            await boardStore.grantBoardPermission(id)
          }
          break
        }
        case 'audio': {
          if (target) {
            if (target.audio) {
              await middleRoomStore.muteAudio(id, isLocal(id))
            } else {
              await middleRoomStore.unmuteAudio(id, isLocal(id))
            }
          }
          break
        }
        case 'video': {
          if (target) {
            if (target.video) {
              await middleRoomStore.muteVideo(id, isLocal(id))
            } else {
              await middleRoomStore.unmuteVideo(id, isLocal(id))
            }
          }
          break
        }
      }
    }
  }, [sceneStore, boardStore, studentsList, middleRoomStore])

  const handleMute = async () => {
    if (mutedChat) {
      await sceneStore.unmuteChat()
    } else {
      await sceneStore.muteChat()
    }
  }

  const handleNotice = () => {
    // middleRoomStore.showDialog()
  }

  const handleGroupOnSave = async function(groups:any) {
    let backendGroups: Object = {}
    for(let i = 0; i < groups.length; i++) {
      let groupNum: number = i + 1
      let groupItem: any = {
        groupName: "",
        members: [],
      }
      groupItem.groupName = "group" + groupNum
      groupItem.members = groups[i].map((stu:any) => stu.userUuid)
      backendGroups[groupNum] = groupItem
    }
    let properties:any = {
      groupStates: {
        state: 1,
        interactInGroup: 0, // 组内
        interactOutGroup: 0, // 组外讨论 包括分组，pk
      },
      groups: backendGroups
    }
    let cause = {cmd:"102"}
    await middleRoomStore.updateRoomBatchProperties({ properties, cause })
  }

  // 删除
  const handleGroupOnRemove = async () => {
    let cause = {cmd:"101"}
    let properties: any = {
      groupStates: {
        state: 0,
        interactInGroup: 0, // 组内
        interactOutGroup: 0, // 组外讨论 包括分组，pk
      },
      interactOutGroups: {}, // 组外互动
      groups: {}
    }
    await middleRoomStore.updateRoomBatchProperties({ properties, cause })
  }

  // 整组上台
  const handlePlatform = async (group:any) => {
    if(alreadyPlatform) {
      // 如果当前分组已经在台上 则下台
      let streams:any = []
      group.members.forEach((item:any) => {
        let stu = {
          userUuid: item.userUuid,
          streamUuid: item.streamUuid,
        }
        streams.push(stu)
      })
      await middleRoomStore.batchDeleteStream(streams)
      setAlreadyPlatform(false)
    } else {
      let streams:any = []
      group.members.forEach((item:any) => {
        let stu = {
          userUuid: item.userUuid,
          streamUuid: item.streamUuid,
          streamName: item.userUuid + 'stream',
          videoSourceType: 1,
          audioSourceType: 1,
          videoState: 1,
          audioState: 1,
        }
        streams.push(stu)        
      })
      await middleRoomStore.batchUpsertStream(streams)
      let properties: any = {
        groupStates: {
          state: 1,
          interactInGroup: 0, // 组内
          interactOutGroup: 1, // 组外讨论 包括分组，pk
        },
        interactOutGroups: {
          g1: group.groupUuid,
        }
      }
      let cause = {cmd:"104"} // 开关 pk
      middleRoomStore.updateRoomBatchProperties({ properties, cause })
      setAlreadyPlatform(true)
    }
  }

  // 整组加星
  const handleAddGroupStar = async function(group: UserGroup) {
    let properties: any
    let cause: any 
    group.members.map((stu: any) => {
      stu.reward = stu.reward + 1
      properties = {
        [`students.${stu.userUuid}.reward`]: stu.reward,
      }
      cause = {cmd:"202"} // 整组奖励
    })
    await middleRoomStore.updateRoomBatchProperties({ properties, cause })
  }
  
  return (
    <div className={`room-container`}>
      <div className="live-container">
        <div className="platform-room">
          {
            middleRoomStore.platformState.g1 ?
              <GroupVideoMarquee mainStream={null} othersStreams={middleRoomStore.platformState.g1Members}/>
            : null
          }
        </div>
        <div className="biz-container">
          <NetlessBoard />
          <ScreenSharing />
          {
            extensionStore.controlGrouping ?
            <MiddleGrouping
            dataList={roomStudentUserList} 
            studentTotal={studentTotal}
            // studentTotal={Object.keys(middleRoomStore.roomProperties.students).length}
            onSave={async (groups) => {await middleRoomStore.groupOnSave(groups)}} 
            onRemove={async () => await middleRoomStore.removeGroup} />
            : null
          }
          {
            extensionStore.visibleCard ? 
            <CustomCard />
            : null
          }
          <div className={`interactive ${middleRoomStore.roomInfo.userRole}`}>
            {middleRoomStore.roomInfo.userRole === 'teacher' && middleRoomStore.notice ?
              <ControlItem name={middleRoomStore.notice.reason}
                onClick={handleNotice}
                active={middleRoomStore.notice.reason ? true : false} />
            : null}
          </div>
        </div>
        <div className="platform-room-second">
        {
          middleRoomStore.platformState.g2 ?
            <GroupVideoMarquee mainStream={null} othersStreams={middleRoomStore.platformState.g2Members}/>
          : null
        }
        </div>
        {/* <SecondGroupVideoMarquee /> */}
      </div>
      <div className="live-board">
        <div className="video-board">
          <VideoPlayer
            role="teacher"
            showClose={false}
            {...teacher}
          />
        </div>
        <div className={`small-class chat-board`}>
          <div className="menu">
            <div className={`item ${uiStore.activeTab === 'student_list' ? 'active' : ''}`}
                onClick={() => {
                  uiStore.switchTab('student_list')
                }}
              >
              {t('room.student_list')}
            </div>
            <div className={`item ${uiStore.activeTab === 'chatroom' ? 'active' : ''}`}
            onClick={() => {
              uiStore.switchTab('chatroom')
            }}>
              {t('room.chat_room')}
              {uiStore.activeTab !== 'chatroom' && middleRoomStore.unreadMessageCount > 0 ? <span className={`message-count`}>cdscdsc</span> : null}
            </div>
          </div>
          <div className={`chat-container ${uiStore.activeTab === 'chatroom' ? '' : 'hide'}`}>
            <ChatPanel
              canChat={sceneStore.roomInfo.userRole === 'teacher'}
              muteControl={sceneStore.muteControl}
              muteChat={sceneStore.mutedChat}
              handleMute={handleMute}
              messages={middleRoomStore.roomChatMessages}
              value={chat}
              sendMessage={sendMessage}
              handleChange={(evt: any) => {
                setChat(evt.target.value)
              }} />
          </div>
          <div className={`student-container ${uiStore.activeTab !== 'chatroom' ? '' : 'hide'}`}>
          {
            userGroups.length ? 
            <div className="group-card-list">
              { userGroups.map((group, index) => (
                  <MiddleGroupCard key={index} 
                    group={group}
                    platform={async () => await middleRoomStore.clickPlatform(group)} 
                    addStar={() => middleRoomStore.addGroupStar(group)}
                    controlMicrophone={async (control) => {
                      await middleRoomStore.groupControlMicrophone(group, control)}}>
                  </MiddleGroupCard>
                ))
              }
            </div>
            :
            <StudentList
              userRole={userRole}
              students={roomStudentUserList}
              grantUsers={grantUsers}
              handleClick={handleClick}
              isMiddleClassRoom={true}
            />
          }
          </div>
        </div> 
      </div>
    </div>
  )
})
