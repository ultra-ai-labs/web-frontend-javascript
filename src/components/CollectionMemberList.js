import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, Tag, Dropdown, Input, DatePicker, Dialog, Radio, MessagePlugin } from 'tdesign-react';
import dayjs from 'dayjs';
import { getUserInfosApi, updateUserInfosApi } from '../api/api';

const CollectionMemberList = () => {
    // const [allData.current, setAllData] = useState([]);
    const allData = useRef([])
    const [userInfoList, setData] = useState([]);
    const [filterValue, setFilterValue] = useState({});
    const [editingKey, setEditingKey] = useState('');
    const [editingNote, setEditingNote] = useState('');
    const [editingDateKey, setEditingDateKey] = useState('');
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [newExpireDate, setNewExpireDate] = useState('');
    const [newMemberType, setNewMemberType] = useState('试用会员');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0, });

    const fetchData = async () => {
        try {
            const response = await getUserInfosApi();
            const formattedData = response.data.map(item => {
                const today = dayjs();
                const expireDate = dayjs(item.subscription_end_date - 1);
                const daysUntilExpire = expireDate.diff(today, 'day');

                let status;
                if (daysUntilExpire < 0) {
                    status = '已过期';
                } else if (daysUntilExpire <= 7) {
                    status = '临到期';
                } else {
                    status = '使用中';
                }

                return {
                    key: item.user_id,
                    username: item.username,
                    note: item.nickname || '',
                    memberType: item.package_type === 0 ? '试用会员' :
                        item.package_type === 1 ? '个人会员' : '企业会员',
                    expireDate: expireDate.format('YYYY-MM-DD'),
                    status: status,
                };
            });
            allData.current = formattedData;
            if (Object.keys(filterValue).length > 0) {
                request(filterValue);
            } else {
                setPagination(prev => ({ ...prev, total: formattedData.length }));
                updatePageData(formattedData, pagination.current, pagination.pageSize);
            }
        } catch (error) {
            console.error('获取用户数据失败:', error);
            MessagePlugin.error('获取用户数据失败');
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, []);

    const updatePageData = (sourceData, current, pageSize) => {
        const start = (current - 1) * pageSize;
        const end = start + pageSize;
        setData(sourceData.slice(start, end));
    };

    const handlePaginationChange = (pageInfo) => {
        const { current, pageSize } = pageInfo;
        setPagination(prev => ({ ...prev, current, pageSize }));
        updatePageData(allData.current, current, pageSize);
    };

    const columns = [
        {
            title: '用户名',
            colKey: 'username',
            width: 200,
            filter: {
                type: 'input',
                resetValue: '',
                confirmEvents: ['onEnter'],
                props: {
                    placeholder: '输入关键词过滤',
                },
                showConfirmAndReset: true,
            }
        },
        {
            title: '备注',
            colKey: 'note',
            width: 250,
            filter: {
                type: 'input',
                resetValue: '',
                confirmEvents: ['onEnter'],
                props: {
                    placeholder: '输入备注关键词过滤',
                },
                showConfirmAndReset: true,
            },
            cell: ({ row }) => {
                if (editingKey === row.key) {
                    return (
                        <Input
                            defaultValue={row.note}
                            onChange={(val) => setEditingNote(val)} // 更新编辑中的值
                            onBlur={() => handleSaveNote(row.key)} // 失去焦点时触发保存
                            onEnter={() => handleSaveNote(row.key)} // 按回车键时触发保存
                        />
                    );
                }
                return (
                    <div
                        style={{ cursor: 'pointer', width: 300 }}
                        onClick={() => {
                            setEditingKey(row.key); // 设置当前编辑的行
                            setEditingNote(row.note || ''); // 初始化备注值
                        }}
                    >
                        {row.note || '-'} {/* 未填写备注时显示占位符 */}
                    </div>
                );
            },
        },
        {
            title: '会员类型',
            colKey: 'memberType',
            width: 150,
            filter: {
                type: 'multiple',
                resetValue: [],
                list: [
                    { label: '试用会员', value: '试用会员' },
                    { label: '个人会员', value: '个人会员' },
                    { label: '企业会员', value: '企业会员' },
                ],
                showConfirmAndReset: true,
            },
            cell: ({ row }) => (
                <span style={{
                    color: row.memberType === "个人会员" ? "#366EF4" :
                        row.memberType === "试用会员" ? "#65B0F4" :
                            "#FA9550"
                }}>
            {row.memberType}
        </span>
            ),
        },
        {
            title: '到期时间',
            colKey: 'expireDate',
            width: 250,
            filter: {
                type: 'single',
                resetValue: '',
                list: [
                    { label: '近 7 天到期', value: '7' },
                    { label: '近 15 天到期', value: '15' },
                    { label: '近 30 天到期', value: '30' },
                ],
                showConfirmAndReset: true,
            },
            cell: ({ row }) => {
                if (editingDateKey === row.key) {
                    return (
                        <DatePicker
                            mode="date"
                            presetsPlacement="bottom"
                            value={dayjs(row.expireDate, 'YYYY-MM-DD').toDate()} // 默认显示当前日期
                            onChange={(value) => handleDateChange(value, row.key)} // 保存日期
                            onBlur={() => setEditingDateKey('')} // 失去焦点退出编辑
                            format="YYYY-MM-DD"
                            enableTimePicker={false}
                            autoFocus
                        />
                    );
                }
                return (
                    <div
                        style={{ cursor: 'pointer'}}
                        onClick={() => setEditingDateKey(row.key)} // 点击切换到编辑模式
                    >
                        {row.expireDate}
                    </div>
                );
            },
        },
        {
            title: '会员状态',
            colKey: 'status',
            width: 150,
            filter: {
                type: 'multiple',
                resetValue: [],
                list: [
                    { label: '全部', checkAll: true },
                    { label: '使用中', value: '使用中' },
                    { label: '已过期', value: '已过期' },
                    { label: '临到期', value: '临到期' },
                ],
                showConfirmAndReset: true,
            },
            cell: ({ row }) => {
                const statusMap = {
                    '使用中': { theme: 'success', text: '使用中' },
                    '已过期': { theme: 'default', text: '已过期' },
                    '临到期': { theme: 'warning', text: '临到期' },
                };
                const status = statusMap[row.status];
                return <Tag theme={status.theme} variant="light-outline">{status.text}</Tag>;
            },
        },
        {
            title: '操作',
            colKey: 'operations',
            cell: ({ row }) => (
                <Dropdown
                    options={[
                        {
                            content: '设置备注',
                            value: 1,
                            onClick: () => {
                                setEditingKey(row.key);
                                setEditingNote(row.note || '');
                            },
                        },
                        {
                            content: '会员时间',
                            value: 2,
                            onClick: () => {
                                setEditingDateKey(row.key);
                            },
                        },
                    ]}
                >
                    <Button variant="text" theme="primary">
                        操作
                    </Button>
                </Dropdown>
            ),
        },
    ];

    const request = (filters) => {
        const timer = setTimeout(() => {
            clearTimeout(timer);
            const filteredData = allData.current.filter((item) => {
                let result = true;

                // 筛选用户名
                if (filters.username) {
                    result = item.username.includes(filters.username);
                }

                // 筛选备注
                if (result && filters.note) {
                    result = item.note.includes(filters.note);
                }

                // 筛选会员类型
                if (result && filters.memberType && filters.memberType.length) {
                    result = filters.memberType.includes(item.memberType);
                }

                // 筛选到期时间范围
                if (result && filters.expireDate) {
                    const daysRange = parseInt(filters.expireDate, 10);
                    if (!isNaN(daysRange)) {
                        const today = dayjs();
                        const itemDate = dayjs(item.expireDate, 'YYYY-MM-DD');
                        result = itemDate.isBetween(today, today.add(daysRange, 'day'), 'day', '[]');
                    }
                }

                // 筛选会员状态
                if (result && filters.status && filters.status.length) {
                    result = filters.status.includes(item.status);
                }

                return result;
            });

            setPagination((prev) => ({ ...prev, current: 1, total: filteredData.length }));
            updatePageData(filteredData, 1, pagination.pageSize);
        }, 100);
    };

    const onFilterChange = (filters) => {
        setFilterValue(filters); // 更新筛选条件
        request(filters); // 触发筛选
    };

    const handleSaveNote = async (key) => {
        try {
            // 如果编辑的内容和原始内容相同，也需要退出编辑模式
            const originalRow = allData.current.find((item) => item.key === key);
            if (originalRow && editingNote === originalRow.note) {
                setEditingKey(''); // 直接清除编辑状态
                return;
            }

            const params = {
                user_id: key,
                nickname: editingNote || '', // 保存编辑内容，如果为空则存储空字符串
            };

            await updateUserInfosApi(params); // 调用接口更新数据
            MessagePlugin.success('备注更新成功');
            setEditingKey(''); // 清空编辑状态
            await fetchData(); // 刷新表格数据
        } catch (error) {
            MessagePlugin.error('备注更新失败');
            console.error('更新备注失败:', error);
        }
    };

    const handleDateChange = async (value, key) => {
        try {
            const formattedDate = dayjs(value).format('YYYY-MM-DD');
            const params = {
                user_id: key,
                end_date: formattedDate
            };

            await updateUserInfosApi(params);
            setEditingDateKey('');
            MessagePlugin.success('会员时间更新成功');

            await fetchData();
        } catch (error) {
            MessagePlugin.error('会员时间更新失败');
            console.error('更新会员时间失败:', error);
        }
    };

    const handleCreateAccount = () => {
        if (!newNote || !newExpireDate) {
            return;
        }

        const newMember = {
            key: String(allData.current.length + 1),
            username: `会员${allData.current.length + 1}号`,
            note: newNote,
            memberType: newMemberType,
            expireDate: dayjs(newExpireDate).format('YYYY-MM-DD'),
            status: '使用中',
        };

        const newAllData = [...allData.current, newMember];
        allData.current = newAllData;
        if (Object.keys(filterValue).length > 0) {
            request(filterValue);
        } else {
            setPagination(prev => ({ ...prev, total: newAllData.length }));
            updatePageData(newAllData, pagination.current, pagination.pageSize);
        }

        setIsDialogVisible(false);
        setNewNote('');
        setNewExpireDate('');
        setNewMemberType('试用会员');
    };

    return (
        <Space direction="vertical">
            {/* <Space direction="horizontal" align="center">
                <Button
                    onClick={() => {
                        setFilterValue({});
                        updatePageData(allData.current, 1, pagination.pageSize);
                        setPagination(prev => ({ ...prev, current: 1, total: allData.current.length }));
                    }}
                >
                    清空已筛选
                </Button>
                <Button theme="primary" onClick={() => setIsDialogVisible(true)}>
                    创建新账号
                </Button>
                <span>已选筛选条件：{JSON.stringify(filterValue)}</span>
            </Space> */}

            <Dialog
                header="创建新账号"
                visible={isDialogVisible}
                onClose={() => setIsDialogVisible(false)}
                onConfirm={handleCreateAccount}
                confirmBtn="确认"
                cancelBtn="取消"
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <div style={{ marginBottom: '8px' }}>会员类型</div>
                        <Radio.Group
                            value={newMemberType}
                            onChange={setNewMemberType}
                        >
                            <Radio.Button value="试用会员">试用会员</Radio.Button>
                            <Radio.Button value="个人会员">个人会员</Radio.Button>
                            <Radio.Button value="企业会员">企业会员</Radio.Button>
                        </Radio.Group>
                    </div>
                    <div>
                        <div style={{ marginBottom: '8px' }}>备注</div>
                        <Input
                            value={newNote}
                            onChange={setNewNote}
                            placeholder="请输入备注"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div>
                        <div style={{ marginBottom: '8px' }}>到期时间</div>
                        <DatePicker
                            mode="date"
                            value={newExpireDate}
                            onChange={setNewExpireDate}
                            format="YYYY-MM-DD"
                            enableTimePicker={false}
                            placeholder="请选择到期时间"
                            style={{ width: '100%' }}
                        />
                    </div>
                </Space>
            </Dialog>
            <Table
                // height={500}
                size={'small'}
                rowKey="key"
                columns={columns}
                data={userInfoList}
                filterValue={filterValue}
                onFilterChange={onFilterChange}
                bordered
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showJumper: true,
                    pageSizeOptions: [10, 20, 50],
                    onChange: handlePaginationChange,
                }}
            />
        </Space>
    );
};

export default CollectionMemberList;
