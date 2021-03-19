<template>
  <div id="app ">
    <ul
      class="navbar "
      :class="{hideNavBar}"
    >
      <li @click="canvasToImage">
        <i class="fa fa-save" />
        SAVE
      </li>
      <li @click="resetCanvas">
        <i class="fa fa-chalkboard" />
        CLEAR ALL
      </li>
      <li @click="back()">
        <i class="fa fa-undo" />
        UNDO
      </li>

      <li @click="forward()">
        <i class="fas fa-redo" />
        REDO
      </li>
      <div
        class="btn up "
        @click="hideNavBar = !hideNavBar"
      />
    </ul>

    <canvas
      ref="sketchpad"
      :style="`background-color:${backgroundColor}; `"
      @mousedown="onCanvasMouseDown"
      @mouseup="onCanvasMouseUp"
    />

    <ul
      class="toolbar"
      :class="{hideToolBar}"
    >
      <div
        class="btn btn-toolbar down"
        @click="hideToolBar = !hideToolBar"
      />
      <li class="toolbar__tool">
        <i
          v-for="(tool,index) in tools "
          :key="index"

          :class="`${tool.preClass } fa-${tool.name} `+ isToolActive(tool.name)"
          @click="currentTool=tool.name"
        />
      </li>
      <li class="toolbar__size">
        <span>SIZE:</span>
        <input
          v-model="currentSize"
          type="text"
          class="size-controller"
          @mousedown="onSizeMouseDown"
          @mouseup="resetToolState"
        >
        <span>px</span>
      </li>
      <li class="toolbar__color">
        <span>COLOR:</span>
        <div
          v-for="(color,index) in colors"
          :key="index"
          class="color"
          :class="`color-${color.name} `+isColorActive(color.name)"
          @click="currentColor=color"
        />
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      canvasContext: null,
      backgroundColor: '#dfdfdf',
      colors: [
        { name: 'white', code: 'white' },
        { name: 'black', code: 'black' },
        { name: 'lightgreen', code: '#9BFFCD' },
        { name: 'green', code: '#00CC99' },
        { name: 'darkgreen', code: '#01936F' }],
      currentColor: null,
      currentSize: '20',
      isSizing: false,
      isCanvasMouseDown: false,
      hideToolBar: false,
      hideNavBar: false,
      tools: [
        {
          preClass: 'fas',
          name: 'paint-brush',
        }, {
          preClass: 'fas',
          name: 'eraser',
        }, {
          preClass: 'far',
          name: 'square',
        }],
      currentTool: 'square',
      tempPosition: null,
      tempCanvas: null,
    };
  },
  mounted() {
    this.setCanvas();
    // eslint-disable-next-line prefer-destructuring
    this.currentColor = this.colors[0];
    this.setWindowEvent();
  },
  methods: {
    onCanvasMouseDown() {
      this.isCanvasMouseDown = true;
      this.setTempCanvas();
    },
    onCanvasMouseUp() {
      this.saveCanvasToHistory();
      this.resetToolState();
    },
    onSizeMouseDown() { this.isSizing = true; },
    canvasToImage() {
      const url = this.$refs.sketchpad.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.innerText = 'Download';
      link.href = url;
      link.download = 'circle.png';
      link.click();
    },
    setWindowEvent() {
      window.addEventListener('mousemove', (event) => {
        const currentPos = this.getCanvasMousePosition(event.clientX, event.clientY);

        if (this.isSizing && this.tempPosition) {
          const dragValue = currentPos.y - this.tempPosition.y;
          this.checkSizeDrag(dragValue);
        }
        if (this.isCanvasMouseDown && this.tempPosition) {
          const pos = this.getCanvasMousePosition(event.clientX, event.clientY);
          // eslint-disable-next-line default-case
          switch (this.currentTool) {
            case 'paint-brush':
              this.draw((ctx) => {
                // eslint-disable-next-line no-param-reassign
                ctx.strokeStyle = this.currentColor.code;
                ctx.moveTo(this.tempPosition.x, this.tempPosition.y);
                ctx.lineTo(pos.x, pos.y);
              });
              break;
            case 'eraser':
              this.draw((ctx) => {
                // eslint-disable-next-line no-param-reassign
                ctx.strokeStyle = this.backgroundColor;
                ctx.moveTo(this.tempPosition.x, this.tempPosition.y);
                ctx.lineTo(pos.x, pos.y);
              });
              break;
            case 'square':
              this.draw((ctx) => {
                // ctx.moveTo(this.tempPosition.x,this.tempPosition.y)
                // ctx.lineTo(pos.x,pos.y)
                // eslint-disable-next-line no-shadow
                // const currentPos = this.getCanvasMousePosition(event.clientX, event.clientY);

                // eslint-disable-next-line no-param-reassign
                ctx.strokeStyle = this.currentColor.code;
                const tempx = this.tempPosition.x;
                const tempy = this.tempPosition.y;
                const width = pos.x - tempx;
                const height = pos.y - tempy;

                ctx.putImageData(this.tempCanvas, 0, 0);
                ctx.rect(tempx, tempy, width, height);
              });

              break;
          }
        }
        if (this.currentTool === 'square' && this.isCanvasMouseDown) return;
        this.setCanvasTempPosition(currentPos.x, currentPos.y);
      });
      window.addEventListener('popstate', (e) => {
        this.canvasContext.putImageData(e.state, 0, 0);
      });
    },
    checkSizeDrag(dragValue) {
      if (dragValue < 0) {
        this.currentSize = parseInt(this.currentSize, 10) + 1;
      } else if (dragValue > 0 && this.currentSize >= 1) {
        this.currentSize = parseInt(this.currentSize, 10) - 1;
      }
    },
    draw(action) {
      const { canvasContext } = this;
      canvasContext.beginPath();
      canvasContext.lineWidth = this.currentSize * 2;
      action(canvasContext);
      canvasContext.stroke();
    },
    resetToolState() {
      this.isSizing = false;
      this.tempPosition = null;
      this.isCanvasMouseDown = false;
    },
    isColorActive(color) {
      return this.currentColor && color === this.currentColor.name
        ? 'active' : '';
    },
    isToolActive(tool) {
      return tool === this.currentTool ? 'active' : '';
    },
    resetCanvas() {
      const { canvas } = this.canvasContext;
      this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      this.saveCanvasToHistory();
    },
    setCanvas() {
      const canvas = this.$refs.sketchpad;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this.canvasContext = ctx;
    },
    setTempCanvas() {
      const ctx = this.canvasContext;
      const { canvas } = ctx;
      const tempCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
      this.tempCanvas = tempCanvas;
    },
    saveCanvasToHistory() {
      const ctx = this.canvasContext;
      const { canvas } = ctx;
      const tempCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
      window.history.pushState(tempCanvas, null);
    },
    getCanvasMousePosition(clientX, clientY) {
      const canvasPosition = this.canvasContext.canvas.getBoundingClientRect();
      const x = clientX - canvasPosition.x;
      const y = clientY - canvasPosition.y;
      return { x, y };
    },
    setCanvasTempPosition(x, y) {
      this.tempPosition = { x, y };
    },
    back() {
      window.history.back();
    },
    forward() {
      window.history.forward();
    },
  },

};
</script>
