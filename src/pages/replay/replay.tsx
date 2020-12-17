import React, { useCallback, useEffect, useRef } from 'react'
import './replay.scss'
import Slider from '@material-ui/core/Slider';
import { useBoardStore, useReplayStore } from '@/hooks'
import { useLocation, useParams } from 'react-router-dom'
import { useMounted } from '../../components/toast'
import { PlayerPhase } from 'white-web-sdk'
import { Progress } from '@/components/progress/progress'
import { t } from '@/i18n'
import { observer } from 'mobx-react'
import "video.js/dist/video-js.css";
import moment from 'moment';

const PlayerCover = observer(() => {
  const replayStore = useReplayStore()

  return (
    replayStore.player && replayStore.firstFrame ?
      (replayStore.phase !== PlayerPhase.Playing ?
        <div className="player-cover">
          {replayStore.phase === PlayerPhase.Buffering ? <Progress title={t("replay.loading")} />: null}
          {replayStore.phase === PlayerPhase.Pause ||
          replayStore.phase === PlayerPhase.Ended ||
          replayStore.phase === PlayerPhase.WaitingFirstFrame ? 
          <div className="play-btn" onClick={() => replayStore.handlePlayerClick()}></div> : null}
        </div> : null
      ):
      <Progress title={t("replay.loading")} />
  )
})

const useInterval = (fn: CallableFunction, delay: number) => {
  const mounted = useMounted()

  const interval = useRef<any>(null)

  useEffect(() => {
    interval.current = setInterval(() => {
      fn && mounted && fn()
    }, delay)

    return () => {
      if (interval.current) {
        clearInterval(interval.current)
      }
    }
  },[interval])
}

export const ReplayController: React.FC<any> = observer(() => {

  const boardStore = useBoardStore()

  const location = useLocation()

  const onWindowResize = useCallback(() => {
    if (boardStore.online && boardStore.room && boardStore.room.isWritable) {
      boardStore.pptAutoFullScreen()
      boardStore.room && boardStore.room.refreshViewSize()
    }
  }, [boardStore.room, boardStore.pptAutoFullScreen])

  useEffect(() => {
    window.addEventListener('resize', onWindowResize)
    return () => {
      window.removeEventListener('resize', onWindowResize)
    }
  }, [onWindowResize])

  const {roomUuid} = useParams<{roomUuid: string}>()

  const replayStore = useReplayStore()

  const replayRef = useRef<HTMLDivElement | null>(null)

  useInterval(() => {
    replayStore.getCourseRecordBy(roomUuid as string)
  }, 2500)

  useEffect(() => {
    if (replayRef.current && replayStore.recordStatus === 2 && replayStore.mediaUrl) {
      replayStore.replay(replayRef.current)
    }
  }, [replayStore.recordStatus, replayRef.current, replayStore.mediaUrl])

  const handlePlayerClick = () => {
    replayStore.handlePlayerClick()
  }

  const handleSliderMouseDown = () => {
    replayStore.pauseCurrentTime()
  }

  const handleSliderMouseUp = () => {
    replayStore.seekToCurrentTime()
  }

  const handleSliderChange = (event: any, newValue: any) => {
    replayStore.updateProgress(newValue)
  }
  
  const handleTouchStart = () => {
    replayStore.pauseCurrentTime()
  }

  const handleTouchEnd = () => {
    replayStore.seekToCurrentTime()
  }

  return (
    <div className="replay">
      <div className="player-container">
        <PlayerCover />
        <div className="player">
          <div className="agora-log"></div>
          <div ref={replayRef} id="whiteboard" className="whiteboard"></div>
          <div className="video-menu">
            <div className="control-btn">
              <div className={`btn ${replayStore.player && replayStore.phase === PlayerPhase.Playing ? 'paused' : 'play'}`} onClick={handlePlayerClick}></div>
            </div>
            <div className="progress">
              <Slider
                className='custom-video-progress'
                value={replayStore.currentTime}
                onMouseDown={handleSliderMouseDown}
                onMouseUp={handleSliderMouseUp}
                onChange={handleSliderChange}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                min={0}
                max={replayStore.duration}
                aria-labelledby="continuous-slider"
              />
              <div className="time">
                <div className="current_duration">{moment(replayStore.currentTime).format("mm:ss")}</div>
                  /
                <div className="video_duration">{moment(replayStore.totalTime).format("mm:ss")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="video-container">
        <div className="video-player">
          <video id="white-sdk-video-js" className="video-js video-layout" style={{width: "100%", height: "100%", objectFit: "cover"}}></video>
        </div>
        <div className="chat-holder chat-board chat-messages-container"></div>
      </div>
    </div>
  )
})