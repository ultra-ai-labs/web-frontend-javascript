import React, { useState, useEffect } from 'react';
import { Table, Pagination, Tag, Button, MessagePlugin, Space, Col, Row } from 'tdesign-react';
import { deleteTaskApi, getQuote } from '../api/api';
// import SubscriptionDialog from './CollectionSubscriptionDialog';
import dyIcon from "../public/dy.svg";
import xhsIcon from "../public/xhs.svg";

const CollectionTaskTable = ({
    data,
    fetchTasks,
    totalTask,
    handleTabChange,
    setIsCollectAbled,
    chargeVisible,
    setChargeVisible,
    userSubscribeInfo
}) => {
    const [tasks, setTasks] = useState([]);
    const [totalTasks, setTotalTasks] = useState(totalTask); // 总任务数量
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const platformIconMap = {
        'dy': <img src={dyIcon} alt="Prefix Icon" style={{ width: '20px', height: '20px' }} />,
        'xhs': <img src={xhsIcon} alt="Prefix Icon" style={{ width: '20px', height: '20px' }} />
    }

    const columns = [
        {
            title: '关键词',
            colKey: 'keyword',
        },
        // {
        //     title: '平台',
        //     colKey: 'platform',
        //     cell: ({ row }) => (
        //         // <span>{platformMap[row.platform]}</span>
        //         <div style={{ marginTop: 5 }}>{platformIconMap[row.platform] || row.platform}</div>
        //     ),
        //     // width: 60,
        // },
        {
            title: '创建时间',
            colKey: 'create_time',
            sorter: false,
        },
        {
            title: '收集评论',
            colKey: 'status',
            cell: ({ row }) => (
                <Tag
                    theme={row.crawler_state === 'running' ? 'warning' : row.crawler_state === 'initial' ? 'primary' : 'success'}
                    variant="light-outline">
                    {STATUS_MAP[row.crawler_state] || row.crawler_state}
                </Tag>
            ),
        },

        {
            title: '评论数量',
            colKey: 'progress',
            cell: ({ row }) => (
                <span>已收集评论：{row.crawler_progress || '启动中'}</span>
            )
        },
        {
            title: '分析进度',
            colKey: 'analysis_progress',
            cell: ({ row }) => (
                <span>已分析评论：{row.analysis_progress || '待分析'}</span>
            )
        },
        {
            title: '私信进度',
            colKey: 'market_progress',
            cell: ({ row }) => (
                <span>已私信用户：{row.market_progress || '未开始'}</span>
            )
        },
        {
            title: '意向客户',
            colKey: 'intent_count',
            cell: ({ row }) => (
                <span>现有：{row.intent_count}个</span>
            ),
        },
        {
            title: '操作',
            colKey: 'actions',
            cell: ({ row }) => (<Space>
                <Button theme="primary" variant="text" onClick={() => handleTabChange("b", row)}
                    style={{ marginLeft: "-15px" }}>进入分析</Button>
                {(row.crawler_state === 'finish' && row.crawler_progress === 0)
                    && (<Button theme="danger" variant="text" onClick={() => handleDeleteTask(row)}
                        style={{ marginLeft: "-15px" }}>删除</Button>)
                }
            </Space>
            ),
        },
    ];

    const STATUS_MAP = {
        'running': '运行中',
        'initial': '初始化',
        'finish': '已完成'
    };

    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const [nowLimit, setNowLimit] = useState(0) //storedTasks.reduce((acc, task) => acc + task.crawler_progress, 0);
    const [totalLimit, setTotalLimit] = useState(0)

    const [isCollectable, setIsCollectabled] = useState(true)
    // const [visible, setVisible] = useState(false);

    // 添加意向客户总数的计算
    const totalIntentions = storedTasks.reduce((total, task) => {
        return total + (task.intent_count || 0);
    }, 0);

    useEffect(() => {
        if (nowLimit >= totalLimit && totalLimit !== 0) {
            setIsCollectAbled(false)
            setIsCollectabled(false)
        } else {
            setIsCollectAbled(true)
            setIsCollectabled(true)
        }
        // eslint-disable-next-line
    }, [nowLimit, totalLimit])

    // useEffect(() => {
    //     if (chargeVisible) {
    //         setVisible(chargeVisible)
    //         setChargeVisible(false)
    //     }
    //     // eslint-disable-next-line
    // }, [chargeVisible])

    useEffect(() => {
        updateLimit()
    }, [])

    useEffect(() => {
        setTotalTasks(storedTasks.length);
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        setTasks(storedTasks.slice(start, end));
        // eslint-disable-next-line
    }, [currentPage, pageSize, data]);

    const updateLimit = () => {
        getQuote().then(data => {
            if (data.data) {
                setNowLimit(data.data.used_quota)
                setTotalLimit(data.data.total_quota)
            }
        }).catch(err => console.log(err))
    }

    const handlePageChange = (newPage, newPageSize) => {
        setCurrentPage(newPage);
        setPageSize(newPageSize);
        const start = (newPage - 1) * newPageSize;
        const end = start + newPageSize;
        setTasks(storedTasks.slice(start, end));
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const runningTask = tasks.some(task => task.crawler_state === 'running');
            if (runningTask) {
                fetchTasks();
                updateLimit()
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [tasks, fetchTasks]);

    const handleDeleteTask = async (task) => {
        deleteTaskApi({ task_id: task.task_id })
            .then(data => {
                fetchTasks().then(data => {
                    MessagePlugin.success("删除任务成功")
                })
            })
            .catch(err => {
                MessagePlugin.error("删除任务失败")
                console.log("删除任务失败", err)
            })
    }
    return (
        <>
            <Row justify="space-between" align="middle" style={{ marginTop: '2vh', width: '100%' }}>
                <Col flex="none">
                    <h2>任务列表</h2>
                </Col>
                <Row>
                    <Col style={{ marginTop: "5px" }}>
                        <Space>
                            <span>总意向数：{totalIntentions}个</span>
                            {isCollectable === true ? <span>评论收集额度：{nowLimit}/{totalLimit}</span> :
                                <span style={{ color: 'red' }}>已超出月额度：{nowLimit}/{totalLimit}</span>}
                        </Space>
                    </Col>
                </Row>
            </Row>
            <Table
                rowKey="task_id"
                columns={columns}
                data={tasks}
                size="small"
                bordered
                hover
            />
            <Space style={{ marginTop: '10px', justifyContent: 'space-between', width: '100%' }}>
                <div></div>
                <Pagination
                    showJumper
                    total={totalTasks}
                    current={currentPage}
                    pageSize={pageSize}
                    onChange={(pageInfo) => handlePageChange(pageInfo.current, pageInfo.pageSize)}
                    pageSizeOptions={[5, 10, 20]}
                />
            </Space>
        </ >
    );
};

export default CollectionTaskTable;
