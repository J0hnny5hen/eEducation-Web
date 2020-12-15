import React, {useState, useEffect, useMemo} from 'react';
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
import { get } from 'lodash';

// 检测拖拽性能
// const genUsersList = (num: number) => {
//   const items = Array.from({length: num}, (v, i) => i)
//   return items.map(item => ({
//     userName: `streamName-${item}`,
//     streamUuid: `${num}`,
//     userUuid: `${item}`,
//   }))
// }

// const userLists = genUsersList(2000)

interface StreamsProps {
  othersStreams: any
}

const GroupVideoMarquee: React.FC<StreamsProps> = observer(
  ({othersStreams}) => { 
  return <VideoMarquee
    className="group first-group"
    canHover={true}
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
    userGroups,
    roomStudentUserList,
    studentUserList
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

  const handleClick = async (evt: any, id: string, type: string) => {
    
  }

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
    <div className="room-container">
      <div className="live-container">
        <div className="platform-room">
         {
            middleRoomStore.platformState.g1 ?
            <GroupVideoMarquee othersStreams={middleRoomStore.platformState.g1Members}/>
            : null
         }
        </div>
        <div className="biz-container">
          <NetlessBoard />
          <ScreenSharing />
          {
            extensionStore.controlGrouping ?
            <MiddleGrouping dataList={roomStudentUserList} 
            studentTotal={middleRoomStore && middleRoomStore.studentSum}
            onSave={(groups) => {middleRoomStore.groupOnSave(groups)}} 
            onRemove={middleRoomStore.removeGroup} />
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
            <GroupVideoMarquee othersStreams={middleRoomStore.platformState.g2Members}/>
            : null
          }
        </div>
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
              {uiStore.activeTab !== 'chatroom' && middleRoomStore.unreadMessageCount > 0 ? <span className={`message-count`}>{middleRoomStore.unreadMessageCount}</span> : null}
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
                    isTeacher={middleRoomStore.roomInfo.userRole === 'teacher'}
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
              studentStreams={roomStudentUserList}
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
