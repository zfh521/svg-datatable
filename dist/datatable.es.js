var m = Object.defineProperty;
var b = (u, t, e) => t in u ? m(u, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : u[t] = e;
var r = (u, t, e) => b(u, typeof t != "symbol" ? t + "" : t, e);
class C {
  constructor(t, e = {}) {
    // 容器元素
    r(this, "container");
    // 配置项
    r(this, "options");
    // SVG命名空间
    r(this, "svgNS", "http://www.w3.org/2000/svg");
    // SVG元素
    r(this, "svg");
    // 定义元素
    r(this, "defs");
    // 可见行数据
    r(this, "visibleRows", []);
    // 可见行起始索引
    r(this, "visibleRowsStart", 0);
    // 可见行结束索引
    r(this, "visibleRowsEnd", 0);
    // 总宽度
    r(this, "totalWidth", 0);
    // 总高度
    r(this, "totalHeight", 0);
    // 固定列宽度
    r(this, "fixedColumnsWidth", 0);
    // 可滚动宽度
    r(this, "scrollableWidth", 0);
    // 可滚动高度
    r(this, "scrollableHeight", 0);
    // 最大水平滚动距离
    r(this, "maxScrollX", 0);
    // 最大垂直滚动距离
    r(this, "maxScrollY", 0);
    // 渲染定时器
    r(this, "renderTimer", null);
    // 滚轮事件处理函数
    r(this, "wheelHandler");
    // 调试信息
    r(this, "debugInfo");
    // 背景组
    r(this, "backgroundGroup");
    // 内容组
    r(this, "contentGroup");
    // 固定列组
    r(this, "fixedColumnsGroup");
    // 表头组
    r(this, "headerGroup");
    // 固定表头组
    r(this, "fixedHeaderGroup");
    // 阴影组
    r(this, "shadowGroup");
    // 内容容器
    r(this, "contentContainer");
    // 固定列容器
    r(this, "fixedColumnsContainer");
    // 表头容器
    r(this, "headerContainer");
    // 尺寸观察者
    r(this, "resizeObserver");
    // 触摸开始X坐标
    r(this, "touchStartX", 0);
    // 触摸开始Y坐标
    r(this, "touchStartY", 0);
    // 触摸开始滚动X坐标
    r(this, "touchStartScrollX", 0);
    // 触摸开始滚动Y坐标
    r(this, "touchStartScrollY", 0);
    // 高亮行索引
    r(this, "highlightedRow");
    // 请求动画帧ID
    r(this, "rafId");
    // 单元格选择相关
    r(this, "selectedCells", /* @__PURE__ */ new Set());
    r(this, "startCell", null);
    r(this, "isDragging", !1);
    r(this, "handleKeyDown", (t) => {
      (t.ctrlKey || t.metaKey) && t.key === "c" && this.selectedCells.size > 0 && (t.preventDefault(), this.copySelectedCells());
    });
    var i;
    if (this.container = typeof t == "string" ? document.querySelector(t) : t, !this.container) throw new Error("Container not found");
    this.options = {
      width: e.width || 800,
      height: e.height || 400,
      rowHeight: e.rowHeight || 30,
      headerHeight: e.headerHeight || 40,
      fontSize: e.fontSize || 12,
      columns: e.columns || [],
      data: e.data || [],
      fixedColumns: e.fixedColumns || 0,
      fixedHeader: e.fixedHeader !== !1,
      scrollX: e.scrollX || 0,
      scrollY: e.scrollY || 0,
      virtualThreshold: e.virtualThreshold || 50,
      bufferSize: e.bufferSize || 10,
      debounceRender: e.debounceRender || 10,
      debug: e.debug || !1,
      horizontalVirtualization: e.horizontalVirtualization !== !1 && (((i = e.columns) == null ? void 0 : i.length) || 0) > 20
    }, this.wheelHandler = this.handleWheel.bind(this), this.svg = document.createElementNS(this.svgNS, "svg"), this.defs = document.createElementNS(this.svgNS, "defs"), this.init();
  }
  init() {
    this.calculateDimensions(), this.svg.setAttribute("width", this.options.width.toString()), this.svg.setAttribute("height", this.options.height.toString()), this.svg.setAttribute("class", "svg-datatable"), this.container.appendChild(this.svg), this.svg.appendChild(this.defs), this.createShadowGradients(), this.createClipPaths(), this.createGroups(), this.render(), this.setupEventHandlers(), this.setupCellSelectionHandlers(), this.setupCopyHandler(), this.options.debug && (this.debugInfo = document.createElementNS(this.svgNS, "text"), this.debugInfo.setAttribute("x", "10"), this.debugInfo.setAttribute("y", (this.options.height - 10).toString()), this.debugInfo.setAttribute("font-size", "10"), this.debugInfo.setAttribute("fill", "#666"), this.svg.appendChild(this.debugInfo));
  }
  calculateDimensions() {
    this.totalWidth = this.options.columns.reduce((t, e) => t + (e.width || 100), 0), this.totalHeight = this.options.rowHeight * this.options.data.length + this.options.headerHeight, this.fixedColumnsWidth = 0;
    for (let t = 0; t < this.options.fixedColumns && t < this.options.columns.length; t++)
      this.fixedColumnsWidth += this.options.columns[t].width || 100;
    this.scrollableWidth = this.options.width - this.fixedColumnsWidth, this.scrollableHeight = this.options.height - this.options.headerHeight, this.maxScrollX = Math.max(0, this.totalWidth - this.fixedColumnsWidth - this.scrollableWidth), this.maxScrollY = Math.max(0, this.totalHeight - this.options.headerHeight - this.scrollableHeight), this.totalWidth <= this.options.width && (this.maxScrollX = 0), this.totalHeight <= this.options.height && (this.maxScrollY = 0);
  }
  createShadowGradients() {
    const t = document.createElementNS(this.svgNS, "linearGradient");
    t.setAttribute("id", "shadow-gradient-h"), t.setAttribute("x1", "0%"), t.setAttribute("y1", "0%"), t.setAttribute("x2", "100%"), t.setAttribute("y2", "0%");
    const e = document.createElementNS(this.svgNS, "stop");
    e.setAttribute("offset", "0%"), e.setAttribute("stop-color", "rgba(0,0,0,0.3)"), e.setAttribute("stop-opacity", "1");
    const i = document.createElementNS(this.svgNS, "stop");
    i.setAttribute("offset", "100%"), i.setAttribute("stop-color", "rgba(0,0,0,0)"), i.setAttribute("stop-opacity", "0"), t.appendChild(e), t.appendChild(i), this.defs.appendChild(t);
    const o = document.createElementNS(this.svgNS, "linearGradient");
    o.setAttribute("id", "shadow-gradient-v"), o.setAttribute("x1", "0%"), o.setAttribute("y1", "0%"), o.setAttribute("x2", "0%"), o.setAttribute("y2", "100%");
    const h = document.createElementNS(this.svgNS, "stop");
    h.setAttribute("offset", "0%"), h.setAttribute("stop-color", "rgba(0,0,0,0.3)"), h.setAttribute("stop-opacity", "1");
    const s = document.createElementNS(this.svgNS, "stop");
    s.setAttribute("offset", "100%"), s.setAttribute("stop-color", "rgba(0,0,0,0)"), s.setAttribute("stop-opacity", "0"), o.appendChild(h), o.appendChild(s), this.defs.appendChild(o);
  }
  createClipPaths() {
    this.createClipPath("content-clip", this.fixedColumnsWidth, this.options.headerHeight, this.scrollableWidth, this.scrollableHeight), this.options.fixedColumns > 0 && (this.createClipPath("fixed-columns-clip", 0, this.options.headerHeight, this.fixedColumnsWidth, this.scrollableHeight), this.createClipPath("fixed-header-clip", 0, 0, this.fixedColumnsWidth, this.options.headerHeight)), this.createClipPath("header-clip", this.fixedColumnsWidth, 0, this.scrollableWidth, this.options.headerHeight);
  }
  createClipPath(t, e, i, o, h) {
    const s = document.createElementNS(this.svgNS, "clipPath");
    s.setAttribute("id", t);
    const n = document.createElementNS(this.svgNS, "rect");
    n.setAttribute("x", e.toString()), n.setAttribute("y", i.toString()), n.setAttribute("width", o.toString()), n.setAttribute("height", h.toString()), s.appendChild(n), this.defs.appendChild(s);
  }
  createGroups() {
    this.backgroundGroup = document.createElementNS(this.svgNS, "g"), this.backgroundGroup.setAttribute("class", "datatable-background"), this.svg.appendChild(this.backgroundGroup), this.contentGroup = document.createElementNS(this.svgNS, "g"), this.contentGroup.setAttribute("clip-path", "url(#content-clip)"), this.contentGroup.setAttribute("class", "datatable-content"), this.svg.appendChild(this.contentGroup), this.options.fixedColumns > 0 && (this.fixedColumnsGroup = document.createElementNS(this.svgNS, "g"), this.fixedColumnsGroup.setAttribute("clip-path", "url(#fixed-columns-clip)"), this.fixedColumnsGroup.setAttribute("class", "datatable-fixed-columns"), this.svg.appendChild(this.fixedColumnsGroup)), this.headerGroup = document.createElementNS(this.svgNS, "g"), this.headerGroup.setAttribute("clip-path", "url(#header-clip)"), this.headerGroup.setAttribute("class", "datatable-header"), this.svg.appendChild(this.headerGroup), this.options.fixedColumns > 0 && (this.fixedHeaderGroup = document.createElementNS(this.svgNS, "g"), this.fixedHeaderGroup.setAttribute("clip-path", "url(#fixed-header-clip)"), this.fixedHeaderGroup.setAttribute("class", "datatable-fixed-header"), this.svg.appendChild(this.fixedHeaderGroup)), this.shadowGroup = document.createElementNS(this.svgNS, "g"), this.shadowGroup.setAttribute("class", "datatable-shadows"), this.svg.appendChild(this.shadowGroup);
  }
  setupEventHandlers() {
    this.container.addEventListener("wheel", this.wheelHandler, { passive: !1 }), typeof ResizeObserver < "u" && (this.resizeObserver = new ResizeObserver(() => this.handleResize()), this.resizeObserver.observe(this.container)), this.container.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: !1 }), this.container.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: !1 });
  }
  handleResize() {
    const t = this.svg.getBoundingClientRect();
    (t.width !== this.options.width || t.height !== this.options.height) && (this.options.width = t.width, this.options.height = t.height, this.calculateDimensions(), this.svg.setAttribute("width", this.options.width.toString()), this.svg.setAttribute("height", this.options.height.toString()), this.defs.innerHTML = "", this.createShadowGradients(), this.createClipPaths(), this.render());
  }
  handleTouchStart(t) {
    t.preventDefault();
    const e = t.touches[0];
    this.touchStartX = e.clientX, this.touchStartY = e.clientY, this.touchStartScrollX = this.options.scrollX, this.touchStartScrollY = this.options.scrollY;
  }
  handleTouchMove(t) {
    if (t.preventDefault(), t.touches.length === 1) {
      const e = t.touches[0], i = this.touchStartX - e.clientX, o = this.touchStartY - e.clientY;
      this.scroll(this.touchStartScrollX + i, this.touchStartScrollY + o);
    }
  }
  handleWheel(t) {
    t.preventDefault();
    let e = t.deltaX, i = t.deltaY;
    t.shiftKey && (e += i, i = 0);
    const o = t.ctrlKey ? 5 : 1;
    this.scroll(this.options.scrollX + e * o, this.options.scrollY + i * o);
  }
  calculateVisibleColumns() {
    const t = this.options.scrollX, e = t + this.scrollableWidth, i = [], o = this.scrollableWidth * 0.5, h = Math.max(0, t - o), s = Math.min(this.totalWidth, e + o);
    let n = this.fixedColumnsWidth;
    for (let d = this.options.fixedColumns; d < this.options.columns.length; d++) {
      const l = this.options.columns[d].width || 100, a = n;
      a + l > h && a < s && i.push(d), n += l;
    }
    return i;
  }
  scroll(t, e) {
    if (t = Math.max(0, Math.min(t, this.maxScrollX)), e = Math.max(0, Math.min(e, this.maxScrollY)), this.options.scrollX === t && this.options.scrollY === e) return;
    const i = Math.abs(t - this.options.scrollX);
    this.options.scrollX = t, this.options.scrollY = e, this.updateScrollPosition(), i > this.scrollableWidth * 0.3 ? (this.renderTimer && clearTimeout(this.renderTimer), this.renderTimer = null, this.render()) : (this.renderTimer && clearTimeout(this.renderTimer), this.renderTimer = setTimeout(() => this.render(), this.options.debounceRender));
  }
  updateScrollPosition() {
    this.contentContainer && this.contentContainer.setAttribute("transform", `translate(${-this.options.scrollX}, ${-this.options.scrollY})`), this.headerContainer && this.headerContainer.setAttribute("transform", `translate(${-this.options.scrollX}, 0)`), this.fixedColumnsContainer && this.fixedColumnsContainer.setAttribute("transform", `translate(0, ${-this.options.scrollY})`), this.options.debug && this.debugInfo && (this.debugInfo.textContent = `Scroll: ${Math.round(this.options.scrollX)}, ${Math.round(this.options.scrollY)} | Rows: ${this.visibleRowsStart}-${this.visibleRowsEnd} (${this.visibleRows.length}) | Selected: ${this.selectedCells.size}`);
  }
  scrollToRow(t) {
    const e = t * this.options.rowHeight;
    this.scroll(this.options.scrollX, e);
  }
  scrollToCell(t, e) {
    const i = t * this.options.rowHeight;
    let o = 0;
    for (let h = 0; h < e && h < this.options.columns.length; h++)
      h >= this.options.fixedColumns && (o += this.options.columns[h].width || 100);
    this.scroll(o, i);
  }
  calculateVisibleRows() {
    const t = this.options.scrollY, e = t + this.scrollableHeight;
    let i = Math.floor(t / this.options.rowHeight), o = Math.ceil(e / this.options.rowHeight);
    i = Math.max(0, i - this.options.bufferSize), o = Math.min(this.options.data.length, o + this.options.bufferSize), this.options.data.length <= this.options.virtualThreshold && (i = 0, o = this.options.data.length), this.visibleRowsStart = i, this.visibleRowsEnd = o, this.visibleRows = this.options.data.slice(i, o);
  }
  render() {
    this.calculateVisibleRows(), this.contentGroup.innerHTML = "", this.fixedColumnsGroup && (this.fixedColumnsGroup.innerHTML = ""), this.headerGroup.innerHTML = "", this.fixedHeaderGroup && (this.fixedHeaderGroup.innerHTML = ""), this.shadowGroup.innerHTML = "", this.renderContent(), this.options.fixedColumns > 0 && this.renderFixedColumns(), this.renderHeader(), this.options.fixedColumns > 0 && this.renderFixedHeader(), this.renderShadows(), this.options.debug && this.debugInfo && (this.debugInfo.textContent = `Scroll: ${Math.round(this.options.scrollX)}, ${Math.round(this.options.scrollY)} | Rows: ${this.visibleRowsStart}-${this.visibleRowsEnd} (${this.visibleRows.length}) | Selected: ${this.selectedCells.size}`);
  }
  renderContent() {
    const t = this.contentContainer = document.createElementNS(this.svgNS, "g");
    this.contentContainer.setAttribute("transform", `translate(${-this.options.scrollX}, ${-this.options.scrollY})`), this.contentGroup.appendChild(this.contentContainer), this.visibleRows.forEach((e, i) => {
      const o = i + this.visibleRowsStart, h = o * this.options.rowHeight + this.options.headerHeight, s = document.createElementNS(this.svgNS, "rect");
      if (s.setAttribute("x", this.fixedColumnsWidth.toString()), s.setAttribute("y", h.toString()), s.setAttribute("width", (this.totalWidth - this.fixedColumnsWidth).toString()), s.setAttribute("height", this.options.rowHeight.toString()), s.setAttribute("fill", o % 2 === 0 ? "#ffffff" : "#f9f9f9"), t.appendChild(s), this.options.horizontalVirtualization)
        this.calculateVisibleColumns().forEach((d) => {
          this.renderCell(e, o, d, h, this.contentContainer);
        });
      else
        for (let n = this.options.fixedColumns; n < this.options.columns.length; n++)
          this.renderCell(e, o, n, h, this.contentContainer);
    });
  }
  renderCell(t, e, i, o, h) {
    const s = this.options.columns[i], n = s.width || 100;
    let d = i < this.options.fixedColumns ? 0 : this.fixedColumnsWidth;
    for (let g = i < this.options.fixedColumns ? 0 : this.options.fixedColumns; g < i; g++)
      d += this.options.columns[g].width || 100;
    const l = document.createElementNS(this.svgNS, "rect");
    l.setAttribute("x", d.toString()), l.setAttribute("y", o.toString()), l.setAttribute("width", n.toString()), l.setAttribute("height", this.options.rowHeight.toString()), l.setAttribute("fill", this.selectedCells.has(`${e}-${i}`) ? "#cce5ff" : "transparent"), l.setAttribute("stroke", "#e0e0e0"), l.setAttribute("stroke-width", "0.5"), l.setAttribute("data-row", e.toString()), l.setAttribute("data-col", i.toString()), h.appendChild(l);
    const a = document.createElementNS(this.svgNS, "text");
    a.setAttribute("x", (d + 5).toString()), a.setAttribute("y", (o + this.options.rowHeight / 2).toString()), a.setAttribute("dominant-baseline", "middle"), a.setAttribute("font-size", this.options.fontSize.toString());
    const c = s.field || `field${i}`, p = t[c] !== void 0 ? t[c] : "";
    a.textContent = s.renderer ? s.renderer(p, t, e, i) : p.toString(), h.appendChild(a);
  }
  renderFixedColumns() {
    if (this.options.fixedColumns <= 0) return;
    const t = this.fixedColumnsContainer = document.createElementNS(this.svgNS, "g");
    this.fixedColumnsContainer.setAttribute("transform", `translate(0, ${-this.options.scrollY})`), this.fixedColumnsGroup.appendChild(this.fixedColumnsContainer), this.visibleRows.forEach((e, i) => {
      const o = i + this.visibleRowsStart, h = o * this.options.rowHeight + this.options.headerHeight, s = document.createElementNS(this.svgNS, "rect");
      s.setAttribute("x", "0"), s.setAttribute("y", h.toString()), s.setAttribute("width", this.fixedColumnsWidth.toString()), s.setAttribute("height", this.options.rowHeight.toString()), s.setAttribute("fill", o % 2 === 0 ? "#f0f8ff" : "#e6f7ff"), s.setAttribute("stroke", "#d0d0d0"), s.setAttribute("stroke-width", "0.5"), t.appendChild(s);
      for (let n = 0; n < this.options.fixedColumns && n < this.options.columns.length; n++)
        this.options.columns[n].width, this.renderCell(e, o, n, h, t);
    });
  }
  renderHeader() {
    const t = document.createElementNS(this.svgNS, "rect");
    t.setAttribute("x", this.fixedColumnsWidth.toString()), t.setAttribute("y", "0"), t.setAttribute("width", this.scrollableWidth.toString()), t.setAttribute("height", this.options.headerHeight.toString()), t.setAttribute("fill", "#f5f5f5"), t.setAttribute("stroke", "#d0d0d0"), t.setAttribute("stroke-width", "0.5"), this.headerGroup.appendChild(t), this.headerContainer = document.createElementNS(this.svgNS, "g"), this.headerContainer.setAttribute("transform", `translate(${-this.options.scrollX}, 0)`), this.headerGroup.appendChild(this.headerContainer);
    const e = document.createElementNS(this.svgNS, "rect");
    if (e.setAttribute("x", this.fixedColumnsWidth.toString()), e.setAttribute("y", "0"), e.setAttribute("width", (this.totalWidth - this.fixedColumnsWidth).toString()), e.setAttribute("height", this.options.headerHeight.toString()), e.setAttribute("fill", "#f5f5f5"), this.headerContainer.appendChild(e), this.options.horizontalVirtualization)
      this.calculateVisibleColumns().forEach((o) => this.renderHeaderCell(o));
    else
      for (let i = this.options.fixedColumns; i < this.options.columns.length; i++)
        this.renderHeaderCell(i);
  }
  renderHeaderCell(t) {
    const e = this.options.columns[t], i = e.width || 100;
    let o = this.fixedColumnsWidth;
    for (let n = this.options.fixedColumns; n < t; n++)
      o += this.options.columns[n].width || 100;
    const h = document.createElementNS(this.svgNS, "rect");
    h.setAttribute("x", o.toString()), h.setAttribute("y", "0"), h.setAttribute("width", i.toString()), h.setAttribute("height", this.options.headerHeight.toString()), h.setAttribute("fill", "transparent"), h.setAttribute("stroke", "#d0d0d0"), h.setAttribute("stroke-width", "0.5"), this.headerContainer.appendChild(h);
    const s = document.createElementNS(this.svgNS, "text");
    s.setAttribute("x", (o + i / 2).toString()), s.setAttribute("y", (this.options.headerHeight / 2).toString()), s.setAttribute("text-anchor", "middle"), s.setAttribute("dominant-baseline", "middle"), s.setAttribute("font-size", this.options.fontSize.toString()), s.setAttribute("font-weight", "bold"), s.textContent = e.title || `Column ${t + 1}`, this.headerContainer.appendChild(s);
  }
  renderFixedHeader() {
    if (this.options.fixedColumns <= 0) return;
    const t = document.createElementNS(this.svgNS, "rect");
    t.setAttribute("x", "0"), t.setAttribute("y", "0"), t.setAttribute("width", this.fixedColumnsWidth.toString()), t.setAttribute("height", this.options.headerHeight.toString()), t.setAttribute("fill", "#e6f7ff"), t.setAttribute("stroke", "#d0d0d0"), t.setAttribute("stroke-width", "0.5"), this.fixedHeaderGroup.appendChild(t);
    let e = 0;
    for (let i = 0; i < this.options.fixedColumns && i < this.options.columns.length; i++) {
      const o = this.options.columns[i], h = o.width || 100, s = document.createElementNS(this.svgNS, "rect");
      s.setAttribute("x", e.toString()), s.setAttribute("y", "0"), s.setAttribute("width", h.toString()), s.setAttribute("height", this.options.headerHeight.toString()), s.setAttribute("fill", "#e6f7ff"), s.setAttribute("stroke", "#d0d0d0"), s.setAttribute("stroke-width", "0.5"), this.fixedHeaderGroup.appendChild(s);
      const n = document.createElementNS(this.svgNS, "text");
      n.setAttribute("x", (e + h / 2).toString()), n.setAttribute("y", (this.options.headerHeight / 2).toString()), n.setAttribute("text-anchor", "middle"), n.setAttribute("dominant-baseline", "middle"), n.setAttribute("font-size", this.options.fontSize.toString()), n.setAttribute("font-weight", "bold"), n.textContent = o.title || `Column ${i + 1}`, this.fixedHeaderGroup.appendChild(n), e += h;
    }
  }
  renderShadows() {
    if (this.options.fixedColumns > 0) {
      const e = document.createElementNS(this.svgNS, "rect");
      e.setAttribute("x", this.fixedColumnsWidth.toString()), e.setAttribute("y", "0"), e.setAttribute("width", "5"), e.setAttribute("height", this.options.height.toString()), e.setAttribute("fill", "url(#shadow-gradient-h)"), e.setAttribute("pointer-events", "none"), this.shadowGroup.appendChild(e);
    }
    const t = document.createElementNS(this.svgNS, "rect");
    t.setAttribute("x", "0"), t.setAttribute("y", this.options.headerHeight.toString()), t.setAttribute("width", this.options.width.toString()), t.setAttribute("height", "5"), t.setAttribute("fill", "url(#shadow-gradient-v)"), t.setAttribute("pointer-events", "none"), this.shadowGroup.appendChild(t);
  }
  updateData(t) {
    this.options.data = t || [], this.calculateDimensions(), this.options.scrollX = Math.min(this.options.scrollX, this.maxScrollX), this.options.scrollY = Math.min(this.options.scrollY, this.maxScrollY), this.render();
  }
  updateColumns(t) {
    this.options.columns = t || [], this.calculateDimensions(), this.options.scrollX = Math.min(this.options.scrollX, this.maxScrollX), this.options.scrollY = Math.min(this.options.scrollY, this.maxScrollY), this.render();
  }
  setFixedColumns(t) {
    t = Math.min(t, this.options.columns.length), this.options.fixedColumns !== t && (this.options.fixedColumns = t, this.destroy(), this.init());
  }
  getElement() {
    return this.svg;
  }
  destroy() {
    this.container.removeEventListener("wheel", this.wheelHandler), this.container.removeEventListener("touchstart", this.handleTouchStart), this.container.removeEventListener("touchmove", this.handleTouchMove), this.container.removeEventListener("mousedown", this.handleMouseDown), document.removeEventListener("mousemove", this.handleMouseMove), document.removeEventListener("mouseup", this.handleMouseUp), document.removeEventListener("keydown", this.handleKeyDown), this.resizeObserver && this.resizeObserver.disconnect(), this.container.innerHTML = "", this.renderTimer && clearTimeout(this.renderTimer), this.rafId && cancelAnimationFrame(this.rafId);
  }
  renderWithRAF() {
    this.rafId && cancelAnimationFrame(this.rafId), this.rafId = requestAnimationFrame(() => this.render());
  }
  updateCells(t) {
    let e = !1;
    t.forEach((i) => {
      const { row: o, col: h, value: s } = i;
      if (o >= 0 && o < this.options.data.length && h >= 0 && h < this.options.columns.length) {
        const d = this.options.columns[h].field || `field${h}`;
        this.options.data[o][d] = s, o >= this.visibleRowsStart && o < this.visibleRowsEnd && (e = !0);
      }
    }), e && this.render();
  }
  highlightRow(t, e = "#FFFECC") {
    if (this.highlightedRow !== void 0 && this.svg.querySelectorAll(`.highlight-row-${this.highlightedRow}`).forEach((n) => {
      n.setAttribute("fill", n.getAttribute("data-original-fill") || ""), n.classList.remove(`highlight-row-${this.highlightedRow}`);
    }), this.highlightedRow = t, t < 0) return;
    const i = t * this.options.rowHeight + this.options.headerHeight;
    if (!(t >= this.visibleRowsStart && t < this.visibleRowsEnd)) {
      this.scrollToRow(t);
      return;
    }
    this.contentContainer.querySelectorAll(`rect[y="${i}"]`).forEach((s) => {
      s.setAttribute("data-original-fill", s.getAttribute("fill") || ""), s.setAttribute("fill", e), s.classList.add(`highlight-row-${t}`);
    }), this.fixedColumnsContainer && this.fixedColumnsContainer.querySelectorAll(`rect[y="${i}"]`).forEach((n) => {
      n.setAttribute("data-original-fill", n.getAttribute("fill") || ""), n.setAttribute("fill", e), n.classList.add(`highlight-row-${t}`);
    });
  }
  // 单元格选择事件处理
  setupCellSelectionHandlers() {
    this.container.addEventListener("mousedown", this.handleMouseDown.bind(this)), document.addEventListener("mousemove", this.handleMouseMove.bind(this)), document.addEventListener("mouseup", this.handleMouseUp.bind(this));
  }
  getCellFromPosition(t, e) {
    const i = this.svg.getBoundingClientRect(), o = e - i.top + this.options.scrollY - this.options.headerHeight, h = t - i.left + this.options.scrollX, s = Math.floor(o / this.options.rowHeight);
    if (s < 0 || s >= this.options.data.length) return null;
    let n = -1, d = 0;
    for (let l = 0; l < this.options.columns.length; l++) {
      const a = this.options.columns[l].width || 100;
      if (h >= d && h < d + a) {
        n = l;
        break;
      }
      d += a;
    }
    return n === -1 ? null : { rowIndex: s, colIndex: n };
  }
  selectRange(t, e) {
    this.selectedCells.clear();
    const i = Math.min(t.rowIndex, e.rowIndex), o = Math.max(t.rowIndex, e.rowIndex), h = Math.min(t.colIndex, e.colIndex), s = Math.max(t.colIndex, e.colIndex);
    for (let n = i; n <= o; n++)
      for (let d = h; d <= s; d++)
        this.selectedCells.add(`${n}-${d}`);
    this.render();
  }
  handleMouseDown(t) {
    if (t.button !== 0) return;
    const e = this.getCellFromPosition(t.clientX, t.clientY);
    !e || t.clientY - this.svg.getBoundingClientRect().top < this.options.headerHeight || (t.shiftKey && this.startCell ? this.selectRange(this.startCell, e) : (this.selectedCells.clear(), this.selectedCells.add(`${e.rowIndex}-${e.colIndex}`), this.startCell = e, this.isDragging = !0, this.render()));
  }
  handleMouseMove(t) {
    if (!this.isDragging || !this.startCell) return;
    const e = this.getCellFromPosition(t.clientX, t.clientY);
    e && this.selectRange(this.startCell, e);
  }
  handleMouseUp(t) {
    this.isDragging = !1;
  }
  // 复制功能
  setupCopyHandler() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }
  copySelectedCells(t = !0) {
    const e = this.getSelectedCells();
    if (e.length === 0) return;
    const i = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set();
    e.forEach((l) => {
      i.add(l.rowIndex), o.add(l.colIndex);
    });
    const h = Array.from(i).sort((l, a) => l - a), s = Array.from(o).sort((l, a) => l - a);
    let n = [];
    if (t) {
      const l = s.map(
        (a) => this.options.columns[a].title || `Column ${a + 1}`
      );
      n.push(l);
    }
    h.forEach((l) => {
      const a = s.map((c) => {
        const p = this.options.columns[c], g = p.field || `field${c}`, f = this.options.data[l][g] !== void 0 ? this.options.data[l][g] : "";
        return p.renderer ? p.renderer(f, this.options.data[l], l, c) : f.toString();
      });
      n.push(a);
    });
    const d = n.map((l) => l.join("	")).join(`
`);
    navigator.clipboard.writeText(d).then(() => {
      this.options.debug && console.log("Copied to clipboard:", d);
    }).catch((l) => {
      console.error("Failed to copy:", l);
    });
  }
  getSelectedCells() {
    return Array.from(this.selectedCells).map((t) => {
      const [e, i] = t.split("-").map(Number);
      return { rowIndex: e, colIndex: i };
    });
  }
  clearSelection() {
    this.selectedCells.clear(), this.startCell = null, this.render();
  }
  // 提供外部调用复制的方法
  copy(t = !0) {
    this.copySelectedCells(t);
  }
  setCellRenderer(t, e) {
    t >= 0 && t < this.options.columns.length && (this.options.columns[t].renderer = e, this.render());
  }
  exportSVG() {
    const t = this.svg.cloneNode(!0);
    return t.setAttribute("xmlns", this.svgNS), t.setAttribute("version", "1.1"), new XMLSerializer().serializeToString(t);
  }
  getVisibleData() {
    return this.visibleRows;
  }
  getData() {
    return this.options.data;
  }
  getState() {
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
        scrollableHeight: this.scrollableHeight
      }
    };
  }
}
export {
  C as default
};
