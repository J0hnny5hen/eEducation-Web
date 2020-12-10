import React from 'react';
import './student-list.scss';
import {CustomIcon} from '@/components/icon';
import { observer } from 'mobx-react';
import { BizLogger } from '@/utils/biz-logger';

interface CustomIconProps {
  value: boolean
  type: string
  icon: string
  id: string
  onClick: any
}

function IconWrapper ({
  value,
  icon,
  id,
  type,
  onClick
}: CustomIconProps) {
  const handleClick = async (evt: any) => {
    BizLogger.info("click", evt)
    await onClick(evt, id, type);
  }
  return (
    <div className="items">
        {/* {value ? */}
          <CustomIcon className={`icon-${icon}-${value ? "on" : "off"}`}
            onClick={handleClick}
            />
             {/* : null } */}
    </div>
  )
}

interface UserProps {
  uid: string
  account: string
  video: number
  audio: number
  chat: number
}

interface StudentListProps {
  userRole: string,
  studentStreams: any[],
  grantUsers: any[],
  isMiddleClassRoom: boolean,
  handleClick: (...target: any[]) => Promise<void>,
}

export const StudentList: React.FC<StudentListProps> = observer(({
  userRole,
  studentStreams,
  grantUsers,
  handleClick,
  isMiddleClassRoom
}: StudentListProps) => {

  return (
    <div className="student-list"> 
      {studentStreams.map((item: any, key: number) => (
        <div key={key} className="item">
          { isMiddleClassRoom ? 
            <div className="nickname">{item.userName}</div>
            :
            <>
            <div className="nickname">{item.account}</div>
            <div className="attrs-group">
              {userRole === 'teacher' ? <IconWrapper type="grantBoard" id={item.userUuid} value={grantUsers.includes(item.userUuid)} icon="connect" onClick={handleClick} /> : null}
              {/* {roomStore.roomInfo.userRole === 'teacher' ? <IconWrapper type="grantBoard" id={item.userUuid} value={grantUsers.includes(item.userUuid)} icon="connect" onClick={handleClick} /> : null} */}
              {/* <IconWrapper type="chat" id={item.userUuid} value={Boolean(item.chat)} icon="chat" onClick={handleClick} /> */}
              <IconWrapper type="audio" id={item.userUuid} value={Boolean(item.audio)} icon="audio" onClick={handleClick} />
              <IconWrapper type="video" id={item.userUuid} value={Boolean(item.video)} icon="video" onClick={handleClick} />
            </div>
            </>
          }
        </div>
      ))}
    </div>
  )
})