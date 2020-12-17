import React, { useCallback, useEffect, useRef, useState } from 'react';
import {CustomButton} from '../custom-button';
import {Dialog, DialogContent, DialogContentText} from '@material-ui/core';

import './dialog.scss';
import { t } from '@/i18n';
import { observer } from 'mobx-react';
import { useRoomStore, useUIStore, useBreakoutRoomStore, useMiddleRoomStore, useSceneStore, useExtensionStore } from '@/hooks';
import { useHistory, useLocation } from 'react-router-dom';

export interface DialogMessage {
  type: string
  option?: any
  message: string
}

export type DialogType = {
  id: number
  dialog: DialogMessage
}

interface RoomProps {
  onConfirm: (option: DialogMessage) => void
  onClose: (option: DialogMessage) => void
  dialogId: number
  dialogMessage: DialogMessage
}

const RoomDialog = observer((
{
  onConfirm,
  onClose,
  dialogId,
  dialogMessage
}: RoomProps) => {

  const uiStore = useUIStore()

  const middleRoomStore = useMiddleRoomStore()

  const handleClose = async () => {
    await onClose(dialogMessage)
    uiStore.removeDialog(dialogId)
  };

  const handleConfirm = async () => {
    await onConfirm(dialogMessage)
    uiStore.removeDialog(dialogId)
  }

  const time = middleRoomStore.timers.get(`${dialogMessage.option.type}${dialogMessage.option.userUuid}`)

  return (
    <div>
      <Dialog
        disableBackdropClick
        open={true}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent
          className="modal-container"
        >
          <DialogContentText className="dialog-title">
            {dialogMessage.message}
          </DialogContentText>
          <div className="button-group">
            <CustomButton name={t("toast.confirm")} className="confirm" onClick={handleConfirm} color="primary" />
            <CustomButton name={t("toast.cancel")} className="cancel" onClick={handleClose} color="primary" />
          </div>
          {dialogMessage.type === 'unmuteApply' ? <span>{time}</span> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
})

// const RoomDialog = React.memo(_RoomDialog)


// const useLocationGuard = observer(() => {



//   return {handleLocationConfirm}
// })

export const RoomNavigationDialog = observer((props: any) => {
  const middleRoomStore = useMiddleRoomStore()
  const sceneStore = useSceneStore()
  const roomStore = useRoomStore()
  const breakoutRoomStore = useBreakoutRoomStore()
  const extensionStore = useExtensionStore()
  const uiStore = useUIStore()
  const history = useHistory()

  const location = useLocation()

  const onClose = useCallback(async ({type}: DialogMessage) => {
    if (type === 'apply') {
      await roomStore.teacherRejectApply()
    }
    // release block history and push homepage
    else if (type === 'kickRoom') {
      uiStore.unblock()
      history.push('/')
    }
    else if (type === 'unmuteApply') {
      
    }
  }, [roomStore.teacherRejectApply, middleRoomStore])

  const onConfirm = useCallback(async ({type, option}: DialogMessage) => {
    if (type === 'exitRoom') {
      if (location.pathname.match(/breakout/)) {
        await breakoutRoomStore.leave()
      } else if (location.pathname.match(/middle-class/)) {
        await middleRoomStore.leave()
      }
      else {
        await roomStore.leave()
      }
      uiStore.unblock()
      history.replace('/')
    }
    else if (type === 'apply') {
      // p2p message accept coVideo
      // 老师同意学生连麦申请
      await roomStore.teacherAcceptApply()
    }
    else if (type === 'uploadLog') {
      // globalStore.removeDialog()
    }
    // release block history and push homepage
    else if (type === 'kickRoom') {
      uiStore.unblock()
      history.replace('/')
    }
    else if (type === 'allowConfirm') {
      await extensionStore.acceptApply(option.userUuid, option.streamUuid)
    }
    else if (type === 'cancelConfirm') {
      extensionStore.removeApplyUserBy(option.userUuid)
    }
    else if (type === 'unmuteApply') {
      if (option.type === 'video') {
        await sceneStore.unmuteLocalVideo()
      }
      if (option.type === 'audio') {
        await sceneStore.unmuteLocalAudio()
      }
    }

    return;
  }, [props.handleLocationConfirm, location.pathname, breakoutRoomStore, roomStore, uiStore, history, extensionStore, middleRoomStore])

  return <>
    {
    uiStore.dialogs.map((dialog, idx) => (
      <RoomDialog
        key={`${idx}`}
        dialogId={dialog.id as number}
        dialogMessage={dialog.dialog as DialogMessage}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    ))
    }
    </>
})

export const ConfirmDialog = observer(() => {
  // const {
  //   handleLocationConfirm,
  //   // handleLocationCancel
  // } = useLocationGuard()

  const uiStore = useUIStore()
  const location = useLocation()

  const history = useHistory()

  //@ts-ignore
  window.reactHistory = history

  useEffect(() => {
    if (location.pathname.startsWith('/classroom')) {
      console.log("trigger history block 1")
      const cancel = history.block((nextLocation, action) => {
        console.log("trigger history block 2, time: ", +Date.now())
        uiStore.nextLocation = nextLocation
        uiStore.action = action
        uiStore.showDialog({
          type: 'exitRoom',
          message: t('icon.exit-room')
        })
        return false;
      });
      uiStore.cancel = cancel
    }
  }, [location.pathname, uiStore.showDialog, history.block, uiStore.unblock]);

  useEffect(() => {
    return () => {
      uiStore.unblock()
    }
  }, [])

  const handleLocationConfirm = useCallback((path: string) => {
    const action = uiStore.action
    uiStore.cancel && uiStore.cancel()
    // uiStore.cancel = undefined
    if (action === 'PUSH') {
        history.push(path ? path : `${uiStore.nextLocation}`);
    } else if (action === 'POP') {
        history.goBack();
    } else if (action === 'REPLACE') {
        history.replace(path ? path : `${uiStore.nextLocation}`);
    }
  }, [history, uiStore.cancel, uiStore.action, uiStore.nextLocation])

  return (
    <RoomNavigationDialog
      handleLocationConfirm={handleLocationConfirm}
      // handleLocationCancel={handleLocationCancel}
    />
  )
})