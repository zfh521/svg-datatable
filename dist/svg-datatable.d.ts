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
declare class SVGDataTable {
    /** 表格容器元素 */
    private container;
    /** 配置选项，带有默认值 */
    private options;
    /** SVG 命名空间 */
    private svgNS;
    /** SVG 根元素 */
    private svg;
    /** SVG 定义元素，用于渐变和剪切路径 */
    private defs;
    /** 当前可见的行数据 */
    private visibleRows;
    /** 可见行的起始索引 */
    private visibleRowsStart;
    /** 可见行的结束索引 */
    private visibleRowsEnd;
    /** 表格总宽度 */
    private totalWidth;
    /** 表格总高度 */
    private totalHeight;
    /** 固定列的总宽度 */
    private fixedColumnsWidth;
    /** 可滚动区域的宽度 */
    private scrollableWidth;
    /** 可滚动区域的高度 */
    private scrollableHeight;
    /** 最大水平滚动距离 */
    private maxScrollX;
    /** 最大垂直滚动距离 */
    private maxScrollY;
    /** 渲染防抖定时器 ID */
    private renderTimer;
    /** 滚轮事件处理函数 */
    private wheelHandler;
    /** 调试信息文本元素 */
    private debugInfo?;
    /** 背景图层组 */
    private backgroundGroup;
    /** 内容图层组 */
    private contentGroup;
    /** 固定列图层组 */
    private fixedColumnsGroup?;
    /** 表头图层组 */
    private headerGroup;
    /** 固定表头图层组 */
    private fixedHeaderGroup?;
    /** 阴影图层组 */
    private shadowGroup;
    /** 内容容器组 */
    private contentContainer?;
    /** 固定列容器组 */
    private fixedColumnsContainer?;
    /** 表头容器组 */
    private headerContainer?;
    /** 容器大小监听器 */
    private resizeObserver?;
    /** 触摸起始 X 坐标 */
    private touchStartX;
    /** 触摸起始 Y 坐标 */
    private touchStartY;
    /** 触摸时的初始 scrollX */
    private touchStartScrollX;
    /** 触摸时的初始 scrollY */
    private touchStartScrollY;
    /** 当前高亮的行索引 */
    private highlightedRow?;
    /** 动画帧 ID */
    private rafId?;
    /** 选中的单元格集合 */
    private selectedCells;
    /** 选择起始单元格 */
    private startCell;
    /** 是否正在拖动选择 */
    private isDragging;
    /**
     * 创建 SVGDataTable 实例
     * @param container 表格容器，可以是选择器字符串或 HTMLElement
     * @param options 配置选项，详见 {@link Options}
     * @throws {Error} 如果容器未找到则抛出错误
     */
    constructor(container: string | HTMLElement, options?: Options);
    /**
     * 初始化表格，包括尺寸计算、SVG 结构创建和事件绑定
     * @private
     */
    private init;
    /**
     * 计算表格的各种尺寸参数，包括总宽高、可滚动区域等
     * @private
     */
    private calculateDimensions;
    /**
     * 创建阴影渐变，用于固定列和表头的视觉效果
     * @private
     */
    private createShadowGradients;
    /**
     * 创建剪切路径，用于限制内容显示区域
     * @private
     */
    private createClipPaths;
    /**
     * 创建单个剪切路径
     * @param id 剪切路径的 ID
     * @param x X 坐标
     * @param y Y 坐标
     * @param width 宽度
     * @param height 高度
     * @private
     */
    private createClipPath;
    /**
     * 创建 SVG 图层组，包括背景、内容、固定列等
     * @private
     */
    private createGroups;
    /**
     * 设置事件监听器，包括滚轮、触摸和窗口大小调整
     * @private
     */
    private setupEventHandlers;
    /**
     * 处理容器大小变化，调整表格尺寸并重新渲染
     * @private
     */
    private handleResize;
    /**
     * 处理触摸开始事件，记录起始位置
     * @param e 触摸事件
     * @private
     */
    private handleTouchStart;
    /**
     * 处理触摸移动事件，更新滚动位置
     * @param e 触摸事件
     * @private
     */
    private handleTouchMove;
    /**
     * 处理滚轮事件，调整滚动位置
     * @param e 滚轮事件
     * @private
     */
    private handleWheel;
    /**
     * 计算当前可见的列索引（水平虚拟化）
     * @returns 可见列的索引数组
     * @private
     */
    private calculateVisibleColumns;
    /**
     * 执行滚动操作，更新位置并触发渲染
     * @param scrollX 目标水平滚动位置
     * @param scrollY 目标垂直滚动位置
     * @private
     */
    private scroll;
    /**
     * 更新滚动位置，应用变换
     * @private
     */
    private updateScrollPosition;
    /**
     * 滚动到指定行
     * @param rowIndex 目标行索引
     */
    scrollToRow(rowIndex: number): void;
    /**
     * 滚动到指定单元格
     * @param rowIndex 目标行索引
     * @param colIndex 目标列索引
     */
    scrollToCell(rowIndex: number, colIndex: number): void;
    /**
     * 计算当前可见的行数据（垂直虚拟化）
     * @private
     */
    private calculateVisibleRows;
    /**
     * 渲染表格，包括内容、固定列、表头和阴影
     */
    render(): void;
    /**
     * 渲染表格内容区域
     * @private
     */
    private renderContent;
    /**
     * 渲染单个单元格
     * @param row 行数据
     * @param rowIndex 行索引
     * @param colIndex 列索引
     * @param yPos Y 坐标
     * @param container 渲染目标容器
     * @private
     */
    private renderCell;
    /**
     * 渲染固定列区域
     * @private
     */
    private renderFixedColumns;
    /**
     * 渲染表头区域
     * @private
     */
    private renderHeader;
    /**
     * 渲染单个表头单元格
     * @param colIndex 列索引
     * @private
     */
    private renderHeaderCell;
    /**
     * 渲染固定表头区域
     * @private
     */
    private renderFixedHeader;
    /**
     * 渲染固定列和表头的阴影效果
     * @private
     */
    private renderShadows;
    /**
     * 更新表格数据并重新渲染
     * @param data 新的数据数组
     */
    updateData(data: RowData[]): void;
    /**
     * 更新列定义并重新渲染
     * @param columns 新的列定义数组
     */
    updateColumns(columns: Column[]): void;
    /**
     * 设置固定列数量并重新初始化
     * @param count 固定列的数量
     */
    setFixedColumns(count: number): void;
    /**
     * 获取 SVG 元素
     * @returns SVG 根元素
     */
    getElement(): SVGSVGElement;
    /**
     * 销毁表格，移除事件监听器并清理 DOM
     */
    destroy(): void;
    /**
     * 使用 requestAnimationFrame 渲染表格
     */
    renderWithRAF(): void;
    /**
     * 更新指定单元格的值并重新渲染
     * @param updates 单元格更新数组
     */
    updateCells(updates: {
        row: number;
        col: number;
        value: any;
    }[]): void;
    /**
     * 高亮指定行
     * @param rowIndex 行索引，-1 表示取消高亮
     * @param color 高亮颜色，默认为 #FFFECC
     */
    highlightRow(rowIndex: number, color?: string): void;
    /**
     * 设置单元格选择事件监听器
     * @private
     */
    private setupCellSelectionHandlers;
    /**
     * 根据屏幕坐标获取单元格位置
     * @param x X 坐标
     * @param y Y 坐标
     * @returns 单元格位置或 null
     * @private
     */
    private getCellFromPosition;
    /**
     * 选择指定范围的单元格并重新渲染
     * @param start 起始单元格
     * @param end 结束单元格
     * @private
     */
    private selectRange;
    /**
     * 处理鼠标按下事件，开始单元格选择
     * @param e 鼠标事件
     * @private
     */
    private handleMouseDown;
    /**
     * 处理鼠标移动事件，更新选择范围
     * @param e 鼠标事件
     * @private
     */
    private handleMouseMove;
    /**
     * 处理鼠标松开事件，结束选择
     * @param e 鼠标事件
     * @private
     */
    private handleMouseUp;
    /**
     * 设置复制快捷键监听器
     * @private
     */
    private setupCopyHandler;
    /**
     * 处理键盘事件，支持 Ctrl+C 和 Command+C 复制
     * @param e 键盘事件
     * @private
     */
    private handleKeyDown;
    /**
     * 复制选中的单元格数据到剪贴板
     * @param includeHeaders 是否包含表头，默认为 true
     * @private
     */
    private copySelectedCells;
    /**
     * 获取当前选中的单元格
     * @returns 包含行索引和列索引的单元格位置数组
     */
    getSelectedCells(): CellPosition[];
    /**
     * 清除所有单元格选择并重新渲染
     */
    clearSelection(): void;
    /**
     * 复制选中的单元格数据到剪贴板
     * @param includeHeaders 是否包含表头，默认为 true
     */
    copy(includeHeaders?: boolean): void;
    /**
     * 设置指定列的自定义渲染函数
     * @param columnIndex 列索引
     * @param renderer 渲染函数
     */
    setCellRenderer(columnIndex: number, renderer: (value: any, row: RowData, rowIndex: number, colIndex: number) => string): void;
    /**
     * 导出表格为 SVG 字符串
     * @returns SVG 字符串
     */
    exportSVG(): string;
    /**
     * 获取当前可见的数据行
     * @returns 可见的行数据数组
     */
    getVisibleData(): RowData[];
    /**
     * 获取所有数据
     * @returns 完整的行数据数组
     */
    getData(): RowData[];
    /**
     * 获取表格状态
     * @returns 包含滚动位置、可见行范围和尺寸信息的对象
     */
    getState(): {
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
    };
}
export default SVGDataTable;
