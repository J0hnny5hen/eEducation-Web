import React from 'react';
import { observer } from 'mobx-react';
import { useExtensionStore } from '@/hooks';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import './extension-card.scss'
import { t } from '@/i18n';

export const ExtensionCard: React.FC<any> = observer(() => {

  const extensionStore = useExtensionStore()

  const bindMiddleGroup = function() {
    extensionStore.showGrouping()
  }

  const bindMiddleHand = function() {
    extensionStore.toggleCard()
  }

  return (
    <div className="extension-card">
      <Paper className="paperCard">
        <MenuList>
          <MenuItem onClick={bindMiddleGroup}>
          <div className="group-item"></div>
          {t('extension.grouping')}
          </MenuItem>
          <MenuItem onClick={bindMiddleHand}>
          <div className="hand-item"></div>
          {t('extension.hands_up')}
          </MenuItem>
        </MenuList>
      </Paper>
    </div>
  )
})