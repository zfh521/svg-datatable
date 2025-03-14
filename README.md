# SVGDataTable 使用说明

`SVGDataTable` 是一个基于 SVG 的高性能表格组件，支持虚拟滚动、单元格选择和数据复制，适用于大规模数据展示场景。以下是完整的安装和使用指南。

## 安装

通过 npm 安装：

```bash
npm install svg-datatable
```

## 基本用法

在 TypeScript 或 JavaScript 项目中引入并初始化表格：

```typescript
import SVGDataTable from 'svg-datatable';

// 初始化表格
const table = new SVGDataTable('#app', {
  columns: [
    { title: 'ID', field: 'id', width: 100 },
    { title: 'Name', field: 'name', width: 200 },
    { title: 'Age', field: 'age', width: 100 }
  ],
  data: [
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 30 }
  ],
  fixedColumns: 1,  // 固定第一列
  width: 800,       // 表格宽度
  height: 400       // 表格高度
});
```

- `container`：表格容器，可以是 CSS 选择器字符串（如 `'#app'`）或 `HTMLElement`。
- `options`：配置对象，详见“配置选项”。

## 配置选项

| 属性                  | 类型       | 默认值        | 描述                                  |
|-----------------------|------------|---------------|---------------------------------------|
| `width`              | `number`   | `800`         | 表格宽度（像素）                      |
| `height`             | `number`   | `400`         | 表格高度（像素）                      |
| `rowHeight`          | `number`   | `30`          | 行高（像素）                          |
| `headerHeight`       | `number`   | `40`          | 表头高度（像素）                      |
| `fontSize`           | `number`   | `12`          | 字体大小（像素）                      |
| `columns`            | `Column[]` | `[]`          | 列定义数组，见“列配置”                |
| `data`               | `RowData[]`| `[]`          | 数据数组，见“数据格式”                |
| `fixedColumns`       | `number`   | `0`           | 固定列数量                            |
| `fixedHeader`        | `boolean`  | `true`        | 是否固定表头                          |
| `scrollX`            | `number`   | `0`           | 水平滚动初始位置                      |
| `scrollY`            | `number`   | `0`           | 垂直滚动初始位置                      |
| `virtualThreshold`   | `number`   | `50`          | 启用虚拟滚动的行数阈值                |
| `bufferSize`         | `number`   | `10`          | 缓冲区大小（行数）                    |
| `debounceRender`     | `number`   | `10`          | 渲染防抖时间（毫秒）                  |
| `debug`              | `boolean`  | `false`       | 是否启用调试模式，显示滚动和选择信息  |
| `horizontalVirtualization` | `boolean` | `列数 > 20` | 是否启用水平虚拟化                  |

### 列配置 (`Column`)

| 属性       | 类型                                      | 默认值    | 描述                        |
|------------|-------------------------------------------|-----------|-----------------------------|
| `title`    | `string`                                  | `undefined` | 列标题，显示在表头         |
| `field`    | `string`                                  | `undefined` | 数据字段名，用于映射数据   |
| `width`    | `number`                                  | `100`     | 列宽度（像素）             |
| `renderer` | `(value: any, row: RowData, rowIndex: number, colIndex: number) => string` | `undefined` | 自定义单元格渲染函数     |

### 数据格式 (`RowData`)

数据为键值对对象，键名对应 `Column.field`：

```typescript
interface RowData {
  [key: string]: any;
}
```

示例：
```json
{ "id": 1, "name": "Alice", "age": 25 }
```

## 方法

### `render()`
手动重新渲染表格。

```typescript
table.render();
```

### `updateData(data: RowData[])`
更新表格数据并重新渲染。

```typescript
table.updateData([{ id: 3, name: 'Charlie', age: 35 }]);
```

### `updateColumns(columns: Column[])`
更新列定义并重新渲染。

```typescript
table.updateColumns([{ title: 'Score', field: 'score', width: 120 }]);
```

### `setFixedColumns(count: number)`
设置固定列数量并重新初始化。

```typescript
table.setFixedColumns(2);
```

### `getElement(): SVGSVGElement`
获取 SVG 根元素。

```typescript
const svg = table.getElement();
```

### `destroy()`
销毁表格，移除事件监听器并清理 DOM。

```typescript
table.destroy();
```

### `renderWithRAF()`
使用 `requestAnimationFrame` 渲染表格。

```typescript
table.renderWithRAF();
```

### `updateCells(updates: { row: number; col: number; value: any }[])`
更新指定单元格的值并重新渲染。

```typescript
table.updateCells([{ row: 0, col: 2, value: 26 }]);
```

### `highlightRow(rowIndex: number, color?: string)`
高亮指定行，`-1` 表示取消高亮。

```typescript
table.highlightRow(1, '#FFFECC');
```

### `scrollToRow(rowIndex: number)`
滚动到指定行。

```typescript
table.scrollToRow(5);
```

### `scrollToCell(rowIndex: number, colIndex: number)`
滚动到指定单元格。

```typescript
table.scrollToCell(5, 1);
```

### `getSelectedCells(): CellPosition[]`
获取当前选中的单元格位置。

```typescript
const selected = table.getSelectedCells(); // [{ rowIndex: 0, colIndex: 1 }, ...]
```

### `clearSelection()`
清除所有单元格选择并重新渲染。

```typescript
table.clearSelection();
```

### `copy(includeHeaders?: boolean)`
复制选中的单元格数据到剪贴板，默认包含表头。

```typescript
table.copy(true);
```

### `setCellRenderer(columnIndex: number, renderer: (value: any, row: RowData, rowIndex: number, colIndex: number) => string)`
设置指定列的自定义渲染函数。

```typescript
table.setCellRenderer(2, (value) => `${value} years`);
```

### `exportSVG(): string`
导出表格为 SVG 字符串。

```typescript
const svgString = table.exportSVG();
```

### `getVisibleData(): RowData[]`
获取当前可见的行数据。

```typescript
const visibleData = table.getVisibleData();
```

### `getData(): RowData[]`
获取所有数据。

```typescript
const allData = table.getData();
```

### `getState(): { scrollX: number; scrollY: number; visibleRowsRange: [number, number]; fixedColumns: number; dimensions: {...} }`
获取表格状态。

```typescript
const state = table.getState();
console.log(state.scrollX, state.visibleRowsRange);
```

## 功能特性

### 虚拟滚动
- **垂直虚拟化**：当数据行数超过 `virtualThreshold` 时，仅渲染可见行及缓冲区。
- **水平虚拟化**：当启用 `horizontalVirtualization` 时，仅渲染可见列及缓冲区。

### 单元格选择
- **单选**：单击选择单个单元格。
- **范围选择**：Shift+单击或拖动鼠标选择范围，高亮颜色为 `#cce5ff`。
- **复制**：Windows 使用 `Ctrl+C`，macOS 使用 `Command+C`，复制内容为制表符分隔的文本，可粘贴到 Excel。

### 固定列和表头
- 支持固定左侧列（`fixedColumns`）和表头（`fixedHeader`），带有阴影效果。

### 滚动
- 支持鼠标滚轮、触摸滑动和 API 控制滚动位置。

### 调试模式
- 设置 `debug: true` 可在表格底部显示滚动位置、可见行范围和选中单元格数量。

## 示例

### 完整示例

```typescript
import SVGDataTable from 'svg-datatable';

const table = new SVGDataTable('#app', {
  width: 800,
  height: 400,
  columns: [
    { title: 'ID', field: 'id', width: 100 },
    { title: 'Name', field: 'name', width: 200 },
    { title: 'Age', field: 'age', width: 100, renderer: (val) => `${val} yrs` }
  ],
  data: [
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 30 }
  ],
  fixedColumns: 1,
  debug: true
});

// 两秒后更新数据
setTimeout(() => {
  table.updateData([
    { id: 1, name: 'Alice', age: 26 },
    { id: 3, name: 'Charlie', age: 35 }
  ]);
}, 2000);

// 高亮第一行
table.highlightRow(0);
```

## 注意事项
- 确保容器元素存在且具有足够宽高。
- 数据字段名需与 `Column.field` 对应，否则显示为空。
- 大数据量时建议启用虚拟滚动以优化性能。

## 浏览器支持
支持现代浏览器（Chrome、Firefox、Safari、Edge），需支持 SVG 和 ResizeObserver。