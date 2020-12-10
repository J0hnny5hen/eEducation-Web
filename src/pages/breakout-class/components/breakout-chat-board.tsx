import React, { useState } from 'react';
import { ChatPanel } from '@/components/chat/panel';
import { StudentList } from '@/components/student-list';
import { t } from '@/i18n';
import { observer } from 'mobx-react'
import { useBreakoutRoomStore } from '@/hooks';
import { TeacherChatBoard } from './teacher-chat-board';
import { StudentChatBoard } from './student-chat-board';
import { AssistantChatBoard } from './assistant-chat-board';

const RoomBoardController = observer((props: any) => {
  const breakoutRoomStore = useBreakoutRoomStore()
  const userRole = breakoutRoomStore.roomInfo.userRole
  return (
    <>
      <div className={`small-class chat-board`}>
        {(userRole === 'teacher' && <TeacherChatBoard />)}
        {(userRole === 'student' && <StudentChatBoard />)}
        {(userRole === 'assistant' && <AssistantChatBoard />)}
      </div>
    </>
  )
})

export function BreakoutRoomBoard() {
  return (
    <RoomBoardController />
  )
}