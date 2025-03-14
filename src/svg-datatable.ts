// src/svg-datatable.ts

/**
 * 数据列的配置接口
 * @interface
 */
interface Column {
  /** 列标题，显示在表头 */
  title?: string;
  /** 数据字段名，用于映射数据 */
  field?: string;
  /** 列宽度（像素），默认为 100 */
  width?: number;
  /** 自定义单元格渲染函数 */
  renderer?: (value: any, row: RowData, rowIndex: number, colIndex: number) => string;
}

/**
 * 行数据接口，键值对形式
 * @interface
 */
interface RowData {
  /** 任意键值对，字段名对应列的 field */
  [key: string]: any;
}

/**
 * SVGDataTable 的配置选项
 * @interface
 */
interface Options {
  /** 表格宽度（像素），默认 800 */
  width?: number;
  /** 表格高度（像素），默认 400 */
  height?: number;
  /** 行高（像素），默认 30 */
  rowHeight?: number;
  /** 表头高度（像素），默认 40 */
  headerHeight?: number;
  /** 字体大小（像素），默认 12 */
  fontSize?: number;
  /** 列定义数组 */
  columns?: Column[];
  /** 数据数组 */
  data?: RowData[];
  /** 固定列数量，默认 0 */
  fixedColumns?: number;
  /** 是否固定表头，默认 true */
  fixedHeader?: boolean;
  /** 水平滚动位置，默认 0 */
  scrollX?: number;
  /** 垂直滚动位置，默认 0 */
  scrollY?: number;
  /** 启用虚拟滚动的行数阈值，默认 50 */
  virtualThreshold?: number;
  /** 缓冲区大小（行数），默认 10 */
  bufferSize?: number;
  /** 渲染防抖时间（毫秒），默认 10 */
  debounceRender?: number;
  /** 是否启用调试模式，默认 false */
  debug?: boolean;
  /** 是否启用水平虚拟化，默认基于列数自动判断 */
  horizontalVirtualization?: boolean;
}

/**
 * 单元格位置接口
 * @interface
 */
interface CellPosition {
  /** 行索引 */
  rowIndex: number;
  /** 列索引 */
  colIndex: number;
}

/**
 * SVGDataTable 是一个基于 SVG 的高性能表格组件，支持虚拟滚动、单元格选择和数据复制。
 * 适用于大规模数据展示，提供固定列、表头、滚动和自定义渲染等功能。
 * @example
 * const table = new SVGDataTable('#app', {
 *   columns: [{ title: 'ID', field: 'id', width: 100 }],
 *   data: [{ id: 1 }],
 *   fixedColumns: 1
 * });
 */
class SVGDataTable {
  /** 表格容器元素 */
  private container: HTMLElement;
  /** 配置选项，带有默认值 */
  private options: Required<Options>;
  /** SVG 命名空间 */
  private svgNS: string = "http://www.w3.org/2000/svg";
  /** SVG 根元素 */
  private svg: SVGSVGElement;
  /** SVG 定义元素，用于渐变和剪切路径 */
  private defs: SVGDefsElement;
  /** 当前可见的行数据 */
  private visibleRows: RowData[] = [];
  /** 可见行的起始索引 */
  private visibleRowsStart: number = 0;
  /** 可见行的结束索引 */
  private visibleRowsEnd: number = 0;
  /** 表格总宽度 */
  private totalWidth: number = 0;
  /** 表格总高度 */
  private totalHeight: number = 0;
  /** 固定列的总宽度 */
  private fixedColumnsWidth: number = 0;
  /** 可滚动区域的宽度 */
  private scrollableWidth: number = 0;
  /** 可滚动区域的高度 */
  private scrollableHeight: number = 0;
  /** 最大水平滚动距离 */
  private maxScrollX: number = 0;
  /** 最大垂直滚动距离 */
  private maxScrollY: number = 0;
  /** 渲染防抖定时器 ID */
  private renderTimer: number | null = null;
  /** 滚轮事件处理函数 */
  private wheelHandler: (e: WheelEvent) => void;
  /** 调试信息文本元素 */
  private debugInfo?: SVGTextElement;
  /** 背景图层组 */
  private backgroundGroup!: SVGGElement;
  /** 内容图层组 */
  private contentGroup!: SVGGElement;
  /** 固定列图层组 */
  private fixedColumnsGroup?: SVGGElement;
  /** 表头图层组 */
  private headerGroup!: SVGGElement;
  /** 固定表头图层组 */
  private fixedHeaderGroup?: SVGGElement;
  /** 阴影图层组 */
  private shadowGroup!: SVGGElement;
  /** 内容容器组 */
  private contentContainer?: SVGGElement;
  /** 固定列容器组 */
  private fixedColumnsContainer?: SVGGElement;
  /** 表头容器组 */
  private headerContainer?: SVGGElement;
  /** 容器大小监听器 */
  private resizeObserver?: ResizeObserver;
  /** 触摸起始 X 坐标 */
  private touchStartX: number = 0;
  /** 触摸起始 Y 坐标 */
  private touchStartY: number = 0;
  /** 触摸时的初始 scrollX */
  private touchStartScrollX: number = 0;
  /** 触摸时的初始 scrollY */
  private touchStartScrollY: number = 0;
  /** 当前高亮的行索引 */
  private highlightedRow?: number;
  /** 动画帧 ID */
  private rafId?: number;
  /** 选中的单元格集合 */
  private selectedCells: Set<string> = new Set();
  /** 选择起始单元格 */
  private startCell: CellPosition | null = null;
  /** 是否正在拖动选择 */
  private isDragging: boolean = false;

  /**
   * 创建 SVGDataTable 实例
   * @param container 表格容器，可以是选择器字符串或 HTMLElement
   * @param options 配置选项，详见 {@link Options}
   * @throws {Error} 如果容器未找到则抛出错误
   */
  constructor(container: string | HTMLElement, options: Options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) as HTMLElement : container;
    if (!this.container) throw new Error('Container not found');

    this.options = {
      width: options.width || 800,
      height: options.height || 400,
      rowHeight: options.rowHeight || 30,
      headerHeight: options.headerHeight || 40,
      fontSize: options.fontSize || 12,
      columns: options.columns || [],
      data: options.data || [],
      fixedColumns: options.fixedColumns || 0,
      fixedHeader: options.fixedHeader !== false,
      scrollX: options.scrollX || 0,
      scrollY: options.scrollY || 0,
      virtualThreshold: options.virtualThreshold || 50,
      bufferSize: options.bufferSize || 10,
      debounceRender: options.debounceRender || 10,
      debug: options.debug || false,
      horizontalVirtualization: options.horizontalVirtualization !== false && (options.columns?.length || 0) > 20,
    };

    this.wheelHandler = this.handleWheel.bind(this);
    this.svg = document.createElementNS(this.svgNS, "svg") as SVGSVGElement;
    this.defs = document.createElementNS(this.svgNS, "defs") as SVGDefsElement;

    this.init();
  }

  /**
   * 初始化表格，包括尺寸计算、SVG 结构创建和事件绑定
   * @private
   */
  private init(): void {
    this.calculateDimensions();
    this.svg.setAttribute("width", this.options.width.toString());
    this.svg.setAttribute("height", this.options.height.toString());
    this.svg.setAttribute("class", "svg-datatable");
    this.container.appendChild(this.svg);

    this.svg.appendChild(this.defs);
    this.createShadowGradients();
    this.createClipPaths();
    this.createGroups();
    this.render();
    this.setupEventHandlers();
    this.setupCellSelectionHandlers();
    this.setupCopyHandler();

    if (this.options.debug) {
      this.debugInfo = document.createElementNS(this.svgNS, "text") as SVGTextElement;
      this.debugInfo.setAttribute("x", "10");
      this.debugInfo.setAttribute("y", (this.options.height - 10).toString());
      this.debugInfo.setAttribute("font-size", "10");
      this.debugInfo.setAttribute("fill", "#666");
      this.svg.appendChild(this.debugInfo);
    }
  }

  /**
   * 计算表格的各种尺寸参数，包括总宽高、可滚动区域等
   * @private
   */
  private calculateDimensions(): void {
    this.totalWidth = this.options.columns.reduce((sum, col) => sum + (col.width || 100), 0);
    this.totalHeight = this.options.rowHeight * this.options.data.length + this.options.headerHeight;
    this.fixedColumnsWidth = 0;
    for (let i = 0; i < this.options.fixedColumns && i < this.options.columns.length; i++) {
      this.fixedColumnsWidth += this.options.columns[i].width || 100;
    }
    this.scrollableWidth = this.options.width - this.fixedColumnsWidth;
    this.scrollableHeight = this.options.height - this.options.headerHeight;
    this.maxScrollX = Math.max(0, this.totalWidth - this.fixedColumnsWidth - this.scrollableWidth);
    this.maxScrollY = Math.max(0, this.totalHeight - this.options.headerHeight - this.scrollableHeight);
    if (this.totalWidth <= this.options.width) this.maxScrollX = 0;
    if (this.totalHeight <= this.options.height) this.maxScrollY = 0;
  }

  /**
   * 创建阴影渐变，用于固定列和表头的视觉效果
   * @private
   */
  private createShadowGradients(): void {
    const hGradient = document.createElementNS(this.svgNS, "linearGradient") as SVGLinearGradientElement;
    hGradient.setAttribute("id", "shadow-gradient-h");
    hGradient.setAttribute("x1", "0%");
    hGradient.setAttribute("y1", "0%");
    hGradient.setAttribute("x2", "100%");
    hGradient.setAttribute("y2", "0%");
    const hStop1 = document.createElementNS(this.svgNS, "stop") as SVGStopElement;
    hStop1.setAttribute("offset", "0%");
    hStop1.setAttribute("stop-color", "rgba(0,0,0,0.3)");
    hStop1.setAttribute("stop-opacity", "1");
    const hStop2 = document.createElementNS(this.svgNS, "stop") as SVGStopElement;
    hStop2.setAttribute("offset", "100%");
    hStop2.setAttribute("stop-color", "rgba(0,0,0,0)");
    hStop2.setAttribute("stop-opacity", "0");
    hGradient.appendChild(hStop1);
    hGradient.appendChild(hStop2);
    this.defs.appendChild(hGradient);

    const vGradient = document.createElementNS(this.svgNS, "linearGradient") as SVGLinearGradientElement;
    vGradient.setAttribute("id", "shadow-gradient-v");
    vGradient.setAttribute("x1", "0%");
    vGradient.setAttribute("y1", "0%");
    vGradient.setAttribute("x2", "0%");
    vGradient.setAttribute("y2", "100%");
    const vStop1 = document.createElementNS(this.svgNS, "stop") as SVGStopElement;
    vStop1.setAttribute("offset", "0%");
    vStop1.setAttribute("stop-color", "rgba(0,0,0,0.3)");
    vStop1.setAttribute("stop-opacity", "1");
    const vStop2 = document.createElementNS(this.svgNS, "stop") as SVGStopElement;
    vStop2.setAttribute("offset", "100%");
    vStop2.setAttribute("stop-color", "rgba(0,0,0,0)");
    vStop2.setAttribute("stop-opacity", "0");
    vGradient.appendChild(vStop1);
    vGradient.appendChild(vStop2);
    this.defs.appendChild(vGradient);
  }

  /**
   * 创建剪切路径，用于限制内容显示区域
   * @private
   */
  private createClipPaths(): void {
    this.createClipPath("content-clip", this.fixedColumnsWidth, this.options.headerHeight, this.scrollableWidth, this.scrollableHeight);
    if (this.options.fixedColumns > 0) {
      this.createClipPath("fixed-columns-clip", 0, this.options.headerHeight, this.fixedColumnsWidth, this.scrollableHeight);
      this.createClipPath("fixed-header-clip", 0, 0, this.fixedColumnsWidth, this.options.headerHeight);
    }
    this.createClipPath("header-clip", this.fixedColumnsWidth, 0, this.scrollableWidth, this.options.headerHeight);
  }

  /**
   * 创建单个剪切路径
   * @param id 剪切路径的 ID
   * @param x X 坐标
   * @param y Y 坐标
   * @param width 宽度
   * @param height 高度
   * @private
   */
  private createClipPath(id: string, x: number, y: number, width: number, height: number): void {
    const clipPath = document.createElementNS(this.svgNS, "clipPath") as SVGClipPathElement;
    clipPath.setAttribute("id", id);
    const rect = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
    rect.setAttribute("x", x.toString());
    rect.setAttribute("y", y.toString());
    rect.setAttribute("width", width.toString());
    rect.setAttribute("height", height.toString());
    clipPath.appendChild(rect);
    this.defs.appendChild(clipPath);
  }

  /**
   * 创建 SVG 图层组，包括背景、内容、固定列等
   * @private
   */
  private createGroups(): void {
    this.backgroundGroup = document.createElementNS(this.svgNS, "g") as SVGGElement;
    this.backgroundGroup.setAttribute("class", "datatable-background");
    this.svg.appendChild(this.backgroundGroup);

    this.contentGroup = document.createElementNS(this.svgNS, "g") as SVGGElement;
    this.contentGroup.setAttribute("clip-path", "url(#content-clip)");
    this.contentGroup.setAttribute("class", "datatable-content");
    this.svg.appendChild(this.contentGroup);

    if (this.options.fixedColumns > 0) {
      this.fixedColumnsGroup = document.createElementNS(this.svgNS, "g") as SVGGElement;
      this.fixedColumnsGroup.setAttribute("clip-path", "url(#fixed-columns-clip)");
      this.fixedColumnsGroup.setAttribute("class", "datatable-fixed-columns");
      this.svg.appendChild(this.fixedColumnsGroup);
    }

    this.headerGroup = document.createElementNS(this.svgNS, "g") as SVGGElement;
    this.headerGroup.setAttribute("clip-path", "url(#header-clip)");
    this.headerGroup.setAttribute("class", "datatable-header");
    this.svg.appendChild(this.headerGroup);

    if (this.options.fixedColumns > 0) {
      this.fixedHeaderGroup = document.createElementNS(this.svgNS, "g") as SVGGElement;
      this.fixedHeaderGroup.setAttribute("clip-path", "url(#fixed-header-clip)");
      this.fixedHeaderGroup.setAttribute("class", "datatable-fixed-header");
      this.svg.appendChild(this.fixedHeaderGroup);
    }

    this.shadowGroup = document.createElementNS(this.svgNS, "g") as SVGGElement;
    this.shadowGroup.setAttribute("class", "datatable-shadows");
    this.svg.appendChild(this.shadowGroup);
  }

  /**
   * 设置事件监听器，包括滚轮、触摸和窗口大小调整
   * @private
   */
  private setupEventHandlers(): void {
    this.container.addEventListener('wheel', this.wheelHandler, { passive: false });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
  }

  /**
   * 处理容器大小变化，调整表格尺寸并重新渲染
   * @private
   */
  private handleResize(): void {
    const rect = this.svg.getBoundingClientRect();
    if (rect.width !== this.options.width || rect.height !== this.options.height) {
      this.options.width = rect.width;
      this.options.height = rect.height;
      this.calculateDimensions();
      this.svg.setAttribute("width", this.options.width.toString());
      this.svg.setAttribute("height", this.options.height.toString());
      this.defs.innerHTML = '';
      this.createShadowGradients();
      this.createClipPaths();
      this.render();
    }
  }

  /**
   * 处理触摸开始事件，记录起始位置
   * @param e 触摸事件
   * @private
   */
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartScrollX = this.options.scrollX;
    this.touchStartScrollY = this.options.scrollY;
  }

  /**
   * 处理触摸移动事件，更新滚动位置
   * @param e 触摸事件
   * @private
   */
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = this.touchStartX - touch.clientX;
      const deltaY = this.touchStartY - touch.clientY;
      this.scroll(this.touchStartScrollX + deltaX, this.touchStartScrollY + deltaY);
    }
  }

  /**
   * 处理滚轮事件，调整滚动位置
   * @param e 滚轮事件
   * @private
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    let deltaX = e.deltaX;
    let deltaY = e.deltaY;
    if (e.shiftKey) {
      deltaX += deltaY;
      deltaY = 0;
    }
    const speedFactor = e.ctrlKey ? 5 : 1;
    this.scroll(this.options.scrollX + deltaX * speedFactor, this.options.scrollY + deltaY * speedFactor);
  }

  /**
   * 计算当前可见的列索引（水平虚拟化）
   * @returns 可见列的索引数组
   * @private
   */
  private calculateVisibleColumns(): number[] {
    const startX = this.options.scrollX;
    const endX = startX + this.scrollableWidth;
    const visibleColumnIndices: number[] = [];
    const bufferWidth = this.scrollableWidth * 0.5;
    const bufferedStartX = Math.max(0, startX - bufferWidth);
    const bufferedEndX = Math.min(this.totalWidth, endX + bufferWidth);

    let accumulatedWidth = this.fixedColumnsWidth;
    for (let i = this.options.fixedColumns; i < this.options.columns.length; i++) {
      const colWidth = this.options.columns[i].width || 100;
      const colStart = accumulatedWidth;
      const colEnd = colStart + colWidth;
      if (colEnd > bufferedStartX && colStart < bufferedEndX) {
        visibleColumnIndices.push(i);
      }
      accumulatedWidth += colWidth;
    }
    return visibleColumnIndices;
  }

  /**
   * 执行滚动操作，更新位置并触发渲染
   * @param scrollX 目标水平滚动位置
   * @param scrollY 目标垂直滚动位置
   * @private
   */
  private scroll(scrollX: number, scrollY: number): void {
    scrollX = Math.max(0, Math.min(scrollX, this.maxScrollX));
    scrollY = Math.max(0, Math.min(scrollY, this.maxScrollY));
    if (this.options.scrollX === scrollX && this.options.scrollY === scrollY) return;

    const deltaX = Math.abs(scrollX - this.options.scrollX);
    this.options.scrollX = scrollX;
    this.options.scrollY = scrollY;
    this.updateScrollPosition();

    const largeHorizontalScroll = deltaX > (this.scrollableWidth * 0.3);
    if (largeHorizontalScroll) {
      if (this.renderTimer) clearTimeout(this.renderTimer);
      this.renderTimer = null;
      this.render();
    } else {
      if (this.renderTimer) clearTimeout(this.renderTimer);
      this.renderTimer = setTimeout(() => this.render(), this.options.debounceRender);
    }
  }

  /**
   * 更新滚动位置，应用变换
   * @private
   */
  private updateScrollPosition(): void {
    if (this.contentContainer) {
      this.contentContainer.setAttribute('transform', `translate(${-this.options.scrollX}, ${-this.options.scrollY})`);
    }
    if (this.headerContainer) {
      this.headerContainer.setAttribute('transform', `translate(${-this.options.scrollX}, 0)`);
    }
    if (this.fixedColumnsContainer) {
      this.fixedColumnsContainer.setAttribute('transform', `translate(0, ${-this.options.scrollY})`);
    }
    if (this.options.debug && this.debugInfo) {
      this.debugInfo.textContent = `Scroll: ${Math.round(this.options.scrollX)}, ${Math.round(this.options.scrollY)} | Rows: ${this.visibleRowsStart}-${this.visibleRowsEnd} (${this.visibleRows.length}) | Selected: ${this.selectedCells.size}`;
    }
  }

  /**
   * 滚动到指定行
   * @param rowIndex 目标行索引
   */
  public scrollToRow(rowIndex: number): void {
    const y = rowIndex * this.options.rowHeight;
    this.scroll(this.options.scrollX, y);
  }

  /**
   * 滚动到指定单元格
   * @param rowIndex 目标行索引
   * @param colIndex 目标列索引
   */
  public scrollToCell(rowIndex: number, colIndex: number): void {
    const y = rowIndex * this.options.rowHeight;
    let x = 0;
    for (let i = 0; i < colIndex && i < this.options.columns.length; i++) {
      if (i >= this.options.fixedColumns) x += this.options.columns[i].width || 100;
    }
    this.scroll(x, y);
  }

  /**
   * 计算当前可见的行数据（垂直虚拟化）
   * @private
   */
  private calculateVisibleRows(): void {
    const startY = this.options.scrollY;
    const endY = startY + this.scrollableHeight;
    let start = Math.floor(startY / this.options.rowHeight);
    let end = Math.ceil(endY / this.options.rowHeight);
    start = Math.max(0, start - this.options.bufferSize);
    end = Math.min(this.options.data.length, end + this.options.bufferSize);
    if (this.options.data.length <= this.options.virtualThreshold) {
      start = 0;
      end = this.options.data.length;
    }
    this.visibleRowsStart = start;
    this.visibleRowsEnd = end;
    this.visibleRows = this.options.data.slice(start, end);
  }

  /**
   * 渲染表格，包括内容、固定列、表头和阴影
   */
  public render(): void {
    this.calculateVisibleRows();
    this.contentGroup.innerHTML = '';
    if (this.fixedColumnsGroup) this.fixedColumnsGroup.innerHTML = '';
    this.headerGroup.innerHTML = '';
    if (this.fixedHeaderGroup) this.fixedHeaderGroup.innerHTML = '';
    this.shadowGroup.innerHTML = '';

    this.renderContent();
    if (this.options.fixedColumns > 0) this.renderFixedColumns();
    this.renderHeader();
    if (this.options.fixedColumns > 0) this.renderFixedHeader();
    this.renderShadows();

    if (this.options.debug && this.debugInfo) {
      this.debugInfo.textContent = `Scroll: ${Math.round(this.options.scrollX)}, ${Math.round(this.options.scrollY)} | Rows: ${this.visibleRowsStart}-${this.visibleRowsEnd} (${this.visibleRows.length}) | Selected: ${this.selectedCells.size}`;
    }
  }

  /**
   * 渲染表格内容区域
   * @private
   */
  private renderContent(): void {
    const contentContainer = this.contentContainer = document.createElementNS(this.svgNS, "g") as SVGGElement;
    this.contentContainer.setAttribute("transform", `translate(${-this.options.scrollX}, ${-this.options.scrollY})`);
    this.contentGroup.appendChild(this.contentContainer);

    this.visibleRows.forEach((row, localIndex) => {
      const rowIndex = localIndex + this.visibleRowsStart;
      const yPos = rowIndex * this.options.rowHeight + this.options.headerHeight;

      const rowBg = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
      rowBg.setAttribute("x", this.fixedColumnsWidth.toString());
      rowBg.setAttribute("y", yPos.toString());
      rowBg.setAttribute("width", (this.totalWidth - this.fixedColumnsWidth).toString());
      rowBg.setAttribute("height", this.options.rowHeight.toString());
      rowBg.setAttribute("fill", rowIndex % 2 === 0 ? "#ffffff" : "#f9f9f9");
      contentContainer.appendChild(rowBg);

      if (this.options.horizontalVirtualization) {
        const visibleColumnIndices = this.calculateVisibleColumns();
        visibleColumnIndices.forEach(colIndex => {
          this.renderCell(row, rowIndex, colIndex, yPos, this.contentContainer!);
        });
      } else {
        for (let colIndex = this.options.fixedColumns; colIndex < this.options.columns.length; colIndex++) {
          this.renderCell(row, rowIndex, colIndex, yPos, this.contentContainer!);
        }
      }
    });
  }

  /**
   * 渲染单个单元格
   * @param row 行数据
   * @param rowIndex 行索引
   * @param colIndex 列索引
   * @param yPos Y 坐标
   * @param container 渲染目标容器
   * @private
   */
  private renderCell(row: RowData, rowIndex: number, colIndex: number, yPos: number, container: SVGGElement): void {
    const column = this.options.columns[colIndex];
    const width = column.width || 100;
    let xPos = colIndex < this.options.fixedColumns ? 0 : this.fixedColumnsWidth;
    for (let i = (colIndex < this.options.fixedColumns ? 0 : this.options.fixedColumns); i < colIndex; i++) {
      xPos += this.options.columns[i].width || 100;
    }

    const cellBorder = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
    cellBorder.setAttribute("x", xPos.toString());
    cellBorder.setAttribute("y", yPos.toString());
    cellBorder.setAttribute("width", width.toString());
    cellBorder.setAttribute("height", this.options.rowHeight.toString());
    cellBorder.setAttribute("fill", this.selectedCells.has(`${rowIndex}-${colIndex}`) ? "#cce5ff" : "transparent");
    cellBorder.setAttribute("stroke", "#e0e0e0");
    cellBorder.setAttribute("stroke-width", "0.5");
    cellBorder.setAttribute("data-row", rowIndex.toString());
    cellBorder.setAttribute("data-col", colIndex.toString());
    container.appendChild(cellBorder);

    const text = document.createElementNS(this.svgNS, "text") as SVGTextElement;
    text.setAttribute("x", (xPos + 5).toString());
    text.setAttribute("y", (yPos + this.options.rowHeight / 2).toString());
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-size", this.options.fontSize.toString());
    const field = column.field || `field${colIndex}`;
    const cellValue = row[field] !== undefined ? row[field] : '';
    text.textContent = column.renderer ? column.renderer(cellValue, row, rowIndex, colIndex) : cellValue.toString();
    container.appendChild(text);
  }

  /**
   * 渲染固定列区域
   * @private
   */
  private renderFixedColumns(): void {
    if (this.options.fixedColumns <= 0) return;
    const fixedColumnsContainer = this.fixedColumnsContainer = document.createElementNS(this.svgNS, "g") as SVGGElement;
    this.fixedColumnsContainer.setAttribute("transform", `translate(0, ${-this.options.scrollY})`);
    this.fixedColumnsGroup!.appendChild(this.fixedColumnsContainer);

    this.visibleRows.forEach((row, localIndex) => {
      const rowIndex = localIndex + this.visibleRowsStart;
      const yPos = rowIndex * this.options.rowHeight + this.options.headerHeight;

      const rowBg = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
      rowBg.setAttribute("x", "0");
      rowBg.setAttribute("y", yPos.toString());
      rowBg.setAttribute("width", this.fixedColumnsWidth.toString());
      rowBg.setAttribute("height", this.options.rowHeight.toString());
      rowBg.setAttribute("fill", rowIndex % 2 === 0 ? "#f0f8ff" : "#e6f7ff");
      rowBg.setAttribute("stroke", "#d0d0d0");
      rowBg.setAttribute("stroke-width", "0.5");
      fixedColumnsContainer.appendChild(rowBg);

      let xPos = 0;
      for (let colIndex = 0; colIndex < this.options.fixedColumns && colIndex < this.options.columns.length; colIndex++) {
        const column = this.options.columns[colIndex];
        const width = column.width || 100;
        this.renderCell(row, rowIndex, colIndex, yPos, fixedColumnsContainer);
        xPos += width;
      }
    });
  }

  /**
   * 渲染表头区域
   * @private
   */
  private renderHeader(): void {
    const headerBg = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
    headerBg.setAttribute("x", this.fixedColumnsWidth.toString());
    headerBg.setAttribute("y", "0");
    headerBg.setAttribute("width", this.scrollableWidth.toString());
    headerBg.setAttribute("height", this.options.headerHeight.toString());
    headerBg.setAttribute("fill", "#f5f5f5");
    headerBg.setAttribute("stroke", "#d0d0d0");
    headerBg.setAttribute("stroke-width", "0.5");
    this.headerGroup.appendChild(headerBg);

    this.headerContainer = document.createElementNS(this.svgNS, "g") as SVGGElement;
    this.headerContainer.setAttribute("transform", `translate(${-this.options.scrollX}, 0)`);
    this.headerGroup.appendChild(this.headerContainer);

    const fullHeaderBg = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
    fullHeaderBg.setAttribute("x", this.fixedColumnsWidth.toString());
    fullHeaderBg.setAttribute("y", "0");
    fullHeaderBg.setAttribute("width", (this.totalWidth - this.fixedColumnsWidth).toString());
    fullHeaderBg.setAttribute("height", this.options.headerHeight.toString());
    fullHeaderBg.setAttribute("fill", "#f5f5f5");
    this.headerContainer.appendChild(fullHeaderBg);

    if (this.options.horizontalVirtualization) {
      const visibleColumnIndices = this.calculateVisibleColumns();
      visibleColumnIndices.forEach(colIndex => this.renderHeaderCell(colIndex));
    } else {
      for (let colIndex = this.options.fixedColumns; colIndex < this.options.columns.length; colIndex++) {
        this.renderHeaderCell(colIndex);
      }
    }
  }

  /**
   * 渲染单个表头单元格
   * @param colIndex 列索引
   * @private
   */
  private renderHeaderCell(colIndex: number): void {
    const column = this.options.columns[colIndex];
    const width = column.width || 100;
    let xPos = this.fixedColumnsWidth;
    for (let i = this.options.fixedColumns; i < colIndex; i++) {
      xPos += this.options.columns[i].width || 100;
    }

    const colBorder = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
    colBorder.setAttribute("x", xPos.toString());
    colBorder.setAttribute("y", "0");
    colBorder.setAttribute("width", width.toString());
    colBorder.setAttribute("height", this.options.headerHeight.toString());
    colBorder.setAttribute("fill", "transparent");
    colBorder.setAttribute("stroke", "#d0d0d0");
    colBorder.setAttribute("stroke-width", "0.5");
    this.headerContainer!.appendChild(colBorder);

    const text = document.createElementNS(this.svgNS, "text") as SVGTextElement;
    text.setAttribute("x", (xPos + width / 2).toString());
    text.setAttribute("y", (this.options.headerHeight / 2).toString());
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-size", this.options.fontSize.toString());
    text.setAttribute("font-weight", "bold");
    text.textContent = column.title || `Column ${colIndex + 1}`;
    this.headerContainer!.appendChild(text);
  }

  /**
   * 渲染固定表头区域
   * @private
   */
  private renderFixedHeader(): void {
    if (this.options.fixedColumns <= 0) return;

    const fixedHeaderBg = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
    fixedHeaderBg.setAttribute("x", "0");
    fixedHeaderBg.setAttribute("y", "0");
    fixedHeaderBg.setAttribute("width", this.fixedColumnsWidth.toString());
    fixedHeaderBg.setAttribute("height", this.options.headerHeight.toString());
    fixedHeaderBg.setAttribute("fill", "#e6f7ff");
    fixedHeaderBg.setAttribute("stroke", "#d0d0d0");
    fixedHeaderBg.setAttribute("stroke-width", "0.5");
    this.fixedHeaderGroup!.appendChild(fixedHeaderBg);

    let xPos = 0;
    for (let colIndex = 0; colIndex < this.options.fixedColumns && colIndex < this.options.columns.length; colIndex++) {
      const column = this.options.columns[colIndex];
      const width = column.width || 100;

      const colBg = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
      colBg.setAttribute("x", xPos.toString());
      colBg.setAttribute("y", "0");
      colBg.setAttribute("width", width.toString());
      colBg.setAttribute("height", this.options.headerHeight.toString());
      colBg.setAttribute("fill", "#e6f7ff");
      colBg.setAttribute("stroke", "#d0d0d0");
      colBg.setAttribute("stroke-width", "0.5");
      this.fixedHeaderGroup!.appendChild(colBg);

      const text = document.createElementNS(this.svgNS, "text") as SVGTextElement;
      text.setAttribute("x", (xPos + width / 2).toString());
      text.setAttribute("y", (this.options.headerHeight / 2).toString());
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-size", this.options.fontSize.toString());
      text.setAttribute("font-weight", "bold");
      text.textContent = column.title || `Column ${colIndex + 1}`;
      this.fixedHeaderGroup!.appendChild(text);

      xPos += width;
    }
  }

  /**
   * 渲染固定列和表头的阴影效果
   * @private
   */
  private renderShadows(): void {
    if (this.options.fixedColumns > 0) {
      const columnShadow = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
      columnShadow.setAttribute("x", this.fixedColumnsWidth.toString());
      columnShadow.setAttribute("y", "0");
      columnShadow.setAttribute("width", "5");
      columnShadow.setAttribute("height", this.options.height.toString());
      columnShadow.setAttribute("fill", "url(#shadow-gradient-h)");
      columnShadow.setAttribute("pointer-events", "none");
      this.shadowGroup.appendChild(columnShadow);
    }

    const headerShadow = document.createElementNS(this.svgNS, "rect") as SVGRectElement;
    headerShadow.setAttribute("x", "0");
    headerShadow.setAttribute("y", this.options.headerHeight.toString());
    headerShadow.setAttribute("width", this.options.width.toString());
    headerShadow.setAttribute("height", "5");
    headerShadow.setAttribute("fill", "url(#shadow-gradient-v)");
    headerShadow.setAttribute("pointer-events", "none");
    this.shadowGroup.appendChild(headerShadow);
  }

  /**
   * 更新表格数据并重新渲染
   * @param data 新的数据数组
   */
  public updateData(data: RowData[]): void {
    this.options.data = data || [];
    this.calculateDimensions();
    this.options.scrollX = Math.min(this.options.scrollX, this.maxScrollX);
    this.options.scrollY = Math.min(this.options.scrollY, this.maxScrollY);
    this.render();
  }

  /**
   * 更新列定义并重新渲染
   * @param columns 新的列定义数组
   */
  public updateColumns(columns: Column[]): void {
    this.options.columns = columns || [];
    this.calculateDimensions();
    this.options.scrollX = Math.min(this.options.scrollX, this.maxScrollX);
    this.options.scrollY = Math.min(this.options.scrollY, this.maxScrollY);
    this.render();
  }

  /**
   * 设置固定列数量并重新初始化
   * @param count 固定列的数量
   */
  public setFixedColumns(count: number): void {
    count = Math.min(count, this.options.columns.length);
    if (this.options.fixedColumns !== count) {
      this.options.fixedColumns = count;
      this.destroy();
      this.init();
    }
  }

  /**
   * 获取 SVG 元素
   * @returns SVG 根元素
   */
  public getElement(): SVGSVGElement {
    return this.svg;
  }

  /**
   * 销毁表格，移除事件监听器并清理 DOM
   */
  public destroy(): void {
    this.container.removeEventListener('wheel', this.wheelHandler);
    this.container.removeEventListener('touchstart', this.handleTouchStart);
    this.container.removeEventListener('touchmove', this.handleTouchMove);
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.container.innerHTML = '';
    if (this.renderTimer) clearTimeout(this.renderTimer);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  /**
   * 使用 requestAnimationFrame 渲染表格
   */
  public renderWithRAF(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.render());
  }

  /**
   * 更新指定单元格的值并重新渲染
   * @param updates 单元格更新数组
   */
  public updateCells(updates: { row: number; col: number; value: any }[]): void {
    let needsRender = false;
    updates.forEach(update => {
      const { row, col, value } = update;
      if (row >= 0 && row < this.options.data.length && col >= 0 && col < this.options.columns.length) {
        const column = this.options.columns[col];
        const field = column.field || `field${col}`;
        this.options.data[row][field] = value;
        if (row >= this.visibleRowsStart && row < this.visibleRowsEnd) needsRender = true;
      }
    });
    if (needsRender) this.render();
  }

  /**
   * 高亮指定行
   * @param rowIndex 行索引，-1 表示取消高亮
   * @param color 高亮颜色，默认为 #FFFECC
   */
  public highlightRow(rowIndex: number, color: string = "#FFFECC"): void {
    if (this.highlightedRow !== undefined) {
      const elements = this.svg.querySelectorAll(`.highlight-row-${this.highlightedRow}`);
      elements.forEach(el => {
        el.setAttribute("fill", el.getAttribute("data-original-fill") || "");
        el.classList.remove(`highlight-row-${this.highlightedRow}`);
      });
    }
    this.highlightedRow = rowIndex;
    if (rowIndex < 0) return;

    const yPos = rowIndex * this.options.rowHeight + this.options.headerHeight;
    const isVisible = rowIndex >= this.visibleRowsStart && rowIndex < this.visibleRowsEnd;
    if (!isVisible) {
      this.scrollToRow(rowIndex);
      return;
    }

    const mainRowBgs = this.contentContainer!.querySelectorAll(`rect[y="${yPos}"]`);
    mainRowBgs.forEach(el => {
      el.setAttribute("data-original-fill", el.getAttribute("fill") || "");
      el.setAttribute("fill", color);
      el.classList.add(`highlight-row-${rowIndex}`);
    });

    if (this.fixedColumnsContainer) {
      const fixedRowBgs = this.fixedColumnsContainer.querySelectorAll(`rect[y="${yPos}"]`);
      fixedRowBgs.forEach(el => {
        el.setAttribute("data-original-fill", el.getAttribute("fill") || "");
        el.setAttribute("fill", color);
        el.classList.add(`highlight-row-${rowIndex}`);
      });
    }
  }

  /**
   * 设置单元格选择事件监听器
   * @private
   */
  private setupCellSelectionHandlers(): void {
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * 根据屏幕坐标获取单元格位置
   * @param x X 坐标
   * @param y Y 坐标
   * @returns 单元格位置或 null
   * @private
   */
  private getCellFromPosition(x: number, y: number): CellPosition | null {
    const rect = this.svg.getBoundingClientRect();
    const adjustedY = y - rect.top + this.options.scrollY - this.options.headerHeight;
    const adjustedX = x - rect.left + this.options.scrollX;

    const rowIndex = Math.floor(adjustedY / this.options.rowHeight);
    if (rowIndex < 0 || rowIndex >= this.options.data.length) return null;

    let colIndex = -1;
    let accumulatedWidth = 0;
    for (let i = 0; i < this.options.columns.length; i++) {
      const colWidth = this.options.columns[i].width || 100;
      if (adjustedX >= accumulatedWidth && adjustedX < accumulatedWidth + colWidth) {
        colIndex = i;
        break;
      }
      accumulatedWidth += colWidth;
    }
    if (colIndex === -1) return null;

    return { rowIndex, colIndex };
  }

  /**
   * 选择指定范围的单元格并重新渲染
   * @param start 起始单元格
   * @param end 结束单元格
   * @private
   */
  private selectRange(start: CellPosition, end: CellPosition): void {
    this.selectedCells.clear();
    const minRow = Math.min(start.rowIndex, end.rowIndex);
    const maxRow = Math.max(start.rowIndex, end.rowIndex);
    const minCol = Math.min(start.colIndex, end.colIndex);
    const maxCol = Math.max(start.colIndex, end.colIndex);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        this.selectedCells.add(`${row}-${col}`);
      }
    }
    this.render();
  }

  /**
   * 处理鼠标按下事件，开始单元格选择
   * @param e 鼠标事件
   * @private
   */
  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // 只处理左键
    const cell = this.getCellFromPosition(e.clientX, e.clientY);
    if (!cell || e.clientY - this.svg.getBoundingClientRect().top < this.options.headerHeight) return;

    if (e.shiftKey && this.startCell) {
      this.selectRange(this.startCell, cell);
    } else {
      this.selectedCells.clear();
      this.selectedCells.add(`${cell.rowIndex}-${cell.colIndex}`);
      this.startCell = cell;
      this.isDragging = true;
      this.render();
    }
  }

  /**
   * 处理鼠标移动事件，更新选择范围
   * @param e 鼠标事件
   * @private
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.startCell) return;

    const cell = this.getCellFromPosition(e.clientX, e.clientY);
    if (cell) {
      this.selectRange(this.startCell, cell);
    }
  }

  /**
   * 处理鼠标松开事件，结束选择
   * @param e 鼠标事件
   * @private
   */
  private handleMouseUp(_e: MouseEvent): void {
    this.isDragging = false;
  }

  /**
   * 设置复制快捷键监听器
   * @private
   */
  private setupCopyHandler(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * 处理键盘事件，支持 Ctrl+C 和 Command+C 复制
   * @param e 键盘事件
   * @private
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && this.selectedCells.size > 0) {
      e.preventDefault();
      this.copySelectedCells();
    }
  };

  /**
   * 复制选中的单元格数据到剪贴板
   * @param includeHeaders 是否包含表头，默认为 true
   * @private
   */
  private copySelectedCells(includeHeaders: boolean = true): void {
    const selected = this.getSelectedCells();
    if (selected.length === 0) return;

    const rows = new Set<number>();
    const cols = new Set<number>();
    selected.forEach(cell => {
      rows.add(cell.rowIndex);
      cols.add(cell.colIndex);
    });
    const rowIndices = Array.from(rows).sort((a, b) => a - b);
    const colIndices = Array.from(cols).sort((a, b) => a - b);

    let copyData: string[][] = [];
    if (includeHeaders) {
      const headerRow = colIndices.map(colIndex => 
        this.options.columns[colIndex].title || `Column ${colIndex + 1}`
      );
      copyData.push(headerRow);
    }

    rowIndices.forEach(rowIndex => {
      const rowData = colIndices.map(colIndex => {
        const column = this.options.columns[colIndex];
        const field = column.field || `field${colIndex}`;
        const cellValue = this.options.data[rowIndex][field] !== undefined ? this.options.data[rowIndex][field] : '';
        return column.renderer ? column.renderer(cellValue, this.options.data[rowIndex], rowIndex, colIndex) : cellValue.toString();
      });
      copyData.push(rowData);
    });

    const text = copyData.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      if (this.options.debug) {
        console.log('Copied to clipboard:', text);
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  /**
   * 获取当前选中的单元格
   * @returns 包含行索引和列索引的单元格位置数组
   */
  public getSelectedCells(): CellPosition[] {
    return Array.from(this.selectedCells).map(key => {
      const [rowIndex, colIndex] = key.split('-').map(Number);
      return { rowIndex, colIndex };
    });
  }

  /**
   * 清除所有单元格选择并重新渲染
   */
  public clearSelection(): void {
    this.selectedCells.clear();
    this.startCell = null;
    this.render();
  }

  /**
   * 复制选中的单元格数据到剪贴板
   * @param includeHeaders 是否包含表头，默认为 true
   */
  public copy(includeHeaders: boolean = true): void {
    this.copySelectedCells(includeHeaders);
  }

  /**
   * 设置指定列的自定义渲染函数
   * @param columnIndex 列索引
   * @param renderer 渲染函数
   */
  public setCellRenderer(columnIndex: number, renderer: (value: any, row: RowData, rowIndex: number, colIndex: number) => string): void {
    if (columnIndex >= 0 && columnIndex < this.options.columns.length) {
      this.options.columns[columnIndex].renderer = renderer;
      this.render();
    }
  }

  /**
   * 导出表格为 SVG 字符串
   * @returns SVG 字符串
   */
  public exportSVG(): string {
    const exportSvg = this.svg.cloneNode(true) as SVGSVGElement;
    exportSvg.setAttribute("xmlns", this.svgNS);
    exportSvg.setAttribute("version", "1.1");
    return new XMLSerializer().serializeToString(exportSvg);
  }

  /**
   * 获取当前可见的数据行
   * @returns 可见的行数据数组
   */
  public getVisibleData(): RowData[] {
    return this.visibleRows;
  }

  /**
   * 获取所有数据
   * @returns 完整的行数据数组
   */
  public getData(): RowData[] {
    return this.options.data;
  }

  /**
   * 获取表格状态
   * @returns 包含滚动位置、可见行范围和尺寸信息的对象
   */
  public getState(): {
    scrollX: number;
    scrollY: number;
    visibleRowsRange: [number, number];
    fixedColumns: number;
    dimensions: {
      totalWidth: number;
      totalHeight: number;
      fixedColumnsWidth: number;
      scrollableWidth: number;
      scrollableHeight: number;
    };
  } {
    return {
      scrollX: this.options.scrollX,
      scrollY: this.options.scrollY,
      visibleRowsRange: [this.visibleRowsStart, this.visibleRowsEnd],
      fixedColumns: this.options.fixedColumns,
      dimensions: {
        totalWidth: this.totalWidth,
        totalHeight: this.totalHeight,
        fixedColumnsWidth: this.fixedColumnsWidth,
        scrollableWidth: this.scrollableWidth,
        scrollableHeight: this.scrollableHeight,
      },
    };
  }
}

export default SVGDataTable;