import React from 'react';
// import '../classroom/room.scss';
import { isElectron } from '@/utils/platform';
// import '@/components/nav.scss';
import { Tooltip } from '@material-ui/core';
import { t } from '@/i18n';
import {CustomIcon} from '@/components/icon';
import { useUIStore } from '@/hooks';
import {observer} from 'mobx-react';
import { ReplayController } from './replay';

const ReplayWrapper = observer((props: any) => {

  const uiStore = useUIStore()

  return (
    uiStore.isElectron ? 
    <div className="replay-page-wrapper">
      <div className={`nav-container menu-nav ${isElectron ? 'draggable' : ''}`}>
        <div className="menu-nav-right">
          {/* <Tooltip title={t("icon.upload-log")} placement="bottom">
            <div>
              <CustomIcon className={loading ? "icon-loading" : "icon-upload"} onClick={(evt: any) => {
                handleClick('uploadLog')
              }}></CustomIcon>
            </div>
          </Tooltip> */}
          {uiStore.isElectron && 
          <div className="menu-group">
            <CustomIcon className="icon-minimum" icon onClick={() => {
              uiStore.windowMinimum()
            }} />
            <CustomIcon className="icon-maximum" icon onClick={() => {
              uiStore.windowMaximum()
            }} />
            <CustomIcon className="icon-close" icon onClick={() => {
              uiStore.windowClose()
            }} />
          </div>}
        </div>
      </div>
      {props.children}
    </div> :
    props.children
  )
})

export const ReplayPage = () => {
  return (
    <ReplayWrapper>
      <ReplayController />
    </ReplayWrapper>
  )
}