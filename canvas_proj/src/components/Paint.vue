<template>
  <div>
    <!-- Tool Bar -->
    <nav class="navbar navbar-expand">
      <ul class="navbar-nav">
        <a
          :href="currentCanvasBase64"
          download="Canvas.png"
        >
          <li
            class="nav-item"
            @click="saveCanvasToImage"
          >
            <FontAwesome :icon="['fas', 'save']" /> <span>SAVE</span>
          </li>
          <img
            :src="currentCanvasBase64"
            hidden
          >
        </a>
        <li
          id="trash"
          class="nav-item"
          @click="clearCanvas"
        >
          <FontAwesome :icon="['far', 'trash-alt']" /> <span>CLEAR ALL</span>
        </li>
        <li
          class="nav-item"
          :class="{'nav-item--disabled': disabledUndo}"
          :disabled="disabledUndo"
          @click="undo"
        >
          <FontAwesome :icon="['fas', 'undo-alt']" /> <span>UNDO</span>
        </li>
        <li
          class="nav-item"
          :class="{'nav-item--disabled': disabledRedo}"
          @click="redo"
        >
          <FontAwesome
            :icon="['fas', 'redo-alt']"
            @click="redo"
          /> <span>REDO</span>
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
      tempCanvas: null,
      isMouseDown: false,
      mouseOldPosition: null, // 前一個滑鼠位置
      strokeWidth: 10, // 畫筆粗細
      historyArr: [], // 存畫布操作步驟，提供undo、redo功能
      drawStep: 0, // 步驟(對應historyArr索引值，所以預設為-1，當有第一筆紀錄為0)
      currentCanvasBase64: '', // 當前畫板的base64，提供儲存使用
    };
  },
  computed: {
    disabledUndo() {
      if (this.drawStep) { return false; }
      return true;
    },
    disabledRedo() {
      if (this.historyArr.length === 0 || this.drawStep === this.historyArr.length) { return true; }
      return false;
    },
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

        // 當滑鼠按下且有舊的位置
        if (this.isMouseDown && this.mouseOldPosition) {
          switch (this.currentTool) {
            case 'square':
              this.canvasContext.putImageData(this.tempCanvas, 0, 0); // 畫圖之前的畫布

              // 隨著滑鼠畫矩形
              this.canvasContext.strokeRect(
                this.mouseOldPosition.x,
                this.mouseOldPosition.y,
                pos.x - this.mouseOldPosition.x,
                pos.y - this.mouseOldPosition.y,
              );
              // 用目前滑鼠的位置 - 上次滑鼠的位置來判斷矩形長在滑鼠的左邊or右邊(width,height負值表示長在左邊)
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
        if (this.currentTool === 'square' && this.isMouseDown) { return; }

        this.setCanvasOldPosition(e.clientX, e.clientY);
      });
    },
    setCanvas() {
      const canvas = this.$refs.sketchpad;
      canvas.width = window.innerWidth;
      // 扣除nav的高度
      canvas.height = window.innerHeight - 80;

      this.emptyCanvasBase = canvas.toDataURL(); // 沒有畫筆的畫板base64代碼

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
      this.historyArr = [];
      this.drawStep = 0;
    },
    setCanvasOldPosition(clientX, clientY) {
      // 得到canvas的DOMRect(位置和大小)
      const domRect = this.canvasContext.canvas.getBoundingClientRect();

      const x = clientX - domRect.x;
      const y = clientY - domRect.y;

      this.mouseOldPosition = { x, y };
    },
    getCanvasNowPosition(clientX, clientY) {
      // 取得canvas跟視窗的距離(ex: y=80 因為導覽列的高度為80)
      const domRect = this.canvasContext.canvas.getBoundingClientRect();
      const x = clientX - domRect.x;
      const y = clientY - domRect.y;
      return { x, y };
    },
    setTempCanvas() {
      const { canvas } = this.canvasContext;
      // 整個canvas暫存，目前畫布的都複製起來
      this.tempCanvas = this.canvasContext.getImageData(0, 0, canvas.width, canvas.height);
    },
    onCanvasMouseDown() {
      this.isMouseDown = true;
      this.isOpenColorWheel = false;
      this.setTempCanvas();
    },
    onCanvasMouseUp() {
      this.isMouseDown = false;
      this.saveCanvasToHistory();
    },
    saveCanvasToHistory() {
      // 把目前畫布轉成base64保存在陣列
      const { canvas } = this.canvasContext;
      const base64 = canvas.toDataURL();

      if (base64 === this.emptyCanvasBase) return;
      this.historyArr.push(base64);

      if (this.drawStep !== this.historyArr.length) {
        // 取得最新陣列跟目前位置中間要刪除的數量，去頭去尾要-1
        this.historyArr.splice(this.drawStep, this.historyArr.length - this.drawStep - 1);
      }

      this.drawStep = this.historyArr.length;

      // 復原後新增畫筆，會從當前的陣列往後加，之前因復原消失的紀錄清除。
    },
    undo() {
      const { canvas } = this.canvasContext;
      if (this.drawStep > 0) {
        this.drawStep -= 1;

        this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.src = this.historyArr[this.drawStep - 1] || this.emptyCanvasBase; // 取得前一個動作的值或全空的base64
        img.onload = () => {
          this.canvasContext.drawImage(img, 0, 0);
        };
      }
    },
    redo() {
      const { canvas } = this.canvasContext;
      if (this.drawStep < this.historyArr.length) {
        this.drawStep += 1;

        this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.src = this.historyArr[this.drawStep - 1];// 取得後一個動作的值
        img.onload = () => {
          this.canvasContext.drawImage(img, 0, 0);
        };
      }
    },
    saveCanvasToImage() {
      const { canvas } = this.canvasContext;
      this.currentCanvasBase64 = canvas.toDataURL();
    },
  },
};
</script>

<style scoped src="@/css/Paint.css">
