import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CustomIcon } from "../icon"
import './index.scss'
import { useExtensionStore, useMiddleRoomStore, useSceneStore } from '@/hooks'
import { RendererPlayer } from '../media-player'
import { observer } from 'mobx-react'
import { get } from 'lodash'
import { useTimeout } from '../toast'
import starsUrl from '../../assets/stars.gif';

type VideoPlayerProps = {
  className?: string
  userUuid: string
  streamUuid: string
  showClose: boolean
  account: string
  renderer?: any
  role: string
  audio: boolean
  video: boolean
  local?: boolean
  share?: boolean
  showControls: boolean
  showStar?: boolean
  showHover?: boolean
  showMediaBtn?: boolean
  handleClickVideo?: (userUuid: string, isLocal: boolean) => void
  handleClickAudio?: (userUuid: string, isLocal: boolean) => void
}

type RewardMenuPropsType = {
  userUuid: string
  video: boolean
  audio: boolean
}

export const MediaMenu = observer((props: RewardMenuPropsType) => {
  const {video, audio, userUuid} = props
  const sceneStore = useSceneStore()
  const middleRoomStore = useMiddleRoomStore() 

  const userReward = middleRoomStore.getUserReward(userUuid)

  const handleAudioClick = async () => {
    if (props.audio) {
      await sceneStore.muteAudio(props.userUuid, false)
    } else {
      if(middleRoomStore.userUuid === props.userUuid) {
        //don't ask if it's myself
        await sceneStore.unmuteAudio(props.userUuid, false)
      } else {
        await sceneStore.sendUnmuteApply('audio', props.userUuid)
      }
    }
  }

  const handleVideoClick = async () => {
    if (props.video) {
      await sceneStore.muteVideo(props.userUuid, false)
    } else {
      if(middleRoomStore.userUuid === props.userUuid) {
        //don't ask if it's myself
        await sceneStore.unmuteVideo(props.userUuid, false)
      } else {
        await sceneStore.sendUnmuteApply('video', props.userUuid)
      }
    }
  }

  // TODO: 需要完善，中班课场景的发送奖励
  // const sendReward = useCallback(async () => {
  //   userReward && await middleRoomStore.sendReward(userReward.userUuid, userReward.reward)
  // }, [userReward])

  // TODO: close co-video
  const handleClose = async () =>{
    await middleRoomStore.sendClose(props.userUuid)
  }

  const StartEffect = (props: any) => {
    useTimeout(() => {
      console.log("show effect")
      props && props.destroy()
    }, 2500)

    return (
      <div className="stars-effect">
        {/* <!-- work around use timestamp solve gif only play once --> */}
        <img src={`${starsUrl}?${Date.now()}`}></img>
      </div>
    )
  }

  const rewardNumber: number = +get(userReward, 'reward', 1)

  const prevNumber = useRef<number>(rewardNumber)

  const [rewardVisible, showReward] = useState<boolean>(false)

  // const onDestroy = useCallback(() => {
  //   showReward(false)
  // }, [showReward])

  // useEffect(() => {
  //   if (prevNumber.current !== rewardNumber) {
  //     showReward(true)
  //     prevNumber.current = rewardNumber
  //   }
  // }, [prevNumber, rewardNumber, showReward])

  return (
    <>
      <div className="hover-menu">
        {
          userReward ? 
          <>
            <CustomIcon onClick={handleAudioClick} className={audio ? "icon-speaker-on" : "icon-speaker-off"} data={"audio"} />
            <CustomIcon onClick={handleVideoClick} className={video ? "icons-camera-unmute-s" : "icons-camera-mute-s"} data={"video"} />
            <CustomIcon onClick={handleClose} className={"icons-close-co-video"} data={"close-co-video"} />
            {/* <CustomIcon onClick={sendReward} className={"icon-hollow-white-star"} data={"reward"} /> */}
          </> : null
        }
      </div>
      {/* {rewardVisible ?
        <StartEffect destroy={onDestroy} /> : null} */}
    </>
  )
})

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  className,
  showClose,
  streamUuid,
  userUuid,
  account,
  renderer,
  local = false,
  role,
  audio,
  video,
  showControls,
  showMediaBtn,
  share = false,
  showStar,
  handleClickVideo,
  handleClickAudio,
  showHover
}) => {

  const sceneStore = useSceneStore()
  const [mouseOver, setMouseOver] = useState(false);

  const handleClose = async () => {
    await sceneStore.closeStream(userUuid, local)
  }

  const handleAudioClick = async () => {
    if (handleClickAudio) {
      return handleClickAudio(userUuid, local)
    }
    if (audio) {
      await sceneStore.muteAudio(userUuid, local)
    } else {
      await sceneStore.unmuteAudio(userUuid, local)
    }
  }

  const handleVideoClick = async () => {
    if (handleClickVideo) {
      return handleClickVideo(userUuid, local)
    }
    if (video) {
      await sceneStore.muteVideo(userUuid, local)
    } else {
      await sceneStore.unmuteVideo(userUuid, local)
    }
  }

  const handleMouseOver = () => setMouseOver(true)
  const handleMouseOut = () => setMouseOver(false)

  const extensionStore = useExtensionStore()

  // const shake = useMemo(() => {
  //   return extensionStore.coVideoStudentsList.find((it) => it.userUuid === userUuid) ? true : false
  // }, [extensionStore.coVideoStudentsList])

  return (
    <div onMouseEnter={handleMouseOver} onMouseLeave={handleMouseOut} className={`${className ? className : 'agora-video-view'}`}>
      {showClose ? <div className="icon-close" onClick={handleClose}></div> : null}
      {showHover && mouseOver ? 
        <MediaMenu
          userUuid={`${userUuid}`}
          video={video}
          audio={audio}
        /> : null}
      {
        share === true ? null : 
        <div className={role === 'teacher' ? 'teacher-placeholder' : 'student-placeholder'}>
        </div>
      }
      { share ? 
        <RendererPlayer key={renderer && renderer.videoTrack ? renderer.videoTrack.getTrackId() : ''} track={renderer} id={streamUuid} fitMode={true} className="rtc-video" /> :
        <>
          { renderer && video ? <RendererPlayer key={renderer && renderer.videoTrack ? renderer.videoTrack.getTrackId() : ''} track={renderer} id={streamUuid} className="rtc-video" /> : null}
        </>
      }
      { 
        account ? 
        <div className="video-profile">
          <span className="account">{account}</span>
          {/* {shake && <div className={`active_hands_up ${shake ? "infinity-shake": ""}`} style={{width: "24px"}} />} */}
          {/* {showStar ? 
            // <CustomIcon onClick={() => {}} className={audio ? "icon-hollow-white-star" : "icon-inactive-star"} data={"active-star"} />
            <CustomIcon onClick={() => {}} className={"icon-hollow-white-star"} data={"active-star"} />
          : null} */}
          {showControls ?
            <span className="media-btn">
              <CustomIcon onClick={handleAudioClick} className={audio ? "icon-speaker-on" : "icon-speaker-off"} data={"audio"} />
              <CustomIcon onClick={handleVideoClick} className={video ? "icons-camera-unmute-s" : "icons-camera-mute-s"} data={"video"} />
            </span> : null}
          {showMediaBtn ?
          <span className="media-btn no-hover">
            <CustomIcon onClick={() => {}} className={audio ? "icon-speaker-on" : "icon-speaker-off"} data={"audio"} />
            <CustomIcon onClick={() => {}} className={video ? "icons-camera-unmute-s" : "icons-camera-mute-s"} data={"video"} />
          </span> : null}
        </div>
        : null
      }
    </div>
  )
}