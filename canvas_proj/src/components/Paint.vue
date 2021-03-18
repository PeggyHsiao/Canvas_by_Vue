<template>
  <div>
    <!-- Tool Bar -->
    <nav class="navbar navbar-expand">
      <ul class="navbar-nav">
        <li class="nav-item">
          <FontAwesome :icon="['fas', 'save']" /> <span>SAVE</span>
        </li>
        <li
          class="nav-item"
          @click="clearCanvas"
        >
          <FontAwesome :icon="['far', 'trash-alt']" /> <span>CLEAR ALL</span>
        </li>
        <li class="nav-item">
          <FontAwesome :icon="['fas', 'undo-alt']" /> <span>UNDO</span>
        </li>
        <li class="nav-item">
          <FontAwesome :icon="['fas', 'redo-alt']" /> <span>REDO</span>
        </li>
        <li class="nav-item">
          <FontAwesome :icon="['fas', 'cloud-upload-alt']" /> <span>UPLOAD IMAGE</span>
        </li>
      </ul>
    </nav>

    <!-- Brush Bar -->
    <div class="brush-bar">
      <ul class="brush-nav">
        <li
          class="brush-nav-item"
          :class="{'brush-nav-item-active': isToolActive}"
        >
          <FontAwesome
            :icon="['fas', 'paint-brush']"
            style="font-size: 1.5rem"
            @click="changeTool"
          />
        </li>
        <li
          class="brush-nav-item"
          @click="currentColor='white'"
        >
          <FontAwesome
            :icon="['fas', 'eraser']"
            style="font-size: 1.5rem"
          />
        </li>
        <li class="brush-nav-item">
          <FontAwesome
            :icon="['far', 'square']"
            style="font-size: 1.5rem"
          />
        </li>
        <li class="brush-nav-item">
          <span>Size: </span>
          <input
            v-model="strokeWidth"
            type="text"
            class="size-input"
          >
          <span>&nbsp;px</span>
        </li>
        <li class="brush-nav-item">
          <span>Color: </span>
          <div
            v-for="item in colorList"
            :key="item.index"
            class="color-circle"
            :style="`background: ${item}`"
            @click="currentColor=item"
          />
          <div
            class="color-circle current-color "
            :style="`background: ${pickerWheelStartColor}`"
            @click="clickColorWheel"
          />
        </li>
      </ul>
    </div>
    <ColorPicker
      v-if="isOpenColorWheel"
      :width="150"
      :height="150"
      start-color="#ff0000"
      class="color-picker-style"
      @colorChange="onColorChange"
    />

    <!-- Canvas -->
    <canvas
      ref="sketchpad"
      @mousedown="onCanvasMouseDown"
      @mouseup="onCanvasMouseUp"
    />
  </div>
</template>

<script>
export default {
  name: 'Paint',
  data() {
    return {
      colorList: ['black', 'darkgrey', 'darkred', 'crimson', 'coral'],
      isOpenColorWheel: false, // 是否開啟顏色選擇器
      pickerWheelStartColor: '#ff0000', // 自選顏色方框顏色
      currentColor: '', // 顏色選擇器當前顏色
      currentTool: 'brush', // 目前選擇的工具
      canvasContext: null,
      isMouseDown: false,
      strokeWidth: 10,
      strokeColor: '',
      isToolActive: false,
    };
  },
  watch: {
    currentColor() {
      this.canvasContext.strokeStyle = this.currentColor;
    },
    strokeWidth() {
      this.canvasContext.lineWidth = this.strokeWidth;
    },
  },
  mounted() {
    [this.currentColor] = this.colorList;
    this.setCanvas();
    this.getWindowEvent();
  },
  methods: {
    // 點選顏色選擇器
    clickColorWheel() {
      this.isOpenColorWheel = !this.isOpenColorWheel;
    },
    // 使用顏色選擇器更換顏色
    onColorChange(color) {
      this.currentColor = color;
      this.pickerWheelStartColor = color;
    },
    changeTool() {
      this.isToolActive = true;
    },
    getWindowEvent() {
      window.addEventListener('mousemove', (e) => {
        const pos = this.getCanvasNowPosition(e.clientX, e.clientY);
        if (this.isMouseDown && this.mouseOldPosition) {
          this.canvasContext.beginPath();
          this.canvasContext.moveTo(this.mouseOldPosition.x, this.mouseOldPosition.y);
          this.canvasContext.lineTo(pos.x, pos.y);
          this.canvasContext.stroke();
        }

        this.setCanvasOldPosition(e.clientX, e.clientY);
      });
    },
    setCanvas() {
      const canvas = this.$refs.sketchpad;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 80; // 扣除nav的高度

      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = this.strokeWidth;
      ctx.strokeStyle = this.currentColor;

      this.canvasContext = ctx; // 關於canvas的設定，包含畫板大小、畫筆樣式
    },
    clearCanvas() {
      const { canvas } = this.canvasContext;
      this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    },
    setCanvasOldPosition(clientX, clientY) {
      const domRect = this.canvasContext.canvas.getBoundingClientRect();// 得到canvas的DOMRect(位置和大小)

      const x = clientX - domRect.x;
      const y = clientY - domRect.y;

      this.mouseOldPosition = { x, y };
    },
    getCanvasNowPosition(clientX, clientY) {
      const domRect = this.canvasContext.canvas.getBoundingClientRect();
      const x = clientX - domRect.x;
      const y = clientY - domRect.y;
      return { x, y };
    },
    onCanvasMouseDown() {
      this.isMouseDown = true;
      this.isOpenColorWheel = false;
    },
    onCanvasMouseUp() {
      this.isMouseDown = false;
    },
    // paintStart(x, y) {
    //   this.canvasContext.beginPath();
    //   this.canvasContext.moveTo(this.mouseOldPosition.x, this.mouseOldPosition.y);
    //   this.canvasContext.lineTo(x, y);
    //   this.canvasContext.stroke();
    // },
  },
};
</script>

<style scoped>
*{ box-sizing: border-box; margin: 0; padding: 0; }
body{ position: relative; }
.navbar { width: 100%; height: 80px; background: rgb(240, 240, 240)}
.nav-item{
    margin: 0 30px;
    font-size: 1.75rem;
    font-weight: bold;
    color: rgb(41, 41, 41);
    cursor: pointer;
}
.nav-item > span{ font-size: 1.25rem; }

.brush-bar {
    background: rgb(240,240,240);
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, .2);
    border-radius: 50px;
    width: 670px;
    left: calc( 50% - 670px / 2);
    position: absolute;
    bottom: 50px;
}
.brush-nav {
    list-style-type: none;
    display: flex;
    margin-bottom: -0.5rem;
    padding-inline-start: 30px
}
.brush-nav-item { margin: 25px 15px; cursor: pointer;}
.brush-nav-item-active { background: rgb(197, 197, 197); padding: 3px; border-radius: 50%;}
.brush-nav-item > span { vertical-align: top; }
.size-input {
    width: 60px; height: 25px;
    border-color: transparent;
    text-align: center;
    margin: 0 10px;
}
.size-input:focus { outline: none; }
.color-circle {
    width: 25px; height: 25px;
    border-radius: 100%;
    display: inline-block;
    margin: 0 5px;
}
.current-color { border-radius: 0; border: 1px solid rgb(29, 29, 29); margin-left: 10px;}
.color-picker-style {
    background: white;
    box-shadow: 0 0 8px 0 rgba(0,0,0,.3);
    border-radius: 5px;
    bottom: 110px;
    right: 550px;
    position: absolute !important;
}
</style>
