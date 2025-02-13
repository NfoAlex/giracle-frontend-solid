import {JSX, onCleanup, onMount} from "solid-js";

export default function SwipeToOpenSidebarWrapper(props: { children: JSX.Element }) {

  let xDown: number | null = null;
  let yDown: number | null = null;

  const handleTouchStart = (e: TouchEvent) => {
    xDown = e.touches[0].clientX;
    yDown = e.touches[0].clientY;
  };

  const handleTouchMove = (evt: TouchEvent) => {
    if (!xDown || !yDown) {
      return;
    }

    let xUp = evt.touches[0].clientX;
    let yUp = evt.touches[0].clientY;

    let xDiff = xDown - xUp;
    let yDiff = yDown - yUp;

    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
      const triggerEl = document.getElementById("sidebarTriggerButton"); //サイドバートリガー要素
      const sidebarEl = document.getElementById("sidebar-content"); //サイドバー要素
      if ( xDiff > 0 ) {
        /* right swipe */
        //console.log("SwipeToOpenSidebarWrapper :: handleTouchMove : 右からスワイプされたはず");
        //サイドバーを開く
        if (triggerEl && sidebarEl) { //サイドバーが開いていない場合のみ開く
          triggerEl.click();
        }
      } else {
        /* left swipe */
        //console.log("SwipeToOpenSidebarWrapper :: handleTouchMove : 左からスワイプされたはず");
        //サイドバーを開く
        if (triggerEl && sidebarEl === null) {
          triggerEl.click();
        }
      }
    }
    /* reset values */
    xDown = null;
    yDown = null;
  };

  onMount(() => {
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
  });

  onCleanup(() => {
    document.removeEventListener('touchstart', handleTouchStart, false);
    document.removeEventListener('touchmove', handleTouchMove, false);
  });

  return (
    <>
      {props.children}
    </>
  );
}