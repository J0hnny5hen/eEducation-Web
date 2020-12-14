import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import {VideoPlayer} from '@/components/video-player';
import './video-marquee.scss';

const showScrollbar = () => {
  const $marquee = document.querySelector(".video-marquee .agora-video-view");
  if ($marquee) {
    const clientWidth = $marquee.clientWidth;
    const marqueeLength: number = document.querySelectorAll(".video-marquee .agora-video-view").length;
    const videoMarqueeMark = document.querySelector('.video-marquee-mask')
    if (clientWidth && videoMarqueeMark) {
      const videoMarqueeWidth = videoMarqueeMark.clientWidth;
      const width: number = clientWidth * marqueeLength;
      if (videoMarqueeWidth <= width) {
        return true;
      }
    }
  }
  return false;
}

type VideoMarqueePropsType = {
  mainStream: any,
  othersStreams: any[]
  className?: string
  showMain?: boolean
  canHover?: boolean
}

export const VideoMarquee = (props: VideoMarqueePropsType) => {
  const {mainStream, othersStreams} = props

  const marqueeEl = useRef(null);

  const scrollLeft = (current: any, offset: number) => {
    current.scrollLeft += (offset * current.childNodes[1].offsetWidth);
  }

  const handleScrollLeft = (evt: any) => {
    scrollLeft(marqueeEl.current, 1);
  }

  const handleScrollRight = (evt: any) => {
    scrollLeft(marqueeEl.current, -1);
  }

  const ref = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      ref.current = true;
    }
  }, []);

  const [scrollBar, setScrollBar] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (!othersStreams.length) return;
    !ref.current && setScrollBar(showScrollbar());
  }, [othersStreams]);

  useEffect(() => {
    window.addEventListener('resize', (evt: any) => {
      !ref.current && setScrollBar(showScrollbar());
    });
    return () => {
      window.removeEventListener('resize', () => {});
    }
  }, []);

  return (
    <div className={`video-marquee-container ${props.className ? props.className : ''}`}>
      {mainStream ? <div className="main">
        <VideoPlayer
          showHover={props.canHover}
          showClose={false}
          role="teacher"
          {...mainStream}
        />
      </div> : null}
      <div className="video-marquee-mask">
        <div className="video-marquee" ref={marqueeEl}>
        {scrollBar ? 
          <div className="scroll-btn-group">
            <div className="icon icon-left" onClick={handleScrollLeft}></div>
            <div className="icon icon-right" onClick={handleScrollRight}></div>
          </div> : null
        }
          {othersStreams.map((studentStream: any, key: number) => (
            <VideoPlayer
              showHover={props.canHover}
              key={key}
              showClose={false}
              role="student"
              {...studentStream}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
