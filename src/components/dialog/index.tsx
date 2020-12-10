import React from 'react';
import {CustomButton} from '../custom-button';
import {Dialog, DialogContent, DialogContentText} from '@material-ui/core';

import './dialog.scss';
import { t } from '@/i18n';
import { observer } from 'mobx-react';
import { useRoomStore, useUIStore, useBreakoutRoomStore, useMiddleRoomStore } from '@/hooks';
import { useHistory, useLocation } from 'react-router-dom';

export interface DialogMessage {
  type: string
  userUuid?: any
  message: string
}

export type DialogType = {
  id: number
  dialog: DialogMessage
}

interface RoomProps {
  onConfirm: (type: string) => void
  onClose: (type: string) => void
  dialogId: number
  dialogMessage: DialogMessage
}

function RoomDialog(
{
  onConfirm,
  onClose,
  dialogId,
  dialogMessage
}: RoomProps) {

  const uiStore = useUIStore()

  const handleClose = async () => {
    await onClose(dialogMessage.type)
    uiStore.removeDialog(dialogId)
  };

  const handleConfirm = async () => {
    await onConfirm(dialogMessage.type)
    uiStore.removeDialog(dialogId)
  }

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
        </DialogContent>
      </Dialog>
    </div>
  );
}

const DialogContainer = observer(() => {
  const middleRoomStore = useMiddleRoomStore()
  const roomStore = useRoomStore()
  const breakoutRoomStore = useBreakoutRoomStore()
  const uiStore = useUIStore()
  const history = useHistory()

  const location = useLocation()

  const onClose = async (type: string) => {
    if (type === 'apply') {
      await roomStore.teacherRejectApply()
    }
  }

  const onConfirm = async (type: string) => {
    if (type === 'exitRoom') {
      if (location.pathname.match(/breakout/)) {
        await breakoutRoomStore.leave()
      } else if (location.pathname.match(/middle-class/)) {
        await middleRoomStore.leave()
      }
      else {
        await roomStore.leave()
      }
      history.push('/')
    }
    else if (type === 'apply') {
      // p2p message accept coVideo
      // 老师同意学生连麦申请
      await roomStore.teacherAcceptApply()
    }
    else if (type === 'uploadLog') {
      // globalStore.removeDialog()
    }

    return;
  }

  return <>
    {
    uiStore.dialogs.map(dialog => (
      <RoomDialog
        key={dialog.id as number}
        dialogId={dialog.id as number}
        dialogMessage={dialog.dialog as DialogMessage}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    ))
    }
    </>
})


export default DialogContainer;