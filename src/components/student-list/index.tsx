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
  kick: number
  chat: number
}

interface StudentListProps {
  userRole: string,
  students: any[],
  grantUsers: any[],
  isMiddleClassRoom?: boolean,
  handleClick: (...target: any[]) => Promise<void>,
}

export const StudentList: React.FC<StudentListProps> = observer(({
  userRole,
  students,
  grantUsers,
  handleClick,
  isMiddleClassRoom
}: StudentListProps) => {

  return (
    <div className="student-list"> 
      {students.map((item: any, key: number) => (
        <div key={key} className={`item ${item.offline ? 'no-hover' : ''}`}>
          <div className="nickname">{item.account}</div>
            <div className={`attrs-group ${userRole !== 'teacher' ? 'no-hover' : ''}`}>
              {/* {
                userRole === 'teacher' ? 
                <IconWrapper type="grantBoard" id={item.userUuid} value={grantUsers.includes(item.userUuid)} icon="connect" onClick={handleClick} /> : null
              } */}
              {/* {roomStore.roomInfo.userRole === 'teacher' ? <IconWrapper type="grantBoard" id={item.userUuid} value={grantUsers.includes(item.userUuid)} icon="connect" onClick={handleClick} /> : null} */}
              {item.hasOwnProperty('audio') ? <IconWrapper type="audio" id={item.userUuid} value={Boolean(item.audio)} icon="audio" onClick={handleClick} /> : <div className="items"></div>}
              {item.hasOwnProperty('video') ? <IconWrapper type="video" id={item.userUuid} value={Boolean(item.video)} icon="video" onClick={handleClick} /> : <div className="items"></div>}
              {userRole === 'teacher' && <IconWrapper type="kick" id={item.userUuid} value={Boolean(item.kick)} icon="kick" onClick={handleClick} />}
            </div>
        </div>
      ))}
    </div>
  )
})