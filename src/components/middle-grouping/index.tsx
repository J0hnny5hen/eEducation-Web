import { Button } from '@material-ui/core';
import './middle-grouping.scss';
import { CustomButton } from '@/components/custom-button';
import React, { Component, useState, useCallback, EventHandler, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';
import {useExtensionStore} from '@/hooks';
import { orderBy, shuffle } from 'lodash';
import { observer } from 'mobx-react';
import { t } from '@/i18n';
  
const getItems = (count:number, offset = 0) =>
  Array.from({ length: count }, (v, k) => k).map(k => ({
      id: `item-${k + offset}`,
      content: `item ${k + offset}`
  }))

// 重新排序结果
const reorder = (list:Array<any>, startIndex:any, endIndex:any) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};  

// 列表移动
const move = (source:Array<any>, destination:Array<any>, droppableSource:any, droppableDestination:any) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  return [sourceClone, destClone];
}

const grid = 8

const getItemStyle = (isDragging: any, draggableStyle: any) => ({
  userSelect: 'none',
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,
  background: isDragging ? 'white' : 'white',
  // 拖放
  ...draggableStyle
});

const getListStyle = (isDraggingOver:boolean) => ({
  background: isDraggingOver ? 'lightblue' : 'white',
  padding: grid,
  width: 250
})

interface MiddleGroupProps {
  groups: any[][]
}

function GroupingBoard(props: MiddleGroupProps) {

  const [groupItems, updateGroupItems] = useState<any[]>(props.groups)

  const getList = useCallback((index: number) => {
    return groupItems[index]
  }, [groupItems])

  const onDragEnd = useCallback((result:any) => {
    const { source, destination } = result;

    console.log("onDragEnd#result: ", JSON.stringify(result))

    if (!destination) {
        return
    }
    let sourceIndex = +source.droppableId.split("-")[1]
    let destIndex = +destination.droppableId.split("-")[1]
    if (source.droppableId === destination.droppableId) {
        const items = reorder(
            getList(sourceIndex),
            source.index,
            destination.index
        );
        groupItems[sourceIndex] = items
        updateGroupItems(groupItems)
    } else {
        const result = move(
          getList(sourceIndex),
          getList(destIndex),
          source,
          destination
        )
        groupItems[sourceIndex] = result[0]
        groupItems[destIndex] = result[1]
        updateGroupItems(groupItems)
    }
  }, [groupItems, updateGroupItems, getList, move, reorder])

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {groupItems.map((_, groupsIndex:any) => (
        <Droppable droppableId={`droppable-${groupsIndex}`} key={groupsIndex}>
            {(provided:any, snapshot:any) => (
              <div
                className="group-item"
                ref={provided.innerRef}
                style={getListStyle(snapshot.isDraggingOver)}>
                <div className="group-item-title">
                  <span className="group">组{groupsIndex + 1}</span>
                  <span className="num">({groupItems.length}人)</span>
                </div>
                {getList(groupsIndex).map((item:any, index:any) => (
                    <Draggable
                        key={`${item.userUuid}${index}`}
                        draggableId={item.userUuid}
                        index={index}>
                        {(provided:any, snapshot:any) => (
                            <div 
                                className="group-item-item"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(
                                    snapshot.isDragging,
                                    provided.draggableProps.style
                                )}>
                                <div className={`stu-identity ${item.offline ? 'offline' : ''}`}>
                                  <div className="stu-head"></div>
                                  <div className="stu-name">{item.userName}</div>
                                </div>
                            </div>
                        )}
                    </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
        </Droppable>
        ))}
    </DragDropContext>
  )
}

interface MiddleGroupCardProps {
  group: {
    groupName: string
    members: any[]
  }
  platform: EventHandler<any>
  addStar: EventHandler<any>
  controlMicrophone: EventHandler<any>
  isTeacher: boolean
}

export const MiddleGroupCard: React.FC<MiddleGroupCardProps> = observer(
  ({group, platform, addStar, controlMicrophone, isTeacher}) => {

  const [isClose, setIsClose] = useState<boolean>(false)

  // 0 表示麦克风处于关闭状态 1 开启
   const controlClose = async ()=> {
    await controlMicrophone(0)
    setIsClose(true)
  }

  const controlOpen = async ()=> {
    await controlMicrophone(1)
    setIsClose(false)
  }
  
  return (
    <div className="middle-group-card">
      <div className="head">
        <div className="text">
          <div className="group-text">{group.groupName}:</div>
          <div className="group-stu-num">({group.members.length}人)</div>
        </div>
        {
          isTeacher?
          <div className="icon">
            {
              isClose?
              <div className="close-microphone" onClick={controlOpen}></div>
              :
              <div className="microphone" onClick={controlClose}></div>
            }
            <div className="platform" onClick={platform}></div>
            <div className="add-star" onClick={addStar}></div>
          </div> : null
        }
      </div>
      <hr />
      <div className="group-body">
      {group.members.map((item: any, idx: number) => (
        <div className={`group-stu ${item.offline ? 'offline' : ''}`} key={idx}>
          <div className="stu-head"></div>
          <span className="stu-name">{item.userName}</span>
          <div className="star-box">
            <div className="stu-star"></div>
            <span className="star-num"></span>
            {item.reward}
          </div>
        </div>
      ))}
      </div>
    </div>
  )
})

interface MiddleGroupingProps {
  onSave: EventHandler<any>
  onRemove: EventHandler<any>
  dataList: any[]
  studentTotal: number
}

export const MiddleGrouping: React.FC<MiddleGroupingProps> = ({onSave, dataList, onRemove, studentTotal}) => {
  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      formControl: {
        margin: theme.spacing(1),
        marginLeft: 20,
        minWidth: 120,
      },
      selectEmpty: {
        marginTop: theme.spacing(2),
      },
    }),
  )

  const extensionStore = useExtensionStore()

  const [itemList, setItemList] = useState<any[]>(dataList);
  const [visibleAddNewGroup, setVisibleAddNewGroup] = useState<boolean>(false)
  const [dragGrouping, setDragGrouping] = useState<boolean>(false)
  const [controlSpread, setControlSpread] = useState<number>(2)
  const [addition, setAddition] = useState<boolean>(true)

  const [maximum, setMaximum] = React.useState<number>(2)
  
  const [groupType, setGroupType] = React.useState<number>(0)

  const groupItems = useMemo(() => {
    if (!maximum) return []
    if (groupType === 0) {
      const list = []
      const orderList = orderBy(itemList, ['streamUuid'], ['asc'])
      const length = orderList.length
      for (let i = 0; i < length; i += maximum) {
        list.push(orderList.slice(i, Math.min(i+maximum, length)))
      }
      return list
    }
    if (groupType === 1) {
      const list = []
      const shuffleList = shuffle(itemList)
      const length = shuffleList.length
      for (let i = 0; i < length; i += maximum) {
        list.push(shuffleList.slice(i, Math.min(i+maximum, length)))
      }
      return list
    }
    return itemList
  }, [maximum, groupType, itemList])

  console.log("groupItems middle-grouping", groupItems)

  const [groups, setGroups] = useState<Array<any>>([])
    
  const reduceGroup = () => {
    setAddition(false)
    setControlSpread(1)
  }

  const reduceGroupSmall = () => {
    setAddition(true)
    setControlSpread(2)
  }
  
  const closeGroup = () => {
    extensionStore.hiddenGrouping()
  }

  const handleChangeMaximum = 
    (event: React.ChangeEvent<{value: any}>) => {
      setMaximum(+event.target.value);
    }
  
  const handleChangeType = 
    (event: React.ChangeEvent<{ value: any }>) => {
      setGroupType(+event.target.value);
    }

  const classes = useStyles()

  const handleAddNewGroup = () => {
    setVisibleAddNewGroup(true)
  }

  const handleResetGroup = () => {
    setVisibleAddNewGroup(false)
    setDragGrouping(false)
  }
  
  const handleConfirm = useCallback(() => {
    setVisibleAddNewGroup(false)
    setDragGrouping(true)
  }, [groupType, setGroups])
  
  const handleCancel = () => {
    setVisibleAddNewGroup(false)
  }

  const handleSave = useCallback(function () {
    onSave(groupItems)
  },[onSave, groupItems])

  const groupText = t('middle_room.groupText')
  
  return (
    <div className="grouping">
      {
        controlSpread === 1 && !addition?
        <div className="group-card-packup">
          <div className="text">{t('middle_room.grouping')}</div>
          <span className="stu-num">{t('middle_room.students_total') + ' ' + studentTotal}</span>
          <div className="spread-group-card" onClick={reduceGroupSmall}></div>
          <div className="close-group-card" onClick={closeGroup}></div>
        </div> 
        : null 
      }
      { 
        controlSpread === 2 && addition?
        <div className="group-card">
          <div className="group-top">
            <span className="text-group">{t('middle_room.grouping')}</span>
            <span className="text-num">{t('middle_room.students_total') + ' ' + studentTotal}</span>
            <div className="btn-operation">
              {
                dragGrouping? <Button variant="contained" className="btn-reset" onClick={handleResetGroup}>{t('middle_room.regroup')}</Button>
                : <Button variant="contained" className="btn-create" onClick={handleAddNewGroup}>{t('middle_room.create_group')}</Button>
              }
              <Button variant="contained" className="btn-delete" disabled={!dragGrouping} onClick={onRemove}>{t('middle_room.delete_group')}</Button>
            </div>
            <div className="icon-reduce" onClick={reduceGroup}></div>
            <div className="icon-close" onClick={closeGroup}></div>
          </div>
          {
            visibleAddNewGroup ? 
            <div className="creat-group">
              <div className="creat-text">{t('middle_room.create_group')}</div>
              <FormControl className={classes.formControl}>
                <Tooltip title={groupText}>
                  <InputLabel id="demo-simple-select-label" >{t('middle_room.maximum_number_group')}</InputLabel>
                </Tooltip>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={maximum}
                  onChange={handleChangeMaximum}
                >
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={4}>4</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={6}>6</MenuItem>
                </Select>
              </FormControl>
              <FormControl className={classes.formControl}>
                <InputLabel id="demo-simple-select-label">{t('middle_room.grouping_way')}</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={groupType}
                  onChange={handleChangeType}
                >
                  <MenuItem value={0}>{t('middle_room.order')}</MenuItem>
                  <MenuItem value={1}>{t('middle_room.order')}</MenuItem>
                </Select>
              </FormControl>
              <div className="creat-btn-box">
                <Button variant="contained" className="btn-sure" onClick={handleConfirm}>{t('middle_room.sure')}</Button>
                <Button variant="contained" className="btn-cancel" onClick={handleCancel}>{t('middle_room.cancel')}</Button>
              </div>
            </div> 
            : null   
          }
          {
            dragGrouping ? 
            <div>
              <div className="drag-card">
                <GroupingBoard groups={groupItems} />
              </div> 
              <Button variant="contained"  className="btn-save" onClick={handleSave}>{t('middle_room.save_changes')}</Button>
            </div>
          : null
          }
        </div> : null
      }
    </div>
  )
}