// src/main.ts
import SVGDataTable from './svg-datatable';
import './style.css';
const columns = [
    { title: 'ID', field: 'id', width: 80 },
    { title: '姓名', field: 'name', width: 120 },
    { title: '年龄', field: 'age', width: 80 },
    { title: '职位', field: 'position', width: 300 },
    { title: '部门', field: 'department', width: 320 },
    { title: '入职时间', field: 'joinDate', width: 150 },
    { title: '薪资', field: 'salary', width: 100 },
    { title: '绩效', field: 'performance', width: 100 },
    { title: '城市', field: 'city', width: 120 },
    { title: '备注', field: 'notes', width: 200 }
];
const table = new SVGDataTable('#app', {
    columns: columns,
    data: Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        age: 20 + Math.floor(Math.random() * 30),
        position: ['经理', '工程师', '销售', '客服', '设计师'][Math.floor(Math.random() * 5)],
        department: ['研发', '销售', '市场', '客服', '设计'][Math.floor(Math.random() * 5)],
        joinDate: `2020-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        salary: Math.floor(5000 + Math.random() * 10000),
        performance: ['优', '良', '中', '差'][Math.floor(Math.random() * 4)],
        city: ['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random() * 5)],
        notes: `This is a note for user ${i + 1}.`
    })),
    fixedColumns: 1,
    width: 600,
    height: 400,
    debug: true,
});
// 示例：获取选中的单元格
document.addEventListener('mouseup', () => {
    const selected = table.getSelectedCells();
    console.log('Selected cells:', selected);
});
