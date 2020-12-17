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

export const MiddleClass = observer(() => {

  const middleRoomStore = useMiddleRoomStore()

  const extensionStore = useExtensionStore()

  const sceneStore = useSceneStore()

  const uiStore = useUIStore()

  const {
    roomProperties,
    cardUserGroups,
    roomStudentUserList,
    onlineStudentList,
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
      const target = studentsList.find((it: any) => it.userUuid === id)
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
  
  return (
    <div className={`room-container`}>
      <div className="live-container">
        <div className="platform-room">
          {
            middleRoomStore.groups[0].studentStreams.length ?
              <GroupVideoMarquee mainStream={null} othersStreams={middleRoomStore.groups[0].studentStreams}/>
            : null
          }
        </div>
        <div className="biz-container">
          <NetlessBoard />
          <ScreenSharing />
          {
            extensionStore.controlGrouping ?
            <MiddleGrouping dataList={roomStudentUserList} 
            studentTotal={middleRoomStore.studentTotal}
            onSave={ async (groups) => { await middleRoomStore.groupOnSave(groups)}} 
            onRemove={ async () => await middleRoomStore.removeGroup()} />
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
          middleRoomStore.groups[1].studentStreams.length ?
            <GroupVideoMarquee mainStream={null} othersStreams={middleRoomStore.groups[1].studentStreams}/>
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
              canChat={true}
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
            cardUserGroups.length ? 
            <div className="group-card-list">
              { cardUserGroups.map((group, index) => (
                  <MiddleGroupCard key={index} 
                    group={group}
                    isTeacher={middleRoomStore.roomInfo.userRole === 'teacher'}
                    platform={async () => await middleRoomStore.clickPlatform(group)} 
                    addStar={async () => await middleRoomStore.addGroupStar(group)}
                    controlMicrophone={async (control) => {
                      await middleRoomStore.groupControlMicrophone(group, control)}}>
                  </MiddleGroupCard>
                ))
              }
            </div>
            :
            <StudentList
              userRole={userRole}
              students={onlineStudentList}
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
