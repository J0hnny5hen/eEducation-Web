import React, { useRef, useEffect, useMemo } from 'react';
import {Message, RoomMessage} from './message';
import { Input } from '@material-ui/core';
import {CustomButton} from '../custom-button';
import './panel.scss';
import { ChatMessage } from '@/utils/types';
import { t } from '@/i18n';
import {observer} from 'mobx-react';

export interface ChatPanelProps {
  canChat: boolean
  muteControl: boolean
  muteChat: boolean
  messages: ChatMessage[]
  value: string
  handleMute: (evt: any) => Promise<any>
  sendMessage: (evt: any) => void
  handleChange: (evt: any) => void
  showRoomName?: boolean
}

const regexPattern = /^\s+/;

const truncateBlank: (m: string) => string = (message: string) => message.replace(regexPattern, '');

export const ChatPanel: React.FC<ChatPanelProps> = observer(({
  messages,
  value,
  sendMessage,
  handleChange,
  muteControl,
  muteChat,
  handleMute,
  canChat,
  showRoomName,
}) => {
  const ref = useRef(null);

  const scrollDown = (current: any) => {
    current.scrollTop = current.scrollHeight;
  }

  useEffect(() => {
    scrollDown(ref.current);
  }, [messages.length]);

  const showText = useMemo(() => {
    if (canChat) return false
    return muteChat
  }, [canChat, muteChat])

  return (
    <>
      <div className="chat-messages-container">
        <div className="chat-messages" ref={ref}>
          {
            showRoomName ? 
            messages.map((item: ChatMessage, key: number) => (
              <RoomMessage key={key} roomName={item.fromRoomName} role={item.role} nickname={item.account} content={item.text} link={item.link} sender={item.sender} />
            )) :
            messages.map((item: ChatMessage, key: number) => (
              <Message key={key} nickname={item.account} content={item.text} role={item.role} link={item.link} sender={item.sender} />
            ))
          }
        </div>   
      </div>
      <div className="message-panel">
        {muteControl ?
          <div className={`icon ${muteChat ? 'icon-chat-off' : 'icon-chat-on' }`}
            onClick={handleMute}></div> : null}
        <Input
          disabled={canChat ? false : muteChat}
          value={!showText ? value : ''}
          placeholder={showText ? t("chat.banned") : t("chat.placeholder")}
          disableUnderline
          className={"message-input"}
          onKeyPress={async (evt: any) => {
            if (evt.key === 'Enter') {
              if (canChat || !muteChat) {
                const val = truncateBlank(value)
                val.length > 0 && await sendMessage(val);
              }
            }
          }}
          onChange={handleChange}/>
        <CustomButton className={'chat-panel-btn'} name={t("chat.send")}
          onClick={async (evt: any) => {
            if (canChat || !muteChat) {
              const val = truncateBlank(value)
              val.length > 0 && await sendMessage(val);
            }
          }} />
      </div>
    </>
  )
})