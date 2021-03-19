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
          <FontAwesome :icon="['fas', 'cloud-upload-alt']" />
          <span>UPLOAD IMAGE</span>
        </li>
      </ul>
    </nav>

    <!-- Brush Bar -->
    <div class="brush-bar">
      <ul class="brush-nav">
        <li
          class="brush-nav-item brush-nav-item-no-active"
          :class="{ 'brush-nav-item-active': currentTool==='brush' }"
          @click="changeTool('brush')"
        >
          <FontAwesome
            :icon="['fas', 'paint-brush']"
            style="font-size: 1.5rem"
          />
        </li>
        <li
          class="brush-nav-item brush-nav-item-no-active"
          :class="{ 'brush-nav-item-active': currentTool==='eraser' }"
          @click="changeTool('eraser')"
        >
          <FontAwesome
            :icon="['fas', 'eraser']"
            style="font-size: 1.5rem"
          />
        </li>
        <li
          class="brush-nav-item brush-nav-item-no-active"
          :class="{ 'brush-nav-item-active': currentTool==='square' }"
          @click="changeTool('square')"
        >
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
            @click="currentColor = item"
          />
          <div
            class="color-circle current-color"
            :style="`background: ${pickerWheelStartColor}`"
            @click="clickColorWheel"
          />
        </li>
      </ul>
      <ColorPicker
        v-if="isOpenColorWheel"
        :width="150"
        :height="150"
        start-color="#ff0000"
        class="color-picker-style"
        @colorChange="onColorChange"
      />
    </div>

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
      oldColor: '', // 紀錄舊顏色，從eraser切回bruch可以用
      currentTool: 'brush', // 目前選擇的工具
      canvasContext: null,
      isMouseDown: false,
      strokeWidth: 10,
      strokeColor: '',
    };
  },
  watch: {
    currentColor() {
      this.canvasContext.strokeStyle = this.currentColor;
    },
    strokeWidth() {
      this.canvasContext.lineWidth = this.strokeWidth;
    },
    currentTool(newVal, oldVal) {
      if (oldVal === 'eraser') {
        this.currentColor = this.oldColor;
      }
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
    // 切換工具，紀錄原先brush或square使用顏色
    changeTool(toolName) {
      if (toolName === 'eraser') {
        this.oldColor = this.currentColor;
        this.currentColor = 'white';
      }
      this.currentTool = toolName;
    },
    getWindowEvent() {
      window.addEventListener('mousemove', (e) => {
        // 取得當前的位置
        const pos = this.getCanvasNowPosition(e.clientX, e.clientY);

        if (this.isMouseDown && this.mouseOldPosition) {
          switch (this.currentTool) {
            case 'square':
              this.canvasContext.strokeRect(
                this.mouseOldPosition.x,
                this.mouseOldPosition.y,
                Math.abs(this.mouseOldPosition.x - pos.x),
                Math.abs(this.mouseOldPosition.y - pos.y),
              );
              break;
            default:
              this.canvasContext.beginPath();
              this.canvasContext.moveTo(
                this.mouseOldPosition.x,
                this.mouseOldPosition.y,
              );
              this.canvasContext.lineTo(pos.x, pos.y);
              this.canvasContext.stroke();
              break;
          }
        }
        this.setCanvasOldPosition(e.clientX, e.clientY);
      });
    },
    setCanvas() {
      const canvas = this.$refs.sketchpad;
      canvas.width = window.innerWidth;
      // 扣除nav的高度
      canvas.height = window.innerHeight - 80;

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
      // 得到canvas的DOMRect(位置和大小)
      const domRect = this.canvasContext.canvas.getBoundingClientRect();

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
  },
};
</script>

<style scoped src="@/css/Paint.css">
