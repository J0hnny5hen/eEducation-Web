import React from 'react';
import { Route, HashRouter, Switch } from 'react-router-dom';
import ThemeContainer from '../containers/theme-container';
import Home from './home';
import {DeviceDetectPage} from './device-detect/index';
import { RoomPage } from './classroom';
import { MiddleRoomPage } from './middle-class';
import Loading from '../components/loading';
import {Toast} from '../components/toast';
import '../icons.scss';
import {SmallClass} from './classroom/small-class';
import {BreakoutClassroom} from './breakout-class/breakout-class';
import {OneToOne} from './classroom/one-to-one';
import {MiddleClass} from './middle-class/middle-class';
import {BigClass} from './classroom/big-class';
import RoomDialog from '../components/dialog';
import { ReplayPage } from './replay';
import {Provider} from 'mobx-react';
import { AppStore } from '@/stores/app';
import {AssistantCoursesPage} from './breakout-class/assistant-courses-page';

const defaultStore = new AppStore()
window.store = defaultStore

export default function () {
  return (
    <Provider store={defaultStore}>
      <ThemeContainer>
        <HashRouter>
          <Loading />
          <Toast />
          <RoomDialog />
          <Switch>
          <Route path="/setting">
            <DeviceDetectPage />
          </Route>
          <Route path="/classroom/one-to-one">
            <RoomPage >
              <OneToOne />
            </RoomPage>
          </Route>
          <Route path="/classroom/small-class">
            <RoomPage>
              <SmallClass />
            </RoomPage>
          </Route>
          <Route path="/classroom/big-class">
            <RoomPage>
              <BigClass />
            </RoomPage>
          </Route>
          <Route path="/classroom/middle-class">
            <MiddleRoomPage>
              <MiddleClass />
            </MiddleRoomPage>
          </Route>
          <Route path="/breakout-class/assistant/courses/:course_name">
            <BreakoutClassroom />
          </Route>
          <Route path="/breakout-class/assistant/courses">
            <AssistantCoursesPage />
          </Route>
          <Route path="/classroom/breakout-class">
            <BreakoutClassroom />
          </Route>
          <Route path="/replay/record/:roomUuid">
            <ReplayPage />
          </Route>
          <Route path="/">
            <Home />
          </Route>
          </Switch>
        </HashRouter>
      </ThemeContainer>
    </Provider>
  )
}
