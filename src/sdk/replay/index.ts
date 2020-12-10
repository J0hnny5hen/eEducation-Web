export interface ReplayParams {
  videoPath: string
  startTime: number
  endTime: number
  boardId: string
  boardToken: string
}

export class ReplayBoardManager<T> {
  nativeView?: HTMLElement
  readonly board!: T

  constructor(
    board: T
  ) {
    this.board = board
  }

  mount(nativeView?: HTMLElement) {
    this.nativeView = nativeView
  }

  async init() {
    throw new Error('Not Implemented')
  }

  // releaseCombineReplay
  async destroy() {
    throw new Error('Not Implemented')
  }

  play() {
    throw new Error('Not Implemented')
  }

  pause() {
    throw new Error('Not Implemented')
  }
  
  seekToTime() {
    throw new Error('Not Implemented')
  }
}